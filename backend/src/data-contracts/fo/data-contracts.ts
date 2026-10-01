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

export interface Activity {
  /** @format int32 */
  id?: number;
  activity?: string | null;
}

export interface BenefitGroup {
  /** @format int32 */
  benefitGroupId?: number;
  description?: string | null;
}

export interface Company {
  /** @format int32 */
  companyId?: number;
  companyCode?: string | null;
  shortName?: string | null;
  displayName?: string | null;
  isSchool?: boolean;
  isPrivateSchool?: boolean;
}

export interface ExternalCompanyAddress {
  /** @format int32 */
  id?: number;
  companyName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  counterpart?: string | null;
  organizationNumber?: string | null;
}

export interface FormOfEmployment {
  foeId?: string | null;
  description?: string | null;
}

export interface Liability {
  /** @format int32 */
  id?: number;
  liableId?: string | null;
  liable?: string | null;
}

export interface MunicipalityObject {
  /** @format int32 */
  id?: number;
  municipalityObject?: string | null;
}

export interface Operation {
  /** @format int32 */
  id?: number;
  operationId?: string | null;
  operation?: string | null;
}

export interface Project {
  /** @format int32 */
  id?: number;
  project?: string | null;
}

export interface ReferenceNumber {
  /** @format int32 */
  id?: number;
  /** @format int32 */
  companyCode?: number;
  referenceNumber?: string | null;
  referenceText?: string | null;
}

export interface Unit {
  /** @format int32 */
  id?: number;
  unit?: string | null;
}
