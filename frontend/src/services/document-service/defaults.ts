import { ApiResponse } from '@services/api-service';
import { Document } from '@interfaces/document/document';

export const emptyDocument: Document = {
  id: '',
  municipalityId: '',
  registrationNumber: '',
  /** @format int32 */
  revision: undefined,
  confidentiality: {},
  description: '',
  created: '',
  createdBy: '',
  archive: false,
  metadataList: [],
  documentData: [],
  type: '',
};

export const emptyDocumentResponse: ApiResponse<Document> = {
  data: emptyDocument,
  message: 'none',
};
