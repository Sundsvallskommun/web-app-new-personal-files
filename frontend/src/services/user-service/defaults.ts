import { User, UserRoleEnum } from '@data-contracts/backend/data-contracts';
import { ApiResponse } from '@services/api-service';

// export const defaultPermissions: Permissions = {
//     canEditSystemMessages: false,
// };

export const emptyUser: User = {
  name: '',
  username: '',
  givenName: '',
  surname: '',
  personId: '',
  email: '',
  groups: '',
  role: UserRoleEnum.Value0,
  permissions: undefined,
};

export const emptyUserResponse: ApiResponse<User> = {
  data: emptyUser,
  message: 'none',
};
