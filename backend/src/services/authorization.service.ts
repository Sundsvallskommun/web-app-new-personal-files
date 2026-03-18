import { AUTHORIZED_GROUPS } from '@/config';
import { logger } from '@/utils/logger';
import { Permissions, InternalRole } from '@interfaces/users.interface';

export function authorizeGroups(groups) {
  logger.info(`authorizing groups: ${JSON.stringify(groups)}`);
  logger.info(`against ${JSON.stringify(AUTHORIZED_GROUPS)}`);
  const authorizedGroupsList = AUTHORIZED_GROUPS.split(',');
  const groupsList = groups.split(',').map((g: string) => g.toLowerCase());
  return authorizedGroupsList.some(authorizedGroup => groupsList.includes(authorizedGroup.toLowerCase()));
}

export const defaultPermissions: () => Permissions = () => ({
  canReadPF: false,
  canUploadDocs: false,
  canReadDocs: false,
  canDeleteDocs: false,
});

enum RoleOrderEnum {
  'pf_hr_admin',
  'pf_hr_superadmin',
}

const roles = new Map<InternalRole, Partial<Permissions>>([
  [
    'pf_hr_admin',
    {
      canReadPF: true,
      canReadDocs: true,
    },
  ],
  [
    'pf_hr_superadmin',
    {
      canReadPF: true,
      canUploadDocs: true,
      canReadDocs: true,
      canDeleteDocs: true,
    },
  ],
]);

type RoleADMapping = {
  [key: string]: InternalRole;
};

let roleADMapping: RoleADMapping = {};
const admins = process.env.ADMIN_GROUPS.split(',');
admins.forEach(admin => {
  roleADMapping[admin.toLocaleLowerCase()] = 'pf_hr_admin';
});
const superAdmins = process.env.SUPERADMIN_GROUPS.split(',');
superAdmins.forEach(admin => {
  roleADMapping[admin.toLocaleLowerCase()] = 'pf_hr_superadmin';
});

/**
 *
 * @param groups Array of groups/roles
 * @param internalGroups Whether to use internal groups or external group-mappings
 * @returns collected permissions for all matching role groups
 */
export const getPermissions = (groups: InternalRole[] | string[], internalGroups = false): Permissions => {
  const permissions: Permissions = defaultPermissions();
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = internalGroups ? (groupLower as InternalRole) : (roleADMapping[groupLower] as InternalRole);
    if (roles.has(role)) {
      const groupPermissions = roles.get(role);
      Object.keys(groupPermissions).forEach(permission => {
        if (groupPermissions[permission] === true) {
          permissions[permission] = true;
        }
      });
    }
  });
  return permissions;
};

/**
 * Ensures to return only the role with most permissions
 * @param groups List of AD roles
 * @returns role with most permissions
 */
export const getRole = (groups: string[]) => {
  if (groups.length == 1) return roleADMapping[groups[0]]; // app_read

  const roles: InternalRole[] = [];
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = roleADMapping[groupLower];
    if (role) {
      roles.push(role);
    }
  });

  return roles.sort((a, b) => (RoleOrderEnum[a] > RoleOrderEnum[b] ? 1 : 0))[0];
};
