import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { User } from '@/interfaces/users.interface';

const { axiosCall } = vi.hoisted(() => ({ axiosCall: vi.fn() }));

vi.mock('axios', async importOriginal => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: Object.assign(axiosCall, { isAxiosError: actual.default.isAxiosError }) };
});

vi.mock('@/services/api-token.service', () => ({
  createApiTokenService: () => ({ getToken: async () => 'token' }),
}));

import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { maskIdentifiers } from '@/utils/mask';

const PERSONAL_NUMBER = '199001011234';
const GUID = '0b508a73-126b-4b2a-9f3c-5c29edbb07b2';

const user = { username: 'kalle01kar' } as User;

const failWith = (status: number, data: unknown) => {
  axiosCall.mockImplementation(async config => {
    const response = { status, data, statusText: '', headers: {}, config: { ...config, headers: new AxiosHeaders() } };
    throw new AxiosError('failed', 'ERR_BAD_RESPONSE', response.config, null, response);
  });
};

const sentHeaders = () => axiosCall.mock.calls[0][0].headers;

beforeEach(() => {
  axiosCall.mockReset();
  axiosCall.mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('traceability', () => {
  it.each(['get', 'post', 'patch', 'delete'] as const)('sends X-Sent-By with the user on %s', async method => {
    await new ApiService()[method]({ url: 'employee/2.0/2281/x' }, user);

    expect(sentHeaders()['X-Sent-By']).toBe('type=adAccount; kalle01kar');
  });

  it('sends no X-Sent-By when there is no user, as for the health check', async () => {
    await new ApiService().post({ url: 'simulatorserver/2.0/simulations/response' });

    expect(sentHeaders()).not.toHaveProperty('X-Sent-By');
  });
});

describe('logging a failed downstream call', () => {
  const loggedError = () => vi.mocked(logger.error).mock.calls.flat().join(' ');

  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => logger);
  });

  it('logs method, path and status without personal number, GUID, query or body', async () => {
    failWith(404, { detail: `No person ${PERSONAL_NUMBER}` });

    await expect(
      new ApiService().get({ url: `citizen/3.0/2281/${PERSONAL_NUMBER}/guid?PersonId=${GUID}` }, user),
    ).rejects.toMatchObject({ status: 404 });

    const line = loggedError();
    expect(line).toContain('GET');
    expect(line).toContain('/citizen/3.0/2281/19900101****/guid');
    expect(line).toContain('404');
    expect(line).not.toContain(PERSONAL_NUMBER);
    expect(line).not.toContain(GUID);
    expect(line).not.toContain('PersonId');
    expect(line).not.toContain('No person');
  });

  it('masks a GUID in the path', async () => {
    failWith(500, {});

    await new ApiService().get({ url: `employee/2.0/2281/${GUID}/endedemployments` }, user).catch(() => undefined);

    expect(loggedError()).not.toContain(GUID);
  });

  it('masks the path when there is no response at all', async () => {
    axiosCall.mockRejectedValue(new Error('ECONNREFUSED'));

    await new ApiService().get({ url: `citizen/3.0/2281/${PERSONAL_NUMBER}/guid` }, user).catch(() => undefined);

    expect(loggedError()).not.toContain(PERSONAL_NUMBER);
  });
});

describe('maskIdentifiers', () => {
  it.each([
    [`/citizen/2281/${PERSONAL_NUMBER}/guid`, '/citizen/2281/19900101****/guid'],
    ['/citizen/2281/9001011234/guid', '/citizen/2281/900101****/guid'],
    ['/x/19900101-1234', '/x/19900101****'],
    [
      `/getemployments/${GUID}/employeeEmployments`,
      '/getemployments/********-****-****-****-************/employeeEmployments',
    ],
    [`/getemployments/${GUID.toUpperCase()}/x`, '/getemployments/********-****-****-****-************/x'],
    ['/document/2024-0001-0001/files/abc', '/document/2024-0001-0001/files/abc'],
    ['/employments?CompanyId=1&isManual=0', '/employments?CompanyId=1&isManual=0'],
  ])('masks %s', (input, expected) => {
    expect(maskIdentifiers(input)).toBe(expected);
  });
});
