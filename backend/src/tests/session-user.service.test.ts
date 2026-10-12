import { resolvePersonIdByLoginName } from '@services/persondata.service';
import { createSessionUser } from '@services/session-user.service';

jest.mock('@services/persondata.service', () => ({ resolvePersonIdByLoginName: jest.fn() }));

const authenticatedEmployee = {
  givenName: 'Test',
  surname: 'Testsson',
  username: 'tes01tes',
  email: 'test.testsson@example.com',
  citizenIdentifier: '199001012385',
};

describe('createSessionUser', () => {
  beforeEach(() => {
    jest.mocked(resolvePersonIdByLoginName).mockReset().mockResolvedValue('person-id-1');
  });

  it('builds the session user shared by SAML and OIDC logins', async () => {
    const user = await createSessionUser({ ...authenticatedEmployee, groups: 'PF_TEST_USER,unrelated_group' });

    expect(resolvePersonIdByLoginName).toHaveBeenCalledWith('tes01tes');
    expect(user).toEqual({
      personId: 'person-id-1',
      personalNumber: '199001012385',
      name: 'Test Testsson',
      givenName: 'Test',
      surname: 'Testsson',
      username: 'tes01tes',
      email: 'test.testsson@example.com',
      groups: ['pf_test_user', 'unrelated_group'],
      systemRole: 'pf_hr_user',
      ADgroups: 'PF_TEST_USER,unrelated_group',
      permissions: {
        canReadOwnPF: true,
        canReadOwnDocs: true,
        canReadPF: false,
        canUploadDocs: false,
        canReadDocs: false,
        canDeleteDocs: false,
      },
    });
  });

  it('gives the role with the most permissions when the user is in several authorized groups', async () => {
    const user = await createSessionUser({ ...authenticatedEmployee, groups: 'pf_test_user,pf_test_superadmin' });

    expect(user.systemRole).toBe('pf_hr_superadmin');
    expect(user.permissions.canDeleteDocs).toBe(true);
  });

  it('leaves the personal number empty when the identity has no citizen identifier', async () => {
    const user = await createSessionUser({
      ...authenticatedEmployee,
      citizenIdentifier: undefined,
      groups: 'pf_test_user',
    });

    expect(user.personalNumber).toBe('');
  });
});
