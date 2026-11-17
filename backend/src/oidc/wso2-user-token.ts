import { API_BASE_URL, CLIENT_KEY, CLIENT_SECRET, WSO2_TOKEN_EXCHANGE_ASSERTION } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { User, Wso2UserToken } from '@interfaces/users.interface';
import { logger } from '@utils/logger';
import axios from 'axios';
import type { TokenEndpointResponse, TokenEndpointResponseHelpers } from 'openid-client' with {
  'resolution-mode': 'import',
};
import qs from 'qs';
import { getOidcConfiguration, loadOpenidClient } from './oidc-client';

const JWT_BEARER_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
const TOKEN_EXPIRY_MARGIN_MS = 30_000;

type OidcTokenResponse = TokenEndpointResponse & TokenEndpointResponseHelpers;
type OidcSessionTokens = Pick<User, 'accessToken' | 'accessTokenExpiresAt' | 'idToken' | 'refreshToken'>;

const pendingWso2UserTokenRenewals = new WeakMap<User, Promise<Wso2UserToken>>();

const isValidBeyondExpiryMargin = (expiresAt: number | undefined) =>
  expiresAt === undefined || expiresAt - TOKEN_EXPIRY_MARGIN_MS > Date.now();

const expiresAtFromNow = (expiresInSeconds: number | undefined) =>
  expiresInSeconds === undefined ? undefined : Date.now() + expiresInSeconds * 1000;

const describeTokenEndpointError = (error: unknown) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const { error: errorCode, error_description: errorDescription } = Object(
    axios.isAxiosError(error) ? error.response?.data : undefined,
  );
  return [status, errorCode, errorDescription, Object(error).message]
    .filter(Boolean)
    .join(' | ')
    .replace(/[\r\n]/g, ' ');
};

export const sessionTokensFromOidcResponse = (
  tokens: OidcTokenResponse,
  previousTokens: OidcSessionTokens = {},
): OidcSessionTokens => ({
  accessToken: tokens.access_token,
  accessTokenExpiresAt: expiresAtFromNow(tokens.expiresIn()),
  idToken: tokens.id_token ?? previousTokens.idToken,
  refreshToken: tokens.refresh_token ?? previousTokens.refreshToken,
});

export const tokenExchangeAssertionFrom = (tokens: OidcSessionTokens) =>
  WSO2_TOKEN_EXCHANGE_ASSERTION === 'id_token' ? tokens.idToken : tokens.accessToken;

export const exchangeOidcTokenForWso2UserToken = async (assertion: string | undefined): Promise<Wso2UserToken> => {
  try {
    const { data } = await axios({
      method: 'POST',
      url: `${API_BASE_URL}/token`,
      timeout: 30000,
      headers: {
        Authorization: `Basic ${Buffer.from(`${CLIENT_KEY}:${CLIENT_SECRET}`, 'utf-8').toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({ grant_type: JWT_BEARER_GRANT_TYPE, assertion }),
    });
    return { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  } catch (error) {
    logger.warn(`WSO2 token exchange failed: ${describeTokenEndpointError(error)}`);
    throw error;
  }
};

const refreshOidcSessionTokens = async (user: User) => {
  if (!user.refreshToken) {
    throw new Error('OIDC access token expired and no refresh token is available');
  }
  const [openid, configuration] = await Promise.all([loadOpenidClient(), getOidcConfiguration()]);
  const tokens = await openid.refreshTokenGrant(configuration, user.refreshToken);
  Object.assign(user, sessionTokensFromOidcResponse(tokens, user));
};

const renewWso2UserToken = async (user: User) => {
  if (!isValidBeyondExpiryMargin(user.accessTokenExpiresAt)) {
    await refreshOidcSessionTokens(user);
  }
  return exchangeOidcTokenForWso2UserToken(tokenExchangeAssertionFrom(user));
};

export const freshWso2UserAccessToken = async (user: User): Promise<string> => {
  if (user.wso2UserToken && isValidBeyondExpiryMargin(user.wso2UserToken.expiresAt)) {
    return user.wso2UserToken.accessToken;
  }

  const renewal =
    pendingWso2UserTokenRenewals.get(user) ??
    renewWso2UserToken(user).finally(() => pendingWso2UserTokenRenewals.delete(user));
  pendingWso2UserTokenRenewals.set(user, renewal);

  try {
    user.wso2UserToken = await renewal;
    return user.wso2UserToken.accessToken;
  } catch (error) {
    const safeUsername = user.username.replace(/[\r\n]/g, '');
    logger.warn(`WSO2 user token could not be renewed for ${safeUsername}: ${describeTokenEndpointError(error)}`);
    throw new HttpException(401, 'NOT_AUTHORIZED');
  }
};
