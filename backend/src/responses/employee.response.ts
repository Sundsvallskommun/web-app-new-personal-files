import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
  Account as _Account,
  Employeev2 as Emp,
  EmploymentV2 as _Employment,
  Manager as _Manager,
  ManagerEmployeeDetail,
  ManagerEmployeeDetailPagedOffsetResponse,
  ManagerEmployeeEmploymentDetail,
  PortalPersonData as _PortalPersonData,
  ReferenceNumberCompany as _ReferenceNumberCompany,
  EndedEmploymentEvent as IEndedEmploymentEvent,
} from '@/data-contracts/employee/data-contracts';

export class LoginName {
  @IsOptional()
  @IsString()
  domain?: string | null;
  @IsOptional()
  @IsString()
  loginName?: string | null;
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
  @IsOptional()
  @IsString()
  fullOrgTree?: string | null;
}

export class PortalPersonDataApiResponse implements ApiResponse<PortalPersonData> {
  @ValidateNested()
  @Type(() => PortalPersonData)
  data!: PortalPersonData;
  @IsString()
  message!: string;
}

export class Account implements _Account {
  @IsOptional()
  @IsString()
  domain?: string | null;
  @IsOptional()
  @IsString()
  loginname?: string | null;
  @IsOptional()
  @IsNumber()
  companyId?: number;
  @IsOptional()
  @IsString()
  emailAddress?: string | null;
}

export class ReferenceNumberCompany implements _ReferenceNumberCompany {
  @IsOptional()
  @IsString()
  referenceNumber?: string | null;
  @IsOptional()
  @IsNumber()
  companyId?: number;
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Account)
  accounts?: Account[] | null;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceNumberCompany)
  referenceNumbers?: ReferenceNumberCompany[] | null;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Employment)
  employments?: Employment[] | null;
}

export class Employment implements _Employment {
  @IsOptional()
  @IsNumber()
  companyId?: number;
  @IsOptional()
  @IsString()
  startDate?: string;
  @IsOptional()
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
  @IsOptional()
  @IsBoolean()
  isManual?: boolean;
  @IsOptional()
  @IsString()
  paTeam?: string | null;
  @IsOptional()
  @IsBoolean()
  isMainEmployment?: boolean;
  @IsOptional()
  @IsBoolean()
  isManager?: boolean | null;
  @IsOptional()
  @ValidateNested()
  @Type(() => Manager)
  manager?: Manager;
  @IsOptional()
  @ValidateNested()
  @Type(() => Manager)
  hiringManager?: Manager;
  @IsOptional()
  @IsString()
  aid?: string | null;
  @IsOptional()
  @IsString()
  empRowId?: string | null;
  @IsOptional()
  @IsString()
  eventType?: string | null;
  @IsOptional()
  @IsString()
  eventInfo?: string | null;
  @IsOptional()
  @IsNumber()
  employmentId?: number;
}

export class ManagerEmployeeDetailMeta implements ManagerEmployeeDetailPagedOffsetResponse {
  @IsNumber()
  pageNumber?: number;
  @IsNumber()
  pageSize?: number;
  @IsNumber()
  totalRecords?: number;
  @IsNumber()
  totalPages?: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManagerEmployee)
  data?: ManagerEmployee[] | null;
}

export class ManagerEmployee implements ManagerEmployeeDetail {
  @IsOptional()
  @IsString()
  personId?: string;
  @IsOptional()
  @IsString()
  fullName?: string | null;
  @IsOptional()
  @IsString()
  birthdate?: string | null;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManagerEmployeeEmployment)
  employments?: ManagerEmployeeEmployment[] | null;
}

export class ManagerEmployeeEmployment implements ManagerEmployeeEmploymentDetail {
  @IsOptional()
  @IsNumber()
  employmentId?: number;
  @IsOptional()
  @IsString()
  title?: string | null;
  @IsOptional()
  @IsBoolean()
  isMainEmployment?: boolean;
  @IsOptional()
  @IsString()
  orgName?: string | null;
}

export class EndedEmploymentEvent implements IEndedEmploymentEvent {
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
  benefitGroupId?: number;
  @IsOptional()
  @IsString()
  hireDate?: string;
  @IsOptional()
  @IsString()
  retireDate?: string;
  @IsOptional()
  @IsString()
  eventType?: string | null;
  @IsOptional()
  @IsString()
  eventInfo?: string | null;
  @IsOptional()
  @IsNumber()
  companyId?: number;
  @IsOptional()
  @IsString()
  companyName?: string | null;
  @IsOptional()
  @IsNumber()
  empId?: number | null;
  @IsOptional()
  @IsString()
  businessKey?: string | null;
}

export class EndedEmploymentEventApiResponse implements ApiResponse<EndedEmploymentEvent[]> {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EndedEmploymentEvent)
  data!: EndedEmploymentEvent[];
  @IsString()
  message!: string;
}
