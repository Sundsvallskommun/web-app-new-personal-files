import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '@config';
import { getOidcConfiguration, loadOpenidClient } from '@/oidc/oidc-client';
import {
  exchangeOidcTokenForApiGatewayUserToken,
  freshApiGatewayUserAccessToken,
  sessionTokensFromOidcResponse,
} from '@/oidc/api-gateway-user-token';
import { HttpException } from '@exceptions/HttpException';
import { User } from '@interfaces/users.interface';
import { applyCurrentPermissionsToSessionUser } from '@services/authorization.service';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import qs from 'qs';
import request from 'supertest';

const { tokenEndpoint } = vi.hoisted(() => ({ tokenEndpoint: vi.fn() }));

vi.mock('axios', async importOriginal => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: Object.assign(tokenEndpoint, { isAxiosError: () => false }) };
});
vi.mock('@/oidc/oidc-client', () => ({ loadOpenidClient: vi.fn(), getOidcConfiguration: vi.fn() }));

const ONE_HOUR_MS = 60 * 60 * 1000;
const DISCOVERED_CONFIGURATION = { issuer: 'https://idp.example' };

const openidClientDouble = { refreshTokenGrant: vi.fn() };

let sessionCounter = 0;

const exchangeRequestBody = (callIndex = 0) => qs.parse(tokenEndpoint.mock.calls[callIndex][0].data);

const oidcUserWithExpiredApiGatewayToken = (overrides: Partial<User> = {}) => {
  sessionCounter += 1;
  return {
    username: 'tes01tes',
    groups: ['test_user'],
    accessToken: `mobilityguard-access-token-${sessionCounter}`,
    accessTokenExpiresAt: Date.now() + ONE_HOUR_MS,
    idToken: 'mobilityguard-id-token',
    refreshToken: 'mobilityguard-refresh-token',
    apiGatewayUserToken: { accessToken: 'expired-api-gateway-user-token', expiresAt: Date.now() - 1000 },
    ...overrides,
  } as User;
};

const copyOfSessionUser = (user: User) => structuredClone(user);

const rotatingRefreshResponse = {
  access_token: 'refreshed-mobilityguard-access-token',
  refresh_token: 'rotated-refresh-token',
  expiresIn: () => 300,
};

