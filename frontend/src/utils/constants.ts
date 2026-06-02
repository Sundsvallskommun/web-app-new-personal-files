import { PersonalFileUploadDocumentFormModel } from '@interfaces/document/document';

//paths generally re used
export const PATH = {
  api: {
    samlLogin: '/saml/login',
    login: '/login',
  },
  searchPersonalFile: 'sok-personakt',
  myEmployees: 'mina-medarbetare',
  myPersonalFile: 'min-personakt',
};

export const MAX_FILE_SIZE = 1 * 1024 * 1024;
export const COMPANY_ID = 1;

export const UPLOAD_DOCUMENT_DEFAULT_VALUES: PersonalFileUploadDocumentFormModel = {
  attachment: [],
  attachmentCatgory: '',
};
