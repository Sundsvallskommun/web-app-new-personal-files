import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { InternalRole } from '@/interfaces/users.interface';
import { getPermissions } from '@/services/authorization.service';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('@/services/api.service', () => ({
  default: class {
    get = apiGet;
  },
}));

import { assertCanReadPerson, getActingPersonId, isManagerDirectReport } from '@/services/access.service';
import { EmployeeController } from '@/controllers/employee.controller';

const SELF = 'self-person-id';
const REPORT = 'report-person-id';
const STRANGER = 'stranger-person-id';
const UNKNOWN = 'unknown-person-id';

const notFound = () => Object.assign(new Error('Not found'), { status: 404 });

let managerReports: { personId: string; employments: { employmentId: number }[] }[] | 'missing';
let portalPersonId: string;
let citizenGuid: string;

const routeApi = (url: string) => {
  if (url.includes('/manageremployees/')) {
    if (managerReports === 'missing') throw notFound();
    return { data: { data: managerReports } };
  }
  if (url.includes('/portalpersondata/PERSONAL/')) {
    if (!portalPersonId) throw notFound();
    return { data: { personid: portalPersonId } };
  }
  if (url.includes('/guid')) return { data: citizenGuid };
  return { data: [] };
};

beforeEach(() => {
  managerReports = [{ personId: REPORT, employments: [{ employmentId: 7 }] }];
  portalPersonId = SELF;
  citizenGuid = '';
  apiGet.mockReset();
  apiGet.mockImplementation(async ({ url }: { url: string }) => routeApi(url));
});

const requestAs = (role: InternalRole, overrides: Partial<RequestWithUser['user']> = {}): RequestWithUser =>
  ({
    user: {
      personId: SELF,
      username: 'self.user',
      personalNumber: '199001011234',
      name: 'Self User',
      givenName: 'Self',
      surname: 'User',
      email: '',
      workTitle: '',
      ADgroups: '',
      systemRole: role,
      permissions: getPermissions([role], true),
      ...overrides,
    },
  }) as RequestWithUser;

const calledUrls = () => apiGet.mock.calls.map(([config]) => (config as { url: string }).url);

describe('assertCanReadPerson', () => {
  describe('pf_hr_user', () => {
    it('allows their own personId', async () => {
      await expect(assertCanReadPerson(requestAs('pf_hr_user'), SELF)).resolves.toBeUndefined();
    });

    it('denies someone else with 403', async () => {
      await expect(assertCanReadPerson(requestAs('pf_hr_user'), STRANGER)).rejects.toMatchObject({ status: 403 });
    });

    it('denies a direct report of someone else, since the role is not a manager', async () => {
      await expect(assertCanReadPerson(requestAs('pf_hr_user'), REPORT)).rejects.toMatchObject({ status: 403 });
      expect(calledUrls().some(url => url.includes('/manageremployees/'))).toBe(false);
    });
  });

  describe('pf_hr_admin', () => {
    it('allows themselves', async () => {
      await expect(assertCanReadPerson(requestAs('pf_hr_admin'), SELF)).resolves.toBeUndefined();
    });

    it('allows a current direct report', async () => {
      await expect(assertCanReadPerson(requestAs('pf_hr_admin'), REPORT)).resolves.toBeUndefined();
    });

    it('looks up the reports of the session manager', async () => {
      await assertCanReadPerson(requestAs('pf_hr_admin'), REPORT);

      expect(calledUrls()).toContainEqual(expect.stringContaining(`/manageremployees/${SELF}/details`));
    });

    it('denies a person who is not a direct report', async () => {
      await expect(assertCanReadPerson(requestAs('pf_hr_admin'), STRANGER)).rejects.toMatchObject({ status: 403 });
    });

    it('denies everyone but themselves when they have no reports', async () => {
      managerReports = 'missing';

      await expect(assertCanReadPerson(requestAs('pf_hr_admin'), REPORT)).rejects.toMatchObject({ status: 403 });
    });
  });

  it.each<InternalRole>(['pf_hr_superuser', 'pf_hr_editor', 'pf_hr_superadmin'])(
    '%s may read anyone without a manager lookup',
    async role => {
      await expect(assertCanReadPerson(requestAs(role), STRANGER)).resolves.toBeUndefined();
      expect(apiGet).not.toHaveBeenCalled();
    },
  );

  it.each<InternalRole>(['pf_hr_user', 'pf_hr_admin'])(
    '%s gets the same answer for an unknown personId as for a foreign one',
    async role => {
      const foreign = await assertCanReadPerson(requestAs(role), STRANGER).catch(e => e);
      const unknown = await assertCanReadPerson(requestAs(role), UNKNOWN).catch(e => e);

      expect({ status: unknown.status, message: unknown.message }).toEqual({
        status: foreign.status,
        message: foreign.message,
      });
    },
  );

  it('denies an empty personId', async () => {
    await expect(assertCanReadPerson(requestAs('pf_hr_admin'), '')).rejects.toMatchObject({ status: 403 });
  });
});

