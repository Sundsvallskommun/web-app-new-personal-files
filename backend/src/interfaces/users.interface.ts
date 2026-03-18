export interface Permissions {
  canReadPF: boolean;
  canUploadDocs: boolean;
  canReadDocs: boolean;
  canDeleteDocs: boolean;
}

/** Internal roles */
export type InternalRole = 'pf_hr_admin' | 'pf_hr_superadmin';
export enum InternalRoleEnum {
  'pf_hr_admin',
  'pf_hr_superadmin',
}

export type InternalRoleMap = Map<InternalRole, Partial<Permissions>>;

export type User = {
  personId: string;
  name: string;
  givenName: string;
  surname: string;
  email: string;
  username: string;
  role: string;
  groups: string;
  permissions: Permissions;
};
