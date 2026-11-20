import { authApiURL } from '@utils/auth-api-url';

describe('authApiURL', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_OIDC_ENABLED;
  });

  it.each(['login', 'logout'] as const)('points %s at SAML when the OIDC flag is not set', (action) => {
    expect(authApiURL(action)).toBe(`http://localhost:3001/api/saml/${action}`);
  });

  it.each(['false', '', 'NEXT_PUBLIC_OIDC_ENABLED_PLACEHOLDER'])(
    'points login at SAML when the OIDC flag is %p',
    (flag) => {
      process.env.NEXT_PUBLIC_OIDC_ENABLED = flag;

      expect(authApiURL('login')).toBe('http://localhost:3001/api/saml/login');
    }
  );

  it.each(['login', 'logout'] as const)('points %s at OIDC when the OIDC flag is true', (action) => {
    process.env.NEXT_PUBLIC_OIDC_ENABLED = 'true';

    expect(authApiURL(action)).toBe(`http://localhost:3001/api/oidc/${action}`);
  });
});
