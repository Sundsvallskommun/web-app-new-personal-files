import { User, UserSystemRoleEnum } from '@data-contracts/backend/data-contracts';
import { ApiResponse } from '@services/api-service';

// export const defaultPermissions: Permissions = {
//     canEditSystemMessages: false,
// };

export const emptyUser: User = {
  workTitle: '',
  personId: '',
  name: '',
  username: '',
  givenName: '',
  surname: '',
  email: '',
  ADgroups: '',
  systemRole: UserSystemRoleEnum.Value0,
  permissions: undefined,
};

export const emptyUserResponse: ApiResponse<User> = {
  data: emptyUser,
  message: 'none',
};
