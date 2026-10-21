import { getOidcConfiguration, loadOpenidClient } from '@/oidc/oidc-client';
import {
  exchangeOidcTokenForWso2UserToken,
  freshWso2UserAccessToken,
  sessionTokensFromOidcResponse,
} from '@/oidc/wso2-user-token';
import { HttpException } from '@exceptions/HttpException';
import { User } from '@interfaces/users.interface';
import axios from 'axios';
import qs from 'qs';

jest.mock('axios', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), { isAxiosError: () => false }),
}));
jest.mock('@/oidc/oidc-client', () => ({ loadOpenidClient: jest.fn(), getOidcConfiguration: jest.fn() }));

const ONE_HOUR_MS = 60 * 60 * 1000;
const DISCOVERED_CONFIGURATION = { issuer: 'https://idp.example' };

const tokenEndpoint = axios as unknown as jest.Mock;
const openidClientDouble = { refreshTokenGrant: jest.fn() };

const exchangeRequestBody = (callIndex = 0) => qs.parse(tokenEndpoint.mock.calls[callIndex][0].data);

const oidcUserWithExpiredWso2Token = (overrides: Partial<User> = {}) =>
  ({
    username: 'tes01tes',
    accessToken: 'mobilityguard-access-token',
    accessTokenExpiresAt: Date.now() + ONE_HOUR_MS,
    idToken: 'mobilityguard-id-token',
    refreshToken: 'mobilityguard-refresh-token',
    wso2UserToken: { accessToken: 'expired-wso2-user-token', expiresAt: Date.now() - 1000 },
    ...overrides,
  }) as User;

describe('WSO2 user token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenEndpoint.mockResolvedValue({ data: { access_token: 'wso2-user-token', expires_in: 3600 } });
    jest.mocked(loadOpenidClient).mockResolvedValue(openidClientDouble as never);
    jest.mocked(getOidcConfiguration).mockResolvedValue(DISCOVERED_CONFIGURATION as never);
  });

  it('exchanges the MobilityGuard token with the JWT bearer grant and the application credentials', async () => {
    const wso2UserToken = await exchangeOidcTokenForWso2UserToken('mobilityguard-access-token');

    const request = tokenEndpoint.mock.calls[0][0];
    expect(request).toMatchObject({
      method: 'POST',
      url: 'http://api.test/token',
      headers: { Authorization: `Basic ${Buffer.from('test-client-key:test-client-secret').toString('base64')}` },
    });
    expect(exchangeRequestBody()).toEqual({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 'mobilityguard-access-token',
    });
    expect(wso2UserToken.accessToken).toBe('wso2-user-token');
    expect(wso2UserToken.expiresAt).toBeGreaterThan(Date.now());
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

  it('reuses a WSO2 user token that is still valid', async () => {
    const user = oidcUserWithExpiredWso2Token({
      wso2UserToken: { accessToken: 'valid-wso2-user-token', expiresAt: Date.now() + ONE_HOUR_MS },
    });

    await expect(freshWso2UserAccessToken(user)).resolves.toBe('valid-wso2-user-token');
    expect(tokenEndpoint).not.toHaveBeenCalled();
  });

  it('exchanges the still valid MobilityGuard token again when the WSO2 user token has expired', async () => {
    const user = oidcUserWithExpiredWso2Token();

    await expect(freshWso2UserAccessToken(user)).resolves.toBe('wso2-user-token');
    expect(exchangeRequestBody().assertion).toBe('mobilityguard-access-token');
    expect(openidClientDouble.refreshTokenGrant).not.toHaveBeenCalled();
    expect(user.wso2UserToken?.accessToken).toBe('wso2-user-token');
  });

  it('refreshes an expired MobilityGuard token before exchanging it and keeps the new tokens in the session', async () => {
    openidClientDouble.refreshTokenGrant.mockResolvedValue({
      access_token: 'refreshed-mobilityguard-access-token',
      refresh_token: 'rotated-refresh-token',
      expiresIn: () => 300,
    });
    const user = oidcUserWithExpiredWso2Token({ accessTokenExpiresAt: Date.now() - 1000 });

    await freshWso2UserAccessToken(user);

    expect(openidClientDouble.refreshTokenGrant).toHaveBeenCalledWith(
      DISCOVERED_CONFIGURATION,
      'mobilityguard-refresh-token',
    );
    expect(exchangeRequestBody().assertion).toBe('refreshed-mobilityguard-access-token');
    expect(user).toMatchObject({
      accessToken: 'refreshed-mobilityguard-access-token',
      refreshToken: 'rotated-refresh-token',
    });
  });

  it('shares one renewal between parallel calls for the same session user', async () => {
    const user = oidcUserWithExpiredWso2Token();

    await Promise.all([freshWso2UserAccessToken(user), freshWso2UserAccessToken(user)]);

    expect(tokenEndpoint).toHaveBeenCalledTimes(1);
  });

  it('answers 401 so the user logs in again when the MobilityGuard token has expired without a refresh token', async () => {
    const user = oidcUserWithExpiredWso2Token({ accessTokenExpiresAt: Date.now() - 1000, refreshToken: undefined });

    await expect(freshWso2UserAccessToken(user)).rejects.toMatchObject(new HttpException(401, 'NOT_AUTHORIZED'));
    expect(tokenEndpoint).not.toHaveBeenCalled();
  });

  it('answers 401 when WSO2 rejects the exchange', async () => {
    tokenEndpoint.mockRejectedValue(new Error('invalid_grant'));

    await expect(freshWso2UserAccessToken(oidcUserWithExpiredWso2Token())).rejects.toMatchObject({ status: 401 });
  });
});
