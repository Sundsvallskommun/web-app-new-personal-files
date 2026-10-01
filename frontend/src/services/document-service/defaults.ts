import { ApiResponse } from '@services/api-service';
import { IDocument } from '@interfaces/document/document';

export const emptyDocument: IDocument = {
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

export const emptyDocumentResponse: ApiResponse<IDocument> = {
  data: emptyDocument,
  message: 'none',
};
