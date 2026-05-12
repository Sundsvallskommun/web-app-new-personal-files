import { User } from '@data-contracts/backend/data-contracts';
import { hasPermission } from './has-permission';

export const hasSystemRole = (user: User) => {
  const { CANREADOWNPF, CANREADOWNDOCS, CANREADPF, CANREADDOCS, CANDELETEDOCS, CANUPLOAD } = hasPermission(user);
  const userRole =
    CANREADOWNPF &&
    CANREADOWNDOCS &&
    !CANREADPF &&
    !CANREADDOCS &&
    !CANUPLOAD &&
    !CANDELETEDOCS &&
    user.systemRole === 'pf_hr_user';
  const superUserRole =
    CANREADOWNPF &&
    CANREADPF &&
    CANREADOWNDOCS &&
    CANREADDOCS &&
    !CANUPLOAD &&
    !CANDELETEDOCS &&
    user.systemRole === 'pf_hr_superuser';
  const adminRole =
    CANREADOWNPF &&
    CANREADPF &&
    CANREADOWNDOCS &&
    CANREADDOCS &&
    CANUPLOAD &&
    !CANDELETEDOCS &&
    user.systemRole === 'pf_hr_admin';
  const superAdminRole =
    CANREADOWNPF &&
    CANREADPF &&
    CANREADOWNDOCS &&
    CANREADDOCS &&
    CANUPLOAD &&
    CANDELETEDOCS &&
    user.systemRole === 'pf_hr_superadmin';

  return { userRole, superUserRole, adminRole, superAdminRole };
};
