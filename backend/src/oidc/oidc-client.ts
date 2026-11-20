import { APP_ENV, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER_URL } from '@config';
import type { Configuration } from 'openid-client' with { 'resolution-mode': 'import' };

export const loadOpenidClient = () => import('openid-client');

let cachedOidcConfiguration: Promise<Configuration> | undefined;

const discoverOidcConfiguration = async (): Promise<Configuration> => {
  const openid = await loadOpenidClient();
  const issuerUrl = new URL(OIDC_ISSUER_URL);
  const isHttpIssuerAllowed = issuerUrl.protocol === 'http:' && APP_ENV !== 'production';

  return openid.discovery(
    issuerUrl,
    OIDC_CLIENT_ID,
    undefined,
    OIDC_CLIENT_SECRET ? openid.ClientSecretPost(OIDC_CLIENT_SECRET) : openid.None(),
    isHttpIssuerAllowed ? { execute: [openid.allowInsecureRequests] } : undefined,
  );
};

export const getOidcConfiguration = (): Promise<Configuration> => {
  cachedOidcConfiguration ??= discoverOidcConfiguration().catch(error => {
    cachedOidcConfiguration = undefined;
    throw error;
  });
  return cachedOidcConfiguration;
};
