import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionUserFromOidcClaims, OidcLoginError } from '@/oidc/oidc-session-user';
import { createSessionUser } from '@services/session-user.service';

vi.mock('@services/session-user.service', () => ({ createSessionUser: vi.fn() }));

const authorizedEmployeeClaims = (): Record<string, unknown> => ({
  sub: 'idp-subject-1',
  given_name: 'Test',
  family_name: 'Testsson',
  preferred_username: 'tes01tes',
  email: 'test.testsson@example.com',
  groups: ['unrelated_group', 'TEST_USER'],
  citizenIdentifier: '199001012385',
});

describe('createSessionUserFromOidcClaims', () => {
  beforeEach(() => {
    vi.mocked(createSessionUser).mockReset();
  });

  it('creates the session user from the ID token claims', async () => {
    await createSessionUserFromOidcClaims(authorizedEmployeeClaims());

    expect(createSessionUser).toHaveBeenCalledWith({
      givenName: 'Test',
      surname: 'Testsson',
      username: 'tes01tes',
      email: 'test.testsson@example.com',
      groups: 'unrelated_group,TEST_USER',
      citizenIdentifier: '199001012385',
    });
  });

  it('accepts the SAML style attribute names givenName, sn and username that MobilityGuard can send', async () => {
    const { given_name, family_name, preferred_username, ...remainingClaims } = authorizedEmployeeClaims();

    await createSessionUserFromOidcClaims({
      ...remainingClaims,
      givenName: given_name,
      sn: family_name,
      username: preferred_username,
    });

    expect(createSessionUser).toHaveBeenCalledWith(
      expect.objectContaining({ givenName: 'Test', surname: 'Testsson', username: 'tes01tes' }),
    );
  });

  it('prefers the standard OIDC claim when both naming styles are present', async () => {
    await createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), givenName: 'Annat', sn: 'Namn' });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ givenName: 'Test', surname: 'Testsson' }));
  });

  it('accepts groups delivered as a comma separated string', async () => {
    await createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), groups: 'test_admin' });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ groups: 'test_admin' }));
  });

  it.each(['given_name', 'family_name', 'preferred_username'])(
    'rejects with OIDC_MISSING_ATTRIBUTES when %s is missing',
    async claim => {
      const claims = authorizedEmployeeClaims();
      delete claims[claim];

      await expect(createSessionUserFromOidcClaims(claims)).rejects.toMatchObject({ name: 'OIDC_MISSING_ATTRIBUTES' });
      expect(createSessionUser).not.toHaveBeenCalled();
    },
  );

  it.each([[['unrelated_group']], [[]], [undefined]])(
    'rejects with OIDC_MISSING_GROUP when the groups claim is %p',
    async groups => {
      const rejection = createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), groups });

      await expect(rejection).rejects.toBeInstanceOf(OidcLoginError);
      await expect(rejection).rejects.toMatchObject({ name: 'OIDC_MISSING_GROUP' });
      expect(createSessionUser).not.toHaveBeenCalled();
    },
  );
});
