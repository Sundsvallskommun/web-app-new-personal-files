import ApiResponse from '@/interfaces/api-service.interface';
import { Company as _Company, FormOfEmployment as _FormOfEmployment } from '@/interfaces/foundation-object.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class Company implements _Company {
  @IsOptional()
  @IsNumber()
  companyId?: number;
  @IsOptional()
  @IsString()
  companyCode?: string | null;
  @IsOptional()
  @IsString()
  shortName?: string | null;
  @IsOptional()
  @IsString()
  displayName?: string | null;
  @IsOptional()
  @IsBoolean()
  isSchool?: boolean;
  @IsOptional()
  @IsBoolean()
  isPrivateSchool?: boolean;
}

export class CompaniesApiResponse implements ApiResponse<Company[]> {
  @ValidateNested()
  @Type(() => Company)
  data: Company[];
  @IsString()
  message: string;
}

export class FormOfEmployment implements _FormOfEmployment {
  @IsOptional()
  @IsString()
  foeId?: string | null;
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class FormOfEmploymentsApiResponse implements ApiResponse<FormOfEmployment[]> {
  @ValidateNested()
  @Type(() => FormOfEmployment)
  data: FormOfEmployment[];
  @IsString()
  message: string;
}
