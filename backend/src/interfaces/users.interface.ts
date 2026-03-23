export interface Permissions {
  canReadPF: boolean;
  canUploadDocs: boolean;
  canReadDocs: boolean;
  canDeleteDocs: boolean;
}

/** Internal roles */
export type InternalRole = 'pf_hr_admin' | 'pf_hr_superadmin' | 'pf_hr_user';
export enum InternalRoleEnum {
  'pf_hr_admin',
  'pf_hr_superadmin',
  'pf_hr_user',
}

export type InternalRoleMap = Map<InternalRole, Partial<Permissions>>;

export type User = {
  personId: string;
  name: string;
  givenName: string;
  surname: string;
  email: string;
  username: string;
  workTitle: string;
  role: string;
  systemRole: string
  groups: string;
  permissions: Permissions;
};
