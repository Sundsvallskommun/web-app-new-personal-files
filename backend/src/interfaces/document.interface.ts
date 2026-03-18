export interface Confidentiality {
  confidential?: boolean;
  legalCitation?: string;
}

export interface PageDocument {
  documents?: Document[];
  _meta?: {
    /** @format int32 */
    page?: number;
    /** @format int32 */
    limit?: number;
    /** @format int32 */
    count?: number;
    /** @format int32 */
    totalRecords?: number;
    /** @format int32 */
    totalPages?: number;
  };
}

export interface DocumentMetadata {
  key: string;
  value: any;
}

export interface DocumentData {
  id?: string;
  fileName?: string;
  mimeType?: string;
  /** @format int32 */
  fileSizeInBytes?: number;
}

export interface DocumentType {
  type: string;
  displayName: string;
}

export enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface Document {
  id?: string;
  municipalityId?: string;
  registrationNumber?: string;
  /** @format int32 */
  revision?: number;
  confidentiality?: Confidentiality;
  description?: string;
  created?: string;
  createdBy?: string;
  archive?: boolean;
  metadataList?: DocumentMetadata[];
  documentData?: DocumentData[];
  type?: string;
}

export interface CreateDocument {
  createdBy: string;
  confidentiality: Confidentiality;
  archive: boolean;
  description: string;
  metadataList: DocumentMetadata[];
  type: string;
}

export interface SearchDocument {
  page: number;
  limit: number;
  sortBy?: string[] | null;
  sortDirection: Direction;
  includeConfidential: boolean;
  onlyLatestRevision: boolean;
  documentTypes?: string[] | null;
  metaData?: [
    {
      key?: string;
      matchesAny?: string[];
      matchesAll?: string[];
    },
  ];
}