describe('API gateway user token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenEndpoint.mockResolvedValue({ data: { access_token: 'api-gateway-user-token', expires_in: 3600 } });
    vi.mocked(loadOpenidClient).mockResolvedValue(openidClientDouble as never);
    vi.mocked(getOidcConfiguration).mockResolvedValue(DISCOVERED_CONFIGURATION as never);
  });

  it('exchanges the MobilityGuard token with the JWT bearer grant and the application credentials', async () => {
    const apiGatewayUserToken = await exchangeOidcTokenForApiGatewayUserToken('mobilityguard-access-token');

    const request = tokenEndpoint.mock.calls[0][0];
    expect(request).toMatchObject({
      method: 'POST',
      url: `${API_BASE_URL}/token`,
      headers: { Authorization: `Basic ${Buffer.from('test-client-key:test-client-secret').toString('base64')}` },
    });
    expect(exchangeRequestBody()).toEqual({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 'mobilityguard-access-token',
    });
    expect(apiGatewayUserToken.accessToken).toBe('api-gateway-user-token');
    expect(apiGatewayUserToken.expiresAt).toBeGreaterThan(Date.now());
  });

  it('keeps the previous ID and refresh token when the IdP does not rotate them', () => {
    const refreshed = sessionTokensFromOidcResponse(
      { access_token: 'new-access-token', expiresIn: () => 300 } as never,
      {
        idToken: 'previous-id-token',
        refreshToken: 'previous-refresh-token',
      },
    );

    expect(refreshed).toMatchObject({
      accessToken: 'new-access-token',
      idToken: 'previous-id-token',
      refreshToken: 'previous-refresh-token',
    });
  });

  it('reuses an API gateway user token that is still valid', async () => {
    const user = oidcUserWithExpiredApiGatewayToken({
      apiGatewayUserToken: { accessToken: 'valid-api-gateway-user-token', expiresAt: Date.now() + ONE_HOUR_MS },
    });

    await expect(freshApiGatewayUserAccessToken(user)).resolves.toBe('valid-api-gateway-user-token');
    expect(tokenEndpoint).not.toHaveBeenCalled();
  });

  it('exchanges the still valid MobilityGuard token again when the API gateway user token has expired', async () => {
    const user = oidcUserWithExpiredApiGatewayToken();
    const mobilityGuardAccessToken = user.accessToken;

    await expect(freshApiGatewayUserAccessToken(user)).resolves.toBe('api-gateway-user-token');
    expect(exchangeRequestBody().assertion).toBe(mobilityGuardAccessToken);
    expect(openidClientDouble.refreshTokenGrant).not.toHaveBeenCalled();
    expect(user.apiGatewayUserToken?.accessToken).toBe('api-gateway-user-token');
  });

  it('refreshes an expired MobilityGuard token before exchanging it and keeps the new tokens on the session user', async () => {
    openidClientDouble.refreshTokenGrant.mockResolvedValue(rotatingRefreshResponse);
    const user = oidcUserWithExpiredApiGatewayToken({ accessTokenExpiresAt: Date.now() - 1000 });

    await freshApiGatewayUserAccessToken(user);

    expect(openidClientDouble.refreshTokenGrant).toHaveBeenCalledWith(
      DISCOVERED_CONFIGURATION,
      'mobilityguard-refresh-token',
    );
    expect(exchangeRequestBody().assertion).toBe('refreshed-mobilityguard-access-token');
    expect(user).toMatchObject({
      accessToken: 'refreshed-mobilityguard-access-token',
      refreshToken: 'rotated-refresh-token',
      apiGatewayUserToken: { accessToken: 'api-gateway-user-token' },
    });
  });

  it('shares one renewal between parallel requests that each loaded their own copy of the session', async () => {
    openidClientDouble.refreshTokenGrant.mockResolvedValue(rotatingRefreshResponse);
    const sessionUser = oidcUserWithExpiredApiGatewayToken({ accessTokenExpiresAt: Date.now() - 1000 });
    const firstRequestUser = copyOfSessionUser(sessionUser);
    const secondRequestUser = copyOfSessionUser(sessionUser);

    await Promise.all([
      freshApiGatewayUserAccessToken(firstRequestUser),
      freshApiGatewayUserAccessToken(secondRequestUser),
    ]);

    expect(openidClientDouble.refreshTokenGrant).toHaveBeenCalledTimes(1);
    expect(tokenEndpoint).toHaveBeenCalledTimes(1);
    expect(firstRequestUser.refreshToken).toBe('rotated-refresh-token');
    expect(secondRequestUser.refreshToken).toBe('rotated-refresh-token');
  });

  it('gives a request that loaded the session before the renewal was saved the same renewed tokens', async () => {
    openidClientDouble.refreshTokenGrant.mockResolvedValue(rotatingRefreshResponse);
    const sessionUser = oidcUserWithExpiredApiGatewayToken({ accessTokenExpiresAt: Date.now() - 1000 });
    const staleRequestUser = copyOfSessionUser(sessionUser);

    await freshApiGatewayUserAccessToken(sessionUser);
    await freshApiGatewayUserAccessToken(staleRequestUser);

    expect(openidClientDouble.refreshTokenGrant).toHaveBeenCalledTimes(1);
    expect(staleRequestUser).toMatchObject({
      refreshToken: 'rotated-refresh-token',
      apiGatewayUserToken: { accessToken: 'api-gateway-user-token' },
    });
  });

  it('keeps the rotated refresh token on the session user when the API gateway exchange fails after the refresh', async () => {
    openidClientDouble.refreshTokenGrant.mockResolvedValue(rotatingRefreshResponse);
    tokenEndpoint.mockRejectedValueOnce(new Error('timeout of 30000ms exceeded'));
    const user = oidcUserWithExpiredApiGatewayToken({ accessTokenExpiresAt: Date.now() - 1000 });

    await expect(freshApiGatewayUserAccessToken(user)).rejects.toMatchObject({ status: 401 });

    expect(user).toMatchObject({
      accessToken: 'refreshed-mobilityguard-access-token',
      refreshToken: 'rotated-refresh-token',
    });
  });

  it('exchanges again without spending the rotated refresh token a second time after a failed exchange', async () => {
    openidClientDouble.refreshTokenGrant.mockResolvedValue(rotatingRefreshResponse);
    tokenEndpoint.mockRejectedValueOnce(new Error('timeout of 30000ms exceeded'));
    const sessionUser = oidcUserWithExpiredApiGatewayToken({ accessTokenExpiresAt: Date.now() - 1000 });
    const staleRequestUser = copyOfSessionUser(sessionUser);

    await expect(freshApiGatewayUserAccessToken(sessionUser)).rejects.toMatchObject({ status: 401 });
    await expect(freshApiGatewayUserAccessToken(staleRequestUser)).rejects.toMatchObject({ status: 401 });
    await expect(freshApiGatewayUserAccessToken(sessionUser)).resolves.toBe('api-gateway-user-token');

    expect(openidClientDouble.refreshTokenGrant).toHaveBeenCalledTimes(1);
    expect(staleRequestUser.refreshToken).toBe('rotated-refresh-token');
    expect(exchangeRequestBody(1).assertion).toBe('refreshed-mobilityguard-access-token');
  });

  it('tries the renewal again on the next request after a failed renewal', async () => {
    tokenEndpoint.mockRejectedValueOnce(new Error('timeout of 30000ms exceeded'));
    const user = oidcUserWithExpiredApiGatewayToken();

    await expect(freshApiGatewayUserAccessToken(user)).rejects.toMatchObject({ status: 401 });
    await expect(freshApiGatewayUserAccessToken(user)).resolves.toBe('api-gateway-user-token');
    expect(tokenEndpoint).toHaveBeenCalledTimes(2);
  });

  it('answers 401 so the user logs in again when the MobilityGuard token has expired without a refresh token', async () => {
    const user = oidcUserWithExpiredApiGatewayToken({
      accessTokenExpiresAt: Date.now() - 1000,
      refreshToken: undefined,
    });

    await expect(freshApiGatewayUserAccessToken(user)).rejects.toMatchObject(new HttpException(401, 'NOT_AUTHORIZED'));
    expect(tokenEndpoint).not.toHaveBeenCalled();
  });

  it('answers 401 when the API gateway rejects the exchange', async () => {
    tokenEndpoint.mockRejectedValue(new Error('invalid_grant'));

    await expect(freshApiGatewayUserAccessToken(oidcUserWithExpiredApiGatewayToken())).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe('API gateway user token renewal through the session', () => {
  const createSessionApp = (sessionUser: User) => {
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user: { groups?: string[] }, done) =>
      done(null, applyCurrentPermissionsToSessionUser(user)),
    );

    const app = express();
    app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.get('/login', (req, res, next) => req.login(sessionUser, error => (error ? next(error) : res.sendStatus(204))));
    app.get('/call-api', async (req, res) =>
      res.json({ token: await freshApiGatewayUserAccessToken(req.user as User) }),
    );
    app.get('/stored-session-user', (req, res) =>
      res.json({
        apiGatewayUserToken: req.user?.apiGatewayUserToken?.accessToken,
        refreshToken: req.user?.refreshToken,
      }),
    );
    return app;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tokenEndpoint.mockResolvedValue({ data: { access_token: 'api-gateway-user-token', expires_in: 3600 } });
    vi.mocked(loadOpenidClient).mockResolvedValue(openidClientDouble as never);
    vi.mocked(getOidcConfiguration).mockResolvedValue(DISCOVERED_CONFIGURATION as never);
    openidClientDouble.refreshTokenGrant.mockResolvedValue(rotatingRefreshResponse);
  });

  it('saves the renewed and rotated tokens in the session so later requests do not renew again', async () => {
    const agent = request.agent(
      createSessionApp(oidcUserWithExpiredApiGatewayToken({ accessTokenExpiresAt: Date.now() - 1000 })),
    );
    await agent.get('/login').expect(204);

    await agent.get('/call-api').expect(200);

    expect((await agent.get('/stored-session-user')).body).toEqual({
      apiGatewayUserToken: 'api-gateway-user-token',
      refreshToken: 'rotated-refresh-token',
    });
  });
});
