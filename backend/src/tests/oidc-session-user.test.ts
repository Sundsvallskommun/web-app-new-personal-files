import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionUserFromOidcClaims, OidcLoginError } from '@/oidc/oidc-session-user';
import { createSessionUser } from '@services/session-user.service';

const usernameClaim = vi.hoisted(() => ({ name: 'preferred_username' }));

vi.mock('@config', async importOriginal => ({
  ...(await importOriginal<typeof import('@config')>()),
  get OIDC_USERNAME_CLAIM() {
    return usernameClaim.name;
  },
}));
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
    usernameClaim.name = 'preferred_username';
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

  it('reads the username from the claim named in OIDC_USERNAME_CLAIM, as OneGate sends it in sub', async () => {
    usernameClaim.name = 'sub';
    const { preferred_username: _preferredUsername, ...remainingClaims } = authorizedEmployeeClaims();

    await createSessionUserFromOidcClaims({ ...remainingClaims, sub: 'kri16abe' });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ username: 'kri16abe' }));
  });

  it('ignores preferred_username when OIDC_USERNAME_CLAIM names another claim', async () => {
    usernameClaim.name = 'sub';

    await createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), sub: 'kri16abe' });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ username: 'kri16abe' }));
  });

  it('rejects with OIDC_MISSING_ATTRIBUTES when the configured username claim is not a string', async () => {
    usernameClaim.name = 'sub';

    await expect(
      createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), sub: ['kri16abe', 'annan01'] }),
    ).rejects.toMatchObject({ name: 'OIDC_MISSING_ATTRIBUTES' });
    expect(createSessionUser).not.toHaveBeenCalled();
  });

  it('uses the first name when a test person with two AD accounts gets family_name as an array', async () => {
    await createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), family_name: ['Dubbeltest', 'KSK Dig It'] });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ surname: 'Dubbeltest' }));
  });

  it('rejects with OIDC_MISSING_ATTRIBUTES when the name array holds no usable name', async () => {
    await expect(
      createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), family_name: ['', 42] }),
    ).rejects.toMatchObject({ name: 'OIDC_MISSING_ATTRIBUTES' });
    expect(createSessionUser).not.toHaveBeenCalled();
  });

  it('rejects with OIDC_MISSING_ATTRIBUTES when the username claim is an array', async () => {
    await expect(
      createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), preferred_username: ['rap32fas', 'annan01'] }),
    ).rejects.toMatchObject({ name: 'OIDC_MISSING_ATTRIBUTES' });
    expect(createSessionUser).not.toHaveBeenCalled();
  });

  it('accepts groups delivered as a comma separated string', async () => {
    await createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), groups: 'test_admin' });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ groups: 'test_admin' }));
  });

  it('accepts the groups in the roles claim that MobilityGuard sends', async () => {
    const { groups, ...remainingClaims } = authorizedEmployeeClaims();

    await createSessionUserFromOidcClaims({ ...remainingClaims, roles: groups });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ groups: 'unrelated_group,TEST_USER' }));
  });

  it('prefers the groups claim over the roles claim when both are present', async () => {
    await createSessionUserFromOidcClaims({ ...authorizedEmployeeClaims(), roles: ['test_admin'] });

    expect(createSessionUser).toHaveBeenCalledWith(expect.objectContaining({ groups: 'unrelated_group,TEST_USER' }));
  });

  it('rejects with OIDC_MISSING_GROUP when the roles claim holds no authorized group', async () => {
    const { groups: _groups, ...remainingClaims } = authorizedEmployeeClaims();

    await expect(
      createSessionUserFromOidcClaims({ ...remainingClaims, roles: ['unrelated_group'] }),
    ).rejects.toMatchObject({ name: 'OIDC_MISSING_GROUP' });
    expect(createSessionUser).not.toHaveBeenCalled();
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
