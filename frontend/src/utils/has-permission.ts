import { User } from '@data-contracts/backend/data-contracts';

export const hasPermission = (user: User) => {
  const permissions = user?.permissions;

  const CANREADPF = permissions?.canReadPF === true;
  const CANREADDOCS = permissions?.canReadDocs === true;
  const CANDELETEDOCS = permissions?.canDeleteDocs === true;
  const CANUPLOAD = permissions?.canUploadDocs === true;
  return { CANREADPF, CANREADDOCS, CANDELETEDOCS, CANUPLOAD };
};
