import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OIDC_CALLBACK_URL, SAML_SUCCESS_REDIRECT } from '@config';
import { getOidcConfiguration, loadOpenidClient } from '@/oidc/oidc-client';
import { createOidcRouter } from '@/oidc/oidc-router';
import { createSessionUserFromOidcClaims, OidcLoginError } from '@/oidc/oidc-session-user';
import { exchangeOidcTokenForWso2UserToken } from '@/oidc/wso2-user-token';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import request from 'supertest';

const tokenExchange = vi.hoisted(() => ({ isEnabled: false }));

vi.mock('@config', async importOriginal => ({
  ...(await importOriginal<typeof import('@config')>()),
  get WSO2_USER_TOKEN_EXCHANGE_ENABLED() {
    return tokenExchange.isEnabled;
  },
}));
vi.mock('@/oidc/oidc-client', () => ({ loadOpenidClient: vi.fn(), getOidcConfiguration: vi.fn() }));
vi.mock('@/oidc/oidc-session-user', () => ({
  createSessionUserFromOidcClaims: vi.fn(),
  OidcLoginError: class extends Error {
    constructor(public readonly name: string) {
      super(name);
    }
  },
}));
vi.mock('@/oidc/wso2-user-token', async importOriginal => ({
  ...(await importOriginal<typeof import('@/oidc/wso2-user-token')>()),
  exchangeOidcTokenForWso2UserToken: vi.fn(),
}));
vi.mock('@middlewares/auth-limiter.middleware', () => ({
  authLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

const FRONTEND_URL = 'http://localhost:3000';
const DISCOVERED_CONFIGURATION = { issuer: 'https://idp.example' };

const openidClientDouble = {
  randomPKCECodeVerifier: () => 'code-verifier',
  calculatePKCECodeChallenge: async () => 'code-challenge',
  randomState: () => 'expected-state',
  randomNonce: () => 'expected-nonce',
  buildAuthorizationUrl: (_configuration: unknown, parameters: Record<string, string>) =>
    new URL(`https://idp.example/authorize?${new URLSearchParams(parameters)}`),
  authorizationCodeGrant: vi.fn(),
  fetchUserInfo: vi.fn(),
  buildEndSessionUrl: vi.fn(),
};

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user as Express.User));

const createTestApp = () => {
  const app = express();
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/api/oidc', createOidcRouter());
  app.get('/api/session-user', (req, res) => {
    res.json({
      username: req.user?.username,
      hasAccessToken: req.user?.accessToken === 'user-access-token',
      authenticationMethod: req.user?.authenticationMethod,
      wso2UserToken: req.user?.wso2UserToken?.accessToken,
    });
  });
  return app;
};

const loginThroughIdp = async (
  agent: ReturnType<typeof request.agent>,
  loginQuery = `successRedirect=${FRONTEND_URL}/min-personakt&failureRedirect=${FRONTEND_URL}/login`,
) => {
  await agent.get(`/api/oidc/login?${loginQuery}`).expect(302);
  return agent.get('/api/oidc/login/callback?code=authorization-code&state=expected-state').expect(302);
};

describe('OIDC router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenExchange.isEnabled = false;
    vi.restoreAllMocks();
    vi.mocked(loadOpenidClient).mockResolvedValue(openidClientDouble as never);
    vi.mocked(getOidcConfiguration).mockResolvedValue(DISCOVERED_CONFIGURATION as never);
    vi.mocked(createSessionUserFromOidcClaims).mockResolvedValue({ username: 'tes01tes' } as never);
    openidClientDouble.authorizationCodeGrant.mockResolvedValue({
      access_token: 'user-access-token',
      id_token: 'user-id-token',
      expiresIn: () => 300,
      claims: () => ({ sub: 'idp-subject-1', preferred_username: 'tes01tes' }),
    });
    openidClientDouble.fetchUserInfo.mockResolvedValue({ sub: 'idp-subject-1' });
  });

  it('redirects the browser to the IdP with PKCE S256, state and nonce', async () => {
    const response = await request(createTestApp()).get('/api/oidc/login').expect(302);

    expect(Object.fromEntries(new URL(response.headers.location).searchParams)).toEqual({
      redirect_uri: OIDC_CALLBACK_URL,
      scope: 'openid profile email',
      code_challenge: 'code-challenge',
      code_challenge_method: 'S256',
      state: 'expected-state',
      nonce: 'expected-nonce',
    });
  });

  it('redirects back with OIDC_DISCOVERY_FAILED when the IdP cannot be reached', async () => {
    vi.mocked(getOidcConfiguration).mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await request(createTestApp())
      .get(`/api/oidc/login?failureRedirect=${FRONTEND_URL}/login`)
      .expect(302);

    expect(response.headers.location).toBe(`${FRONTEND_URL}/login?failMessage=OIDC_DISCOVERY_FAILED`);
  });

  it('logs the user in with the verified code grant and keeps the access token in the server side session', async () => {
    const agent = request.agent(createTestApp());

    const callback = await loginThroughIdp(agent);

    expect(openidClientDouble.authorizationCodeGrant).toHaveBeenCalledWith(
      DISCOVERED_CONFIGURATION,
      new URL(`${OIDC_CALLBACK_URL}?code=authorization-code&state=expected-state`),
      {
        pkceCodeVerifier: 'code-verifier',
        expectedState: 'expected-state',
        expectedNonce: 'expected-nonce',
        idTokenExpected: true,
      },
    );
    expect(callback.headers.location).toBe(`${FRONTEND_URL}/min-personakt`);
    expect((await agent.get('/api/session-user')).body).toEqual({
      username: 'tes01tes',
      hasAccessToken: true,
      authenticationMethod: 'OIDC',
    });
  });

  it('issues a new session cookie at login so a session id set before login cannot be fixated', async () => {
    const agent = request.agent(createTestApp());
    const login = await agent.get('/api/oidc/login').expect(302);
    const sessionCookieBeforeLogin = login.headers['set-cookie']?.[0]?.split(';')[0];

    const callback = await agent.get('/api/oidc/login/callback?code=authorization-code&state=expected-state');
    const sessionCookieAfterLogin = callback.headers['set-cookie']?.[0]?.split(';')[0];

    expect(sessionCookieBeforeLogin).toMatch(/^connect\.sid=/);
    expect(sessionCookieAfterLogin).toMatch(/^connect\.sid=/);
    expect(sessionCookieAfterLogin).not.toBe(sessionCookieBeforeLogin);
  });

  it('adds the userinfo claims to the ID token claims and lets the ID token win on conflicts', async () => {
    openidClientDouble.fetchUserInfo.mockResolvedValue({
      sub: 'idp-subject-1',
      preferred_username: 'annan01',
      citizenIdentifier: '199001012385',
    });

    await loginThroughIdp(request.agent(createTestApp()));

    expect(openidClientDouble.fetchUserInfo).toHaveBeenCalledWith(
      DISCOVERED_CONFIGURATION,
      'user-access-token',
      'idp-subject-1',
    );
    expect(createSessionUserFromOidcClaims).toHaveBeenCalledWith({
      sub: 'idp-subject-1',
      preferred_username: 'tes01tes',
      citizenIdentifier: '199001012385',
    });
  });

  it('logs the user in with the ID token claims only when userinfo cannot be fetched', async () => {
    openidClientDouble.fetchUserInfo.mockRejectedValue(new Error('unexpected "sub" claim value'));
    const agent = request.agent(createTestApp());

    const callback = await loginThroughIdp(agent);

    expect(createSessionUserFromOidcClaims).toHaveBeenCalledWith({
      sub: 'idp-subject-1',
      preferred_username: 'tes01tes',
    });
    expect(callback.headers.location).toBe(`${FRONTEND_URL}/min-personakt`);
  });

  it('exchanges the access token for a WSO2 user token at login when the token exchange is enabled', async () => {
    tokenExchange.isEnabled = true;
    vi.mocked(exchangeOidcTokenForWso2UserToken).mockResolvedValue({
      accessToken: 'wso2-user-token',
      expiresAt: Date.now() + 3600 * 1000,
    });
    const agent = request.agent(createTestApp());

    const callback = await loginThroughIdp(agent);

    expect(exchangeOidcTokenForWso2UserToken).toHaveBeenCalledWith('user-access-token');
    expect(callback.headers.location).toBe(`${FRONTEND_URL}/min-personakt`);
    expect((await agent.get('/api/session-user')).body).toMatchObject({ wso2UserToken: 'wso2-user-token' });
  });

  it('creates no session and reports OIDC_TOKEN_EXCHANGE_FAILED when WSO2 rejects the exchange', async () => {
    tokenExchange.isEnabled = true;
    vi.mocked(exchangeOidcTokenForWso2UserToken).mockRejectedValue(new Error('invalid_grant'));
    const agent = request.agent(createTestApp());

    const callback = await loginThroughIdp(agent);

    expect(callback.headers.location).toBe(`${FRONTEND_URL}/login?failMessage=OIDC_TOKEN_EXCHANGE_FAILED`);
    expect((await agent.get('/api/session-user')).body).toEqual({ hasAccessToken: false });
  });

  it('does not exchange tokens when the token exchange is disabled', async () => {
    await loginThroughIdp(request.agent(createTestApp()));

    expect(exchangeOidcTokenForWso2UserToken).not.toHaveBeenCalled();
  });

  it('ignores a success redirect outside the allowed origins', async () => {
    const agent = request.agent(createTestApp());

    const callback = await loginThroughIdp(agent, 'successRedirect=https://evil.example/phishing');

    expect(callback.headers.location).toBe(SAML_SUCCESS_REDIRECT);
  });

  it('rejects a callback without a pending login in the session', async () => {
    const response = await request(createTestApp())
      .get('/api/oidc/login/callback?code=authorization-code&state=expected-state')
      .expect(302);

    expect(response.headers.location).toBe(`${SAML_SUCCESS_REDIRECT}/?failMessage=OIDC_UNKNOWN_ERROR`);
    expect(openidClientDouble.authorizationCodeGrant).not.toHaveBeenCalled();
  });

  it('rejects a replayed callback because the pending login is consumed', async () => {
    const agent = request.agent(createTestApp());
    await loginThroughIdp(agent);

    const replay = await agent.get('/api/oidc/login/callback?code=authorization-code&state=expected-state').expect(302);

    expect(replay.headers.location).toContain('failMessage=OIDC_UNKNOWN_ERROR');
    expect(openidClientDouble.authorizationCodeGrant).toHaveBeenCalledTimes(1);
  });

  it('forwards the login failure name and creates no session when the user is not authorized', async () => {
    vi.mocked(createSessionUserFromOidcClaims).mockRejectedValue(new OidcLoginError('OIDC_MISSING_GROUP'));
    const agent = request.agent(createTestApp());

    const callback = await loginThroughIdp(agent);

    expect(callback.headers.location).toBe(`${FRONTEND_URL}/login?failMessage=OIDC_MISSING_GROUP`);
    expect((await agent.get('/api/session-user')).body).toEqual({ hasAccessToken: false });
  });

  it('hides token endpoint and validation errors behind OIDC_UNKNOWN_ERROR', async () => {
    openidClientDouble.authorizationCodeGrant.mockRejectedValue(new Error('unexpected JWT "nonce" claim value'));
    const agent = request.agent(createTestApp());

    const callback = await loginThroughIdp(agent);

    expect(callback.headers.location).toBe(`${FRONTEND_URL}/login?failMessage=OIDC_UNKNOWN_ERROR`);
  });

  it('ends the session at the IdP with the ID token as hint on logout', async () => {
    openidClientDouble.buildEndSessionUrl.mockReturnValue(new URL('https://idp.example/end-session'));
    const agent = request.agent(createTestApp());
    await loginThroughIdp(agent);

    const logout = await agent.get(`/api/oidc/logout?successRedirect=${FRONTEND_URL}/login?loggedout`).expect(302);

    expect(openidClientDouble.buildEndSessionUrl).toHaveBeenCalledWith(DISCOVERED_CONFIGURATION, {
      id_token_hint: 'user-id-token',
      post_logout_redirect_uri: `${FRONTEND_URL}/login?loggedout`,
    });
    expect(logout.headers.location).toBe('https://idp.example/end-session');
    expect((await agent.get('/api/session-user')).body).toEqual({ hasAccessToken: false });
  });

  it('falls back to a local logout when the IdP offers no end session endpoint', async () => {
    openidClientDouble.buildEndSessionUrl.mockImplementation(() => {
      throw new Error('end_session_endpoint missing');
    });
    const agent = request.agent(createTestApp());
    await loginThroughIdp(agent);

    const logout = await agent.get(`/api/oidc/logout?successRedirect=${FRONTEND_URL}/login?loggedout`).expect(302);

    expect(logout.headers.location).toBe(`${FRONTEND_URL}/login?loggedout`);
    expect((await agent.get('/api/session-user')).body).toEqual({ hasAccessToken: false });
  });
});
