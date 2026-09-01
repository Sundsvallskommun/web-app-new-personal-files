/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface User {
  workTitle: string;
  personId: string;
  email: string;
  name: string;
  username: string;
  givenName: string;
  surname: string;
  ADgroups: string;
  systemRole: UserSystemRoleEnum;
  permissions: any;
}

export interface UserApiResponse {
  data: User;
  message: string;
}

export interface LoginName {
  domain?: string;
  loginName?: string;
}

export interface Manager {
  personId?: string;
  givenname?: string;
  middlename?: string;
  lastname?: string;
  loginname?: string;
  emailAddress?: string;
  referenceNumber?: string;
}

export interface PortalPersonData {
  personid?: string;
  givenname?: string;
  lastname?: string;
  fullname?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  workPhone?: string;
  mobilePhone?: string;
  extraMobilePhone?: string;
  aboutMe?: string;
  email?: string;
  mailNickname?: string;
  company?: string;
  companyId?: number;
  orgTree?: string;
  referenceNumber?: string;
  isManager?: boolean;
  loginName?: string;
  fullOrgTree?: string;
}

export interface PortalPersonDataApiResponse {
  data: PortalPersonData;
  message: string;
}

export interface Account {
  domain?: string;
  loginname?: string;
  companyId?: number;
  emailAddress?: string;
}

export interface ReferenceNumberCompany {
  referenceNumber?: string;
  companyId?: number;
}

export interface Employee {
  personId?: string;
  personNumber?: string;
  isClassified?: boolean;
  givenname?: string;
  middlename?: string;
  lastname?: string;
  accounts?: Account[];
  referenceNumbers?: ReferenceNumberCompany[];
  employments?: Employment[];
}

export interface Employment {
  companyId?: number;
  startDate?: string;
  endDate?: string;
  employmentType?: number;
  title?: string;
  managerCode?: string;
  orgId?: number;
  orgName?: string;
  topOrgId?: number;
  topOrgName?: string;
  benefitGroupId?: number;
  formOfEmploymentId?: string;
  isManual?: boolean;
  paTeam?: string;
  isMainEmployment?: boolean;
  isManager?: boolean;
  manager?: Manager;
  hiringManager?: Manager;
  aid?: string;
  empRowId?: string;
  eventType?: string;
  eventInfo?: string;
  employmentId?: number;
}

export interface ManagerEmployeeDetailMeta {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: ManagerEmployee[];
}

export interface ManagerEmployee {
  personId?: string;
  fullName?: string;
  birthdate?: string;
  employments?: ManagerEmployeeEmployment[];
}

export interface ManagerEmployeeEmployment {
  employmentId?: number;
  title?: string;
  isMainEmployment?: boolean;
  orgName?: string;
}

export interface EndedEmploymentEvent {
  title?: string;
  orgId?: number;
  orgName?: string;
  topOrgId?: number;
  topOrgName?: string;
  benefitGroupId?: number;
  hireDate?: string;
  retireDate?: string;
  eventType?: string;
  eventInfo?: string;
  companyId?: number;
  companyName?: string;
  empId?: number;
  businessKey?: string;
}

export interface EndedEmploymentEventApiResponse {
  data: EndedEmploymentEvent[];
  message: string;
}

export interface PageDocument {
  _meta: object;
}

export interface MetadataList {
  key?: string;
}

export interface Confidentiality {
  confidential?: boolean;
  legalCitation?: string;
}

export interface DocumentData {
  id?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeInBytes?: number;
}

export interface Document {
  id?: string;
  municipalityId?: string;
  registrationNumber?: string;
  revision?: number;
  confidentiality?: object;
  description?: string;
  created?: string;
  createdBy?: string;
  archive?: boolean;
  metadataList?: any[];
  documentData?: any[];
  type?: string;
}

export interface CreateDocument {
  createdBy: string;
  confidentiality: object;
  archive: boolean;
  description: string;
  type: string;
}

export interface SearchDocument {
  page: number;
  limit: number;
  sortBy?: any[];
  sortDirection: string;
  includeConfidential: boolean;
  onlyLatestRevision: boolean;
  documentTypes?: any[];
  metaData?: any[];
}

export interface DocumentType {
  type: string;
  displayName: string;
}

export interface Company {
  companyId?: number;
  companyCode?: string;
  shortName?: string;
  displayName?: string;
  isSchool?: boolean;
  isPrivateSchool?: boolean;
}

export interface CompaniesApiResponse {
  data: Company;
  message: string;
}

export interface FormOfEmployment {
  foeId?: string;
  description?: string;
}

export interface FormOfEmploymentsApiResponse {
  data: FormOfEmployment;
  message: string;
}

export enum UserSystemRoleEnum {
  PfHrAdmin = "pf_hr_admin",
  PfHrSuperadmin = "pf_hr_superadmin",
  PfHrUser = "pf_hr_user",
  PfHrSuperuser = "pf_hr_superuser",
  Value0 = "0",
  Value1 = "1",
  Value2 = "2",
  Value3 = "3",
}
