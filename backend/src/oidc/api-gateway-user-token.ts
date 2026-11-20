import { API_BASE_URL, CLIENT_KEY, CLIENT_SECRET, WSO2_TOKEN_EXCHANGE_ASSERTION } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { User, ApiGatewayUserToken } from '@interfaces/users.interface';
import { logger } from '@utils/logger';
import axios from 'axios';
import type { TokenEndpointResponse, TokenEndpointResponseHelpers } from 'openid-client' with {
  'resolution-mode': 'import',
};
import qs from 'qs';
import { getOidcConfiguration, loadOpenidClient } from './oidc-client';

const JWT_BEARER_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
const TOKEN_EXPIRY_MARGIN_MS = 30_000;
const FINISHED_RENEWAL_REUSE_MS = 30_000;

type OidcTokenResponse = TokenEndpointResponse & TokenEndpointResponseHelpers;
type OidcSessionTokens = Pick<User, 'accessToken' | 'accessTokenExpiresAt' | 'idToken' | 'refreshToken'>;
type SessionTokenRenewal = {
  oidcSessionTokens: OidcSessionTokens;
  hasRefreshedOidcTokens: boolean;
  apiGatewayUserToken?: ApiGatewayUserToken;
  exchangeFailure?: unknown;
};

const sessionTokenRenewalsByOidcAccessToken = new Map<string, Promise<SessionTokenRenewal>>();

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

export const exchangeOidcTokenForApiGatewayUserToken = async (
  assertion: string | undefined,
): Promise<ApiGatewayUserToken> => {
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
    logger.warn(`API gateway token exchange failed: ${describeTokenEndpointError(error)}`);
    throw error;
  }
};

const currentOidcSessionTokens = ({ accessToken, accessTokenExpiresAt, idToken, refreshToken }: User) => ({
  accessToken,
  accessTokenExpiresAt,
  idToken,
  refreshToken,
});

const refreshedOidcSessionTokens = async (user: User) => {
  if (!user.refreshToken) {
    throw new Error('OIDC access token expired and no refresh token is available');
  }
  const [openid, configuration] = await Promise.all([loadOpenidClient(), getOidcConfiguration()]);
  const tokens = await openid.refreshTokenGrant(configuration, user.refreshToken);
  return sessionTokensFromOidcResponse(tokens, user);
};

const renewSessionTokens = async (user: User): Promise<SessionTokenRenewal> => {
  const hasRefreshedOidcTokens = !isValidBeyondExpiryMargin(user.accessTokenExpiresAt);
  const oidcSessionTokens = hasRefreshedOidcTokens
    ? await refreshedOidcSessionTokens(user)
    : currentOidcSessionTokens(user);

  try {
    const apiGatewayUserToken = await exchangeOidcTokenForApiGatewayUserToken(
      tokenExchangeAssertionFrom(oidcSessionTokens),
    );
    return { oidcSessionTokens, hasRefreshedOidcTokens, apiGatewayUserToken };
  } catch (exchangeFailure) {
    return { oidcSessionTokens, hasRefreshedOidcTokens, exchangeFailure };
  }
};

const isWorthReusing = ({ apiGatewayUserToken, hasRefreshedOidcTokens }: SessionTokenRenewal) =>
  Boolean(apiGatewayUserToken) || hasRefreshedOidcTokens;

const forgetRenewalLater = (oidcAccessToken: string) =>
  setTimeout(() => sessionTokenRenewalsByOidcAccessToken.delete(oidcAccessToken), FINISHED_RENEWAL_REUSE_MS).unref();

const sharedSessionTokenRenewal = (user: User) => {
  const oidcAccessToken = user.accessToken;
  if (!oidcAccessToken) {
    return Promise.reject(new Error('The session has no OIDC access token to renew from'));
  }

  const ongoingOrJustFinishedRenewal = sessionTokenRenewalsByOidcAccessToken.get(oidcAccessToken);
  if (ongoingOrJustFinishedRenewal) {
    return ongoingOrJustFinishedRenewal;
  }

  const renewal = renewSessionTokens(user);
  sessionTokenRenewalsByOidcAccessToken.set(oidcAccessToken, renewal);
  renewal.then(
    finishedRenewal =>
      isWorthReusing(finishedRenewal)
        ? forgetRenewalLater(oidcAccessToken)
        : sessionTokenRenewalsByOidcAccessToken.delete(oidcAccessToken),
    () => sessionTokenRenewalsByOidcAccessToken.delete(oidcAccessToken),
  );
  return renewal;
};

export const freshApiGatewayUserAccessToken = async (user: User): Promise<string> => {
  if (user.apiGatewayUserToken && isValidBeyondExpiryMargin(user.apiGatewayUserToken.expiresAt)) {
    return user.apiGatewayUserToken.accessToken;
  }

  try {
    const { oidcSessionTokens, apiGatewayUserToken, exchangeFailure } = await sharedSessionTokenRenewal(user);
    Object.assign(user, oidcSessionTokens);
    if (!apiGatewayUserToken) {
      throw exchangeFailure;
    }
    user.apiGatewayUserToken = apiGatewayUserToken;
    return apiGatewayUserToken.accessToken;
  } catch (error) {
    const safeUsername = user.username.replace(/[\r\n]/g, '');
    logger.warn(
      `API gateway user token could not be renewed for ${safeUsername}: ${describeTokenEndpointError(error)}`,
    );
    throw new HttpException(401, 'NOT_AUTHORIZED');
  }
};
