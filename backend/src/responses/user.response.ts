import ApiResponse from '@/interfaces/api-service.interface';
import { User as ClientUser, InternalRole, InternalRoleEnum, Permissions } from '@/interfaces/users.interface';
import { Type } from 'class-transformer';
import { IsEnum, IsString, ValidateNested } from 'class-validator';

// export class Permissions implements IPermissions {
//   @IsBoolean()
//   canEditSystemMessages: boolean;
// }

export class User implements ClientUser {
  @IsString()
  personId: string;
  @IsString()
  email: string;
  @IsString()
  groups: string;
  @IsString()
  name: string;
  @IsString()
  username: string;
  @IsString()
  givenName: string;
  @IsString()
  surname: string;
  @IsEnum(InternalRoleEnum)
  role: InternalRole;
  @ValidateNested()
  @Type(() => Permissions)
  permissions: Permissions;
}

export class UserApiResponse implements ApiResponse<User> {
  @ValidateNested()
  @Type(() => User)
  data: User;
  @IsString()
  message: string;
}
