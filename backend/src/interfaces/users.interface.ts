export interface Permissions {
  canReadOwnPF: boolean;
  canReadOwnDocs: boolean;
  canReadPF: boolean;
  canReadAllPF: boolean;
  canUploadDocs: boolean;
  canUploadAllDocs: boolean;
  canReadDocs: boolean;
  canReadAllDocs: boolean;
  canDeleteDocs: boolean;
}

/** Internal roles */
export type InternalRole = 'pf_hr_admin' | 'pf_hr_superadmin' | 'pf_hr_user' | 'pf_hr_superuser' | 'pf_hr_editor';
export enum InternalRoleEnum {
  pf_hr_admin,
  pf_hr_superadmin,
  pf_hr_user,
  pf_hr_superuser,
  pf_hr_editor,
}

export type InternalRoleMap = Map<InternalRole, Partial<Permissions>>;

export type AuthenticationMethod = 'SAML' | 'OIDC';

export type Wso2UserToken = {
  accessToken: string;
  expiresAt: number;
};

export type User = {
  personId: string;
  personalNumber?: string;
  name: string;
  givenName: string;
  surname: string;
  email: string;
  username: string;
  workTitle: string;
  ADgroups: string;
  systemRole: string;
  permissions?: Permissions;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  idToken?: string;
  refreshToken?: string;
  wso2UserToken?: Wso2UserToken;
  authenticationMethod?: AuthenticationMethod;
};
