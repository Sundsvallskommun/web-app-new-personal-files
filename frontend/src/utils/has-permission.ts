import { User } from '@data-contracts/backend/data-contracts';

export const hasPermission = (user: User) => {
  const permissions = user?.permissions;

  const CANREADOWNPF = permissions?.canReadOwnPF === true;
  const CANREADOWNDOCS = permissions?.canReadOwnDocs === true;
  const CANREADPF = permissions?.canReadPF === true;
  const CANREADDOCS = permissions?.canReadDocs === true;
  const CANDELETEDOCS = permissions?.canDeleteDocs === true;
  const CANUPLOAD = permissions?.canUploadDocs === true;
  return { CANREADOWNPF, CANREADOWNDOCS, CANREADPF, CANREADDOCS, CANDELETEDOCS, CANUPLOAD };
};
