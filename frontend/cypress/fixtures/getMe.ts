import { User, UserSystemRoleEnum } from '@data-contracts/backend/data-contracts';
import { ApiResponse } from '@services/api-service';

export const getMe: ApiResponse<User> = {
  data: {
  email: 'string',
  ADgroups: 'string',
  name: 'Förnamn Efternamn',
  username: 'för01eft',
  givenName: 'Förnamn',
  surname: 'Efternamn',
  workTitle: '',
  personId: '',
  systemRole: UserSystemRoleEnum.PfHrAdmin,
  permissions:['canRead'],
  },
  message: 'success',
};
