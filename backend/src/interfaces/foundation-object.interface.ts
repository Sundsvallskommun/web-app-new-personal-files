export interface Company {
  /** @format int32 */
  companyId?: number;
  companyCode?: string | null;
  shortName?: string | null;
  displayName?: string | null;
  isSchool?: boolean;
  isPrivateSchool?: boolean;
}

export interface FormOfEmployment {
  foeId?: string | null;
  description?: string | null;
}
