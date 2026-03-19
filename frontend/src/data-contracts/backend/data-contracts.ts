/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface User {
  personId: string;
  email: string;
  groups: string;
  name: string;
  username: string;
  givenName: string;
  surname: string;
  role: UserRoleEnum;
  permissions: any;
}

export interface UserApiResponse {
  data: User;
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

export enum UserRoleEnum {
  PfHrAdmin = 'pf_hr_admin',
  PfHrSuperadmin = 'pf_hr_superadmin',
  Value0 = '0',
  Value1 = '1',
}
