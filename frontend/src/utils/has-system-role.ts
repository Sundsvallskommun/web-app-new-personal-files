import { User } from '@data-contracts/backend/data-contracts';
import { hasPermission } from './has-permission';

export const hasSystemRole = (user: User) => {
  const { CANREADOWNPF, CANREADOWNDOCS, CANREADPF, CANREADDOCS, CANDELETEDOCS, CANUPLOAD, CANUPLOADALL } =
    hasPermission(user);
  const userRole =
    CANREADOWNPF &&
    CANREADOWNDOCS &&
    !CANREADPF &&
    !CANREADDOCS &&
    !CANUPLOAD &&
    !CANUPLOADALL &&
    !CANDELETEDOCS &&
    user.systemRole === 'pf_hr_user';
  const superUserRole =
    CANREADOWNPF &&
    CANREADPF &&
    CANREADOWNDOCS &&
    CANREADDOCS &&
    !CANUPLOAD &&
    !CANUPLOADALL &&
    !CANDELETEDOCS &&
    user.systemRole === 'pf_hr_superuser';
  const adminRole =
    CANREADOWNPF &&
    CANREADPF &&
    CANREADOWNDOCS &&
    CANREADDOCS &&
    CANUPLOAD &&
    !CANUPLOADALL &&
    !CANDELETEDOCS &&
    user.systemRole === 'pf_hr_admin';
  const editorRole =
    CANREADOWNPF &&
    CANREADPF &&
    CANREADOWNDOCS &&
    CANREADDOCS &&
    CANUPLOAD &&
    CANUPLOADALL &&
    !CANDELETEDOCS &&
    user.systemRole === 'pf_hr_editor';
  const superAdminRole =
    CANREADOWNPF &&
    CANREADPF &&
    CANREADOWNDOCS &&
    CANREADDOCS &&
    CANUPLOAD &&
    CANUPLOADALL &&
    CANDELETEDOCS &&
    user.systemRole === 'pf_hr_superadmin';

  return { userRole, superUserRole, adminRole, editorRole, superAdminRole };
};
