import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
  Employee as Emp,
  EmployeeEvent as EmpEvent,
  Employment as _Employment,
  LoginName as _LoginName,
  Manager as _Manager,
  PortalPersonData as _PortalPersonData,
} from '@/interfaces/employee.interface';

export class LoginName implements _LoginName {
  @IsOptional()
  @IsString()
  domain?: string | null;
  @IsOptional()
  @IsString()
  loginName?: string | null;
}

export class PortalPersonData implements _PortalPersonData {
  @IsOptional()
  @IsString()
  personid?: string;
  @IsOptional()
  @IsString()
  givenname?: string | null;
  @IsOptional()
  @IsString()
  lastname?: string | null;
  @IsOptional()
  @IsString()
  fullname?: string | null;
  @IsOptional()
  @IsString()
  address?: string | null;
  @IsOptional()
  @IsString()
  postalCode?: string | null;
  @IsOptional()
  @IsString()
  city?: string | null;
  @IsOptional()
  @IsString()
  workPhone?: string | null;
  @IsOptional()
  @IsString()
  mobilePhone?: string | null;
  @IsOptional()
  @IsString()
  extraMobilePhone?: string | null;
  @IsOptional()
  @IsString()
  aboutMe?: string | null;
  @IsOptional()
  @IsString()
  email?: string | null;
  @IsOptional()
  @IsString()
  mailNickname?: string | null;
  @IsOptional()
  @IsString()
  company?: string | null;
  @IsOptional()
  @IsNumber()
  companyId?: number;
  @IsOptional()
  @IsString()
  orgTree?: string | null;
  @IsOptional()
  @IsString()
  referenceNumber?: string | null;
  @IsOptional()
  @IsBoolean()
  isManager?: boolean;
  @IsOptional()
  @IsString()
  loginName?: string | null;
}

export class Employee implements Emp {
  @IsOptional()
  @IsString()
  personId?: string;
  @IsOptional()
  @IsString()
  personNumber?: string | null;
  @IsOptional()
  @IsBoolean()
  isClassified?: boolean;
  @IsOptional()
  @IsString()
  givenname?: string | null;
  @IsOptional()
  @IsString()
  middlename?: string | null;
  @IsOptional()
  @IsString()
  lastname?: string | null;
  @IsOptional()
  @IsString()
  loginname?: string | null;
  @IsOptional()
  @IsString()
  emailAddress?: string | null;
  @IsOptional()
  @IsString()
  referenceNumber?: string | null;
  @IsOptional()
  @IsBoolean()
  isManager?: boolean | null;
  @IsOptional()
  @IsArray()
  employments?: Employment[] | null;
  @IsOptional()
  @IsArray()
  employeeEvents?: EmployeeEvent[] | null;
}

export class Employment implements _Employment {
  @IsOptional()
  @IsNumber()
  companyId?: number;
  @IsOptional()
  @IsString()
  startDate?: string;
  @IsString()
  endDate?: string | null;
  @IsOptional()
  @IsNumber()
  employmentType?: number;
  @IsOptional()
  @IsString()
  title?: string | null;
  @IsOptional()
  @IsString()
  managerCode?: string | null;
  @IsOptional()
  @IsNumber()
  orgId?: number;
  @IsOptional()
  @IsString()
  orgName?: string | null;
  @IsOptional()
  @IsNumber()
  topOrgId?: number;
  @IsOptional()
  @IsString()
  topOrgName?: string | null;
  @IsOptional()
  @IsNumber()
  benefitGroupId?: number | null;
  @IsOptional()
  @IsString()
  formOfEmploymentId?: string | null;
  isManual?: boolean;
  @IsOptional()
  @IsString()
  paTeam?: string | null;
  @IsOptional()
  @IsBoolean()
  isMainEmployment?: boolean;
  @IsOptional()
  @IsObject()
  manager?: Manager;
  @IsOptional()
  @IsString()
  aid?: string | null;
  @IsOptional()
  @IsString()
  eventType?: string | null;
  @IsOptional()
  @IsString()
  eventInfo?: string | null;
  @IsOptional()
  @IsString()
  empRowId?: string | null;
}

export class EmployeeEvent implements EmpEvent {
  @IsOptional()
  @IsNumber()
  companyId?: number;
  @IsOptional()
  @IsString()
  startDate?: string | null;
  @IsOptional()
  @IsString()
  endDate?: string | null;
  @IsOptional()
  @IsString()
  title?: string | null;
  @IsOptional()
  @IsNumber()
  orgId?: number;
  @IsOptional()
  @IsString()
  orgName?: string | null;
  @IsOptional()
  @IsNumber()
  topOrgId?: number;
  @IsOptional()
  @IsString()
  topOrgName?: string | null;
  @IsOptional()
  @IsNumber()
  benefitGroupId?: number | null;
  @IsOptional()
  @IsString()
  eventType?: string | null;
  @IsOptional()
  @IsString()
  eventInfo?: string | null;
}

export class Manager implements _Manager {
  @IsOptional()
  @IsString()
  personId?: string;
  @IsOptional()
  @IsString()
  givenname?: string | null;
  @IsOptional()
  @IsString()
  middlename?: string | null;
  @IsOptional()
  @IsString()
  lastname?: string | null;
  @IsOptional()
  @IsString()
  loginname?: string | null;
  @IsOptional()
  @IsString()
  emailAddress?: string | null;
  @IsOptional()
  @IsString()
  referenceNumber?: string | null;
}
