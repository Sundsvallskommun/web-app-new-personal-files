import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePersonId } from '@services/persondata.service';
import { createSessionUser } from '@services/session-user.service';

vi.mock('@services/persondata.service', () => ({ resolvePersonId: vi.fn() }));

const authenticatedEmployee = {
  givenName: 'Test',
  surname: 'Testsson',
  username: 'tes01tes',
  email: 'test.testsson@example.com',
  citizenIdentifier: '199001012385',
};

describe('createSessionUser', () => {
  beforeEach(() => {
    vi.mocked(resolvePersonId).mockReset().mockResolvedValue('person-id-1');
  });

  it('builds the session user shared by SAML and OIDC logins', async () => {
    const user = await createSessionUser({ ...authenticatedEmployee, groups: 'TEST_USER,unrelated_group' });

    expect(resolvePersonId).toHaveBeenCalledWith('tes01tes', '199001012385');
    expect(user).toEqual({
      personId: 'person-id-1',
      personalNumber: '199001012385',
      name: 'Test Testsson',
      givenName: 'Test',
      surname: 'Testsson',
      username: 'tes01tes',
      email: 'test.testsson@example.com',
      groups: ['test_user', 'unrelated_group'],
      systemRole: 'pf_hr_user',
      ADgroups: 'TEST_USER,unrelated_group',
      permissions: {
        canReadOwnPF: true,
        canReadOwnDocs: true,
        canReadPF: false,
        canUploadDocs: false,
        canUploadAllDocs: false,
        canReadDocs: false,
        canDeleteDocs: false,
        canReadAllDocs: false,
        canReadAllPF: false,
      },
    });
  });

  it('gives the role with the most permissions when the user is in several authorized groups', async () => {
    const user = await createSessionUser({ ...authenticatedEmployee, groups: 'test_user,test_superadmin' });

    expect(user.systemRole).toBe('pf_hr_superadmin');
    expect(user.permissions.canDeleteDocs).toBe(true);
  });

  it('leaves the personal number empty when the identity has no citizen identifier', async () => {
    const user = await createSessionUser({
      ...authenticatedEmployee,
      citizenIdentifier: undefined,
      groups: 'test_user',
    });

    expect(user.personalNumber).toBe('');
  });
});
