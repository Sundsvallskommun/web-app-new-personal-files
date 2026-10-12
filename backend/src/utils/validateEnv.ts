import { cleanEnv, port, str, url } from 'envalid';

// NOTE: Make sure we got these in ENV
const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    SECRET_KEY: str(),
    API_BASE_URL: str(),
    CLIENT_KEY: str(),
    CLIENT_SECRET: str(),
    PORT: port(),
    BASE_URL_PREFIX: str(),
    SAML_CALLBACK_URL: url(),
    SAML_LOGOUT_CALLBACK_URL: url(),
    SAML_FAILURE_REDIRECT: url(),
    SAML_ENTRY_SSO: url(),
    SAML_ISSUER: str(),
    SAML_IDP_PUBLIC_CERT: str(),
    SAML_PRIVATE_KEY: str(),
    SAML_PUBLIC_KEY: str(),
    SESSION_STORE: str({ choices: ['memory', 'file', 'redis'], default: 'memory' }),
    REDIS_HOST: str({ default: '' }),
    REDIS_PORT: port({ default: 6379 }),
    REDIS_PASSWORD: str({ default: '' }),
    APP_ENV: str({ choices: ['test', 'production'], default: 'test' }),
  });

  if (process.env.OIDC_ENABLED === 'true') {
    cleanEnv(process.env, {
      OIDC_ISSUER_URL: url(),
      OIDC_CLIENT_ID: str(),
      OIDC_CALLBACK_URL: url(),
      SAML_SUCCESS_REDIRECT: url(),
    });
  }
};

export default validateEnv;
