export interface PortalPersonData {
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
  companyId?: number;
  orgTree?: string | null;
  referenceNumber?: string | null;
  isManager?: boolean;
  loginName?: string | null;
}

export interface Account {
  domain?: string | null;
  loginname?: string | null;
  companyId?: number;
  emailAddress?: string | null;
}

export interface Employee {
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

export interface Employment {
  companyId?: number;
  startDate?: string;
  endDate?: string | null;
  employmentType?: number;
  title?: string | null;
  managerCode?: string | null;
  orgId?: number;
  orgName?: string | null;
  topOrgId?: number;
  topOrgName?: string | null;
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

export interface EndedEmploymentEvent {
  title?: string | null;
  orgId?: number;
  orgName?: string | null;
  topOrgId?: number;
  topOrgName?: string | null;
  benefitGroupId?: number;
  hireDate?: string;
  retireDate?: string;
  eventType?: string | null;
  eventInfo?: string | null;
  companyId?: number;
  companyName?: string | null;
  empId?: number | null;
  businessKey?: string | null;
}

export interface Manager {
  personId?: string;
  givenname?: string | null;
  middlename?: string | null;
  lastname?: string | null;
  loginname?: string | null;
  emailAddress?: string | null;
  referenceNumber?: string | null;
}

export interface ManagerEmployeeDetailMeta {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: ManagerEmployeeDetail[] | null;
}

export interface ManagerEmployeeDetail {
  personId?: string;
  fullName?: string | null;
  birthdate?: string | null;
  employments?: ManagerEmployeeEmploymentDetail[] | null;
}

export interface ManagerEmployeeEmploymentDetail {
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
  companyId?: number;
}

export interface IManagerEmployeesTable {
  personId?: string;
  fullName?: string | null;
  birthdate?: string | null;
  employmentId?: number;
  title?: string | null;
  orgName?: string | null;
}
