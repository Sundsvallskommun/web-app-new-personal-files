export interface PortalPersonData {
  /** @format uuid */
  personid?: string;
  givenname?: string | null;
  lastname?: string | null;
  fullname?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  workPhone?: string | null;
  mobilePhone?: string | null;
  extraMobilePhone?: string | null;
  aboutMe?: string | null;
  email?: string | null;
  mailNickname?: string | null;
  company?: string | null;
  /** @format int32 */
  companyId?: number;
  orgTree?: string | null;
  referenceNumber?: string | null;
  isManager?: boolean;
  loginName?: string | null;
}

export interface Account {
  domain?: string | null;
  loginname?: string | null;
  /** @format int32 */
  companyId?: number;
  emailAddress?: string | null;
}

export interface Employee {
  /** @format uuid */
  personId?: string;
  personNumber?: string | null;
  isClassified?: boolean;
  givenname?: string | null;
  middlename?: string | null;
  lastname?: string | null;
  accounts?: Account[] | null;
  referenceNumbers?: ReferenceNumberCompany[] | null;
  employments?: Employment[] | null;
}

export interface EmployeeEvent {
  /** @format int32 */
  companyId?: number;
  /** @format date-time */
  startDate?: string | null;
  /** @format date-time */
  endDate?: string | null;
  title?: string | null;
  /** @format int32 */
  orgId?: number;
  orgName?: string | null;
  /** @format int32 */
  topOrgId?: number;
  topOrgName?: string | null;
  /** @format int32 */
  benefitGroupId?: number | null;
  eventType?: string | null;
  eventInfo?: string | null;
}

export interface Employment {
  /** @format int32 */
  companyId?: number;
  /** @format date-time */
  startDate?: string;
  /** @format date-time */
  endDate?: string | null;
  /** @format int32 */
  employmentType?: number;
  title?: string | null;
  managerCode?: string | null;
  /** @format int32 */
  orgId?: number;
  orgName?: string | null;
  /** @format int32 */
  topOrgId?: number;
  topOrgName?: string | null;
  /** @format int32 */
  benefitGroupId?: number | null;
  formOfEmploymentId?: string | null;
  isManual?: boolean;
  paTeam?: string | null;
  isMainEmployment?: boolean;
  manager?: Manager;
  aid?: string | null;
  eventType?: string | null;
  eventInfo?: string | null;
  empRowId?: string | null;
  employmentId?: number;
}

export interface LoginName {
  domain?: string | null;
  loginName?: string | null;
}

export interface Manager {
  /** @format uuid */
  personId?: string;
  givenname?: string | null;
  middlename?: string | null;
  lastname?: string | null;
  loginname?: string | null;
  emailAddress?: string | null;
  referenceNumber?: string | null;
}

export interface ManagerEmployeeDetailMeta {
  /**
   * Vilken Sida
   * @format int32
   */
  pageNumber: number;
  /**
   * Hur många items per sida
   * @format int32
   */
  pageSize: number;
  /**
   * Antalet
   * @format int32
   */
  totalRecords: number;
  /**
   * Antal sidor
   * @format int32
   */
  totalPages: number;
  /** Lista med data */
  data: ManagerEmployeeDetail[] | null;
}

export interface ManagerEmployeeDetail {
  /** @format uuid */
  personId?: string;
  fullName?: string | null;
  birthdate?: string | null;
  employments?: ManagerEmployeeEmploymentDetail[] | null;
}

export interface ManagerEmployeeEmploymentDetail {
  /** @format int32 */
  employmentId?: number;
  title?: string | null;
  isMainEmployment?: boolean;
  orgName?: string | null;
}

export interface ManagerEmployeesQuery {
  PageNumber?: number;
  PageSize?: number;
  OrderBy?: string;
  OrderDirection?: string;
  search?: string;
}

export interface ReferenceNumberCompany {
  referenceNumber?: string | null;
  /** @format int32 */
  companyId?: number;
}

export interface IManagerEmployeesTable {
  /** @format uuid */
  personId?: string;
  fullName?: string | null;
  birthdate?: string | null;
  employmentId?: number;
  title?: string | null;
  orgName?: string | null;
}
