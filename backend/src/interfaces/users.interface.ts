export interface Permissions {
  canReadOwnPF: boolean;
  canReadOwnDocs: boolean;
  canReadPF: boolean;
  canUploadDocs: boolean;
  canReadDocs: boolean;
  canDeleteDocs: boolean;
}

/** Internal roles */
export type InternalRole = 'pf_hr_admin' | 'pf_hr_superadmin' | 'pf_hr_user' | 'pf_hr_superuser';
export enum InternalRoleEnum {
  'pf_hr_admin',
  'pf_hr_superadmin',
  'pf_hr_user',
  'pf_hr_superuser',
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
  ADgroups: string;
  systemRole: string
  permissions?: Permissions;
};
