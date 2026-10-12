import { getPermissions, getRole } from '@services/authorization.service';
import { resolvePersonIdByLoginName } from '@services/persondata.service';

interface AuthenticatedIdentity {
  givenName: string;
  surname: string;
  username: string;
  email: string;
  groups: string;
  citizenIdentifier?: string;
}

export const createSessionUser = async ({
  givenName,
  surname,
  username,
  email,
  groups,
  citizenIdentifier,
}: AuthenticatedIdentity) => {
  const appGroups = groups.split(',').map(group => group.toLowerCase());

  return {
    personId: await resolvePersonIdByLoginName(username),
    personalNumber: citizenIdentifier ?? '',
    name: `${givenName} ${surname}`,
    givenName,
    surname,
    username,
    email,
    groups: appGroups,
    systemRole: getRole(appGroups),
    ADgroups: groups,
    permissions: getPermissions(appGroups),
  };
};
