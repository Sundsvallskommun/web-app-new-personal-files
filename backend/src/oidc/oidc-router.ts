import { OIDC_CALLBACK_URL, OIDC_SCOPES, SAML_SUCCESS_REDIRECT, WSO2_USER_TOKEN_EXCHANGE_ENABLED } from '@config';
import { authLimiter } from '@middlewares/auth-limiter.middleware';
import { isValidOrigin } from '@utils/isValidOrigin';
import { logger } from '@utils/logger';
import { isValidUrl } from '@utils/util';
import express, { Request } from 'express';
import { getOidcConfiguration, loadOpenidClient } from './oidc-client';
import { createSessionUserFromOidcClaims, OidcLoginError } from './oidc-session-user';
import {
  exchangeOidcTokenForWso2UserToken,
  sessionTokensFromOidcResponse,
  tokenExchangeAssertionFrom,
} from './wso2-user-token';

const DEFAULT_OIDC_SCOPES = 'openid profile email';

const allowedRedirectOrDefault = (redirect: unknown, defaultRedirect: string) =>
  typeof redirect === 'string' && isValidUrl(redirect) && isValidOrigin(redirect) ? redirect : defaultRedirect;

const withFailMessage = (redirect: string, failMessage: string) => {
  const url = new URL(redirect);
  url.searchParams.append('failMessage', failMessage);
  return url.toString();
};

const describeOidcError = (error: unknown) => {
  const { name, message, error: errorCode, error_description: errorDescription } = Object(error);
  return [name, message, errorCode, errorDescription]
    .filter(Boolean)
    .join(' | ')
    .replace(/[\r\n]/g, ' ');
};

const callbackUrlWithQueryFrom = (req: Request) => {
  const callbackUrl = new URL(OIDC_CALLBACK_URL);
  callbackUrl.search = new URL(req.originalUrl, callbackUrl).search;
  return callbackUrl;
};

const loadOidcClientAndConfiguration = () => Promise.all([loadOpenidClient(), getOidcConfiguration()]);

type OpenidClient = Awaited<ReturnType<typeof loadOpenidClient>>;
type OidcConfiguration = Awaited<ReturnType<typeof getOidcConfiguration>>;

const userInfoClaimsOrNone = (
  openid: OpenidClient,
  configuration: OidcConfiguration,
  accessToken: string,
  expectedSubject: string,
): Promise<Record<string, unknown>> =>
  openid.fetchUserInfo(configuration, accessToken, expectedSubject).catch(error => {
    logger.warn(`OIDC userinfo could not be fetched, using the ID token claims only: ${describeOidcError(error)}`);
    return {};
  });

export const createOidcRouter = () => {
  const router = express.Router();

  router.get('/login', async (req, res) => {
    const successRedirect = allowedRedirectOrDefault(req.query.successRedirect, SAML_SUCCESS_REDIRECT);
    const failureRedirect = allowedRedirectOrDefault(req.query.failureRedirect, successRedirect);

    try {
      const [openid, configuration] = await loadOidcClientAndConfiguration();
      const codeVerifier = openid.randomPKCECodeVerifier();
      const state = openid.randomState();
      const nonce = openid.randomNonce();
      const authorizationUrl = openid.buildAuthorizationUrl(configuration, {
        redirect_uri: OIDC_CALLBACK_URL,
        scope: OIDC_SCOPES || DEFAULT_OIDC_SCOPES,
        code_challenge: await openid.calculatePKCECodeChallenge(codeVerifier),
        code_challenge_method: 'S256',
        state,
        nonce,
      });

      req.session.oidcLogin = { codeVerifier, state, nonce, successRedirect, failureRedirect };
      req.session.save(saveError =>
        res.redirect(saveError ? withFailMessage(failureRedirect, 'OIDC_UNKNOWN_ERROR') : authorizationUrl.href),
      );
    } catch (error) {
      logger.error(`OIDC login could not start: ${describeOidcError(error)}`);
      res.redirect(withFailMessage(failureRedirect, 'OIDC_DISCOVERY_FAILED'));
    }
  });

  router.get('/login/callback', authLimiter, async (req, res) => {
    const pendingLogin = req.session.oidcLogin;
    delete req.session.oidcLogin;

    if (!pendingLogin) {
      logger.warn('OIDC login callback received without a pending login in the session');
      return res.redirect(withFailMessage(SAML_SUCCESS_REDIRECT, 'OIDC_UNKNOWN_ERROR'));
    }

    try {
      const [openid, configuration] = await loadOidcClientAndConfiguration();
      const tokens = await openid.authorizationCodeGrant(configuration, callbackUrlWithQueryFrom(req), {
        pkceCodeVerifier: pendingLogin.codeVerifier,
        expectedState: pendingLogin.state,
        expectedNonce: pendingLogin.nonce,
        idTokenExpected: true,
      });
      const idTokenClaims = tokens.claims();
      const userInfoClaims = await userInfoClaimsOrNone(openid, configuration, tokens.access_token, idTokenClaims.sub);
      const sessionUser = await createSessionUserFromOidcClaims({ ...userInfoClaims, ...idTokenClaims });
      const oidcSessionTokens = sessionTokensFromOidcResponse(tokens);
      const wso2UserToken = WSO2_USER_TOKEN_EXCHANGE_ENABLED
        ? await exchangeOidcTokenForWso2UserToken(tokenExchangeAssertionFrom(oidcSessionTokens)).catch(() => {
            throw new OidcLoginError('OIDC_TOKEN_EXCHANGE_FAILED');
          })
        : undefined;

      req.login({ ...sessionUser, ...oidcSessionTokens, wso2UserToken, authenticationMethod: 'OIDC' }, loginError => {
        if (loginError) {
          logger.error(`OIDC login could not create a session: ${describeOidcError(loginError)}`);
          return res.redirect(withFailMessage(pendingLogin.failureRedirect, 'OIDC_UNKNOWN_ERROR'));
        }
        logger.info(`OIDC login succeeded for ${sessionUser.username}`);
        res.redirect(pendingLogin.successRedirect);
      });
    } catch (error) {
      logger.warn(`OIDC login callback failed: ${describeOidcError(error)}`);
      const failMessage = error instanceof OidcLoginError ? error.name : 'OIDC_UNKNOWN_ERROR';
      res.redirect(withFailMessage(pendingLogin.failureRedirect, failMessage));
    }
  });

  router.get('/logout', authLimiter, (req, res, next) => {
    const successRedirect = allowedRedirectOrDefault(req.query.successRedirect, SAML_SUCCESS_REDIRECT);
    const idTokenHint = req.user?.idToken;

    req.logout(async logoutError => {
      if (logoutError) {
        return next(logoutError);
      }
      if (!idTokenHint) {
        return res.redirect(successRedirect);
      }
      try {
        const [openid, configuration] = await loadOidcClientAndConfiguration();
        const endSessionUrl = openid.buildEndSessionUrl(configuration, {
          id_token_hint: idTokenHint,
          post_logout_redirect_uri: successRedirect,
        });
        res.redirect(endSessionUrl.href);
      } catch (error) {
        logger.warn(`OIDC logout fell back to local logout: ${describeOidcError(error)}`);
        res.redirect(successRedirect);
      }
    });
  });

  return router;
};