describe('getActingPersonId', () => {
  it('uses the personId on the session', async () => {
    await expect(getActingPersonId(requestAs('pf_hr_user'))).resolves.toBe(SELF);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('resolves by login name when the session has none', async () => {
    portalPersonId = 'resolved-by-login';

    await expect(getActingPersonId(requestAs('pf_hr_user', { personId: '' }))).resolves.toBe('resolved-by-login');
  });

  it('falls back to the personal number when the login name gives nothing', async () => {
    portalPersonId = '';
    citizenGuid = 'resolved-by-citizen';

    await expect(getActingPersonId(requestAs('pf_hr_user', { personId: '' }))).resolves.toBe('resolved-by-citizen');
  });

  it('saves a resolved personId to the session, so it is looked up once', async () => {
    portalPersonId = 'resolved-by-login';
    const req = requestAs('pf_hr_user', { personId: '' });
    const sessionUser = { personId: '' };
    Object.assign(req, { session: { passport: { user: sessionUser } } });

    await getActingPersonId(req);
    await getActingPersonId(req);

    expect(sessionUser.personId).toBe('resolved-by-login');
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it('denies when nothing resolves', async () => {
    portalPersonId = '';

    await expect(getActingPersonId(requestAs('pf_hr_user', { personId: '' }))).rejects.toMatchObject({ status: 403 });
  });
});

describe('isManagerDirectReport', () => {
  it('accepts an employment of a current report', async () => {
    await expect(isManagerDirectReport(requestAs('pf_hr_admin'), REPORT, '7')).resolves.toBe(true);
  });

  it('rejects another employment of the same report', async () => {
    await expect(isManagerDirectReport(requestAs('pf_hr_admin'), REPORT, '8')).resolves.toBe(false);
  });

  it('rejects a person who is not a report', async () => {
    await expect(isManagerDirectReport(requestAs('pf_hr_admin'), STRANGER, '7')).resolves.toBe(false);
  });
});

describe('EmployeeController', () => {
  const controller = new EmployeeController();

  it.each([
    ['employeeEmployments', (req: RequestWithUser, id: string) => controller.employeeEmployments(req, id)],
    ['endedEmployments', (req: RequestWithUser, id: string) => controller.endedEmployments(req, id)],
    ['loginName', (req: RequestWithUser, id: string) => controller.loginName(req, id)],
  ])('%s checks access before calling downstream', async (_name, call) => {
    await expect(call(requestAs('pf_hr_user'), STRANGER)).rejects.toMatchObject({ status: 403 });
    expect(calledUrls().some(url => url.includes(STRANGER))).toBe(false);

    await expect(call(requestAs('pf_hr_admin'), REPORT)).resolves.toBeDefined();
  });

  it('managerEmployees uses the session manager, whatever managerId the client sent', async () => {
    await controller.managerEmployees(requestAs('pf_hr_admin'), {});

    expect(calledUrls()).toContainEqual(expect.stringContaining(`/manageremployees/${SELF}/details`));
  });

  describe('getEmployeeInfo', () => {
    it('allows the own login name, case-insensitively', async () => {
      await expect(controller.getEmployeeInfo(requestAs('pf_hr_user'), 'SELF.USER')).resolves.toBeDefined();
    });

    it.each<InternalRole>(['pf_hr_user', 'pf_hr_admin'])('denies %s another login name', async role => {
      await expect(controller.getEmployeeInfo(requestAs(role), 'someone.else')).rejects.toMatchObject({
        status: 403,
      });
      expect(apiGet).not.toHaveBeenCalled();
    });

    it('allows canReadAllPF another login name', async () => {
      await expect(controller.getEmployeeInfo(requestAs('pf_hr_superuser'), 'someone.else')).resolves.toBeDefined();
    });
  });
});
