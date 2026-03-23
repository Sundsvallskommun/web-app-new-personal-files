import {
  PageDocument as _PageDocument,
  Document as _Document,
  DocumentMetadata as _MetadataList,
  DocumentData as _DocumentData,
  CreateDocument as _CreateDocument,
  SearchDocument as _SearchDocument,
  Confidentiality as _Confidentiality,
  DocumentType as _DocumentType,
} from '@/interfaces/document.interface';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PageDocument implements _PageDocument {
  documents?: Document[];
  @IsObject()
  @IsNumber()
  _meta?: {
    page?: number;
    limit?: number;
    count?: number;
    totalRecords?: number;
    totalPages?: number;
  };
}

export class MetadataList implements MetadataList {
  @IsOptional()
  @IsString()
  key!: string;
  value: any;
}

export class Confidentiality implements _Confidentiality {
  @IsOptional()
  @IsBoolean()
  confidential?: boolean;
  @IsOptional()
  @IsString()
  legalCitation?: string | undefined;
}

export class DocumentData implements _DocumentData {
  @IsOptional()
  @IsString()
  id?: string | undefined;
  @IsOptional()
  @IsString()
  fileName?: string | undefined;
  @IsOptional()
  @IsString()
  mimeType?: string | undefined;
  @IsOptional()
  @IsNumber()
  fileSizeInBytes?: number;
}

export class Document implements _Document {
  @IsOptional()
  @IsString()
  id?: string | undefined;
  @IsOptional()
  @IsString()
  municipalityId?: string | undefined;
  @IsOptional()
  @IsString()
  registrationNumber?: string | undefined;
  @IsOptional()
  @IsNumber()
  revision?: number;
  @IsOptional()
  @IsObject()
  confidentiality?: Confidentiality;
  @IsOptional()
  @IsString()
  description?: string | undefined;
  @IsOptional()
  @IsString()
  created?: string | undefined;
  @IsOptional()
  @IsString()
  createdBy?: string | undefined;
  @IsOptional()
  @IsBoolean()
  archive?: boolean;
  @IsOptional()
  @IsArray()
  metadataList?: MetadataList[];
  @IsOptional()
  @IsArray()
  documentData?: DocumentData[];
  @IsOptional()
  @IsString()
  type?: string | undefined;
}

export class CreateDocument implements _CreateDocument {
  @IsString()
  createdBy!: string;
  @IsObject()
  confidentiality?: Confidentiality;
  @IsBoolean()
  archive: boolean | undefined;
  @IsString()
  description!: string;
  metadataList!: MetadataList[];
  @IsString()
  type!: string;
}

export class SearchDocument implements _SearchDocument {
  @IsNumber()
  page?: number;
  @IsNumber()
  limit?: number;
  @IsOptional()
  @IsArray()
  sortBy?: string[] | null;
  @IsString()
  sortDirection?: Direction;
  @IsBoolean()
  includeConfidential?: boolean;
  @IsBoolean()
  onlyLatestRevision?: boolean;
  @IsOptional()
  @IsArray()
  documentTypes?: string[] | null;
  @IsOptional()
  @IsArray()
  metaData?: [
    {
      key?: string;
      matchesAny?: string[];
      matchesAll?: string[];
    },
  ];
}

export class DocumentType implements _DocumentType {
  @IsString()
  type!: string;
  @IsString()
  displayName!: string;
}

export enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}
