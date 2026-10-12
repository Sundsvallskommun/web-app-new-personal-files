import { apiURL } from '@utils/api-url';

const parseBooleanWithoutBuildTimeFolding = (value: string | undefined) => {
  try {
    return JSON.parse(value || 'false') === true;
  } catch {
    return false;
  }
};

const isOidcLoginEnabled = () => parseBooleanWithoutBuildTimeFolding(process.env.NEXT_PUBLIC_OIDC_ENABLED);

export const authApiURL = (action: 'login' | 'logout') => apiURL(isOidcLoginEnabled() ? 'oidc' : 'saml', action);
