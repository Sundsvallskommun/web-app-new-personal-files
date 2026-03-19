import { ServiceResponse } from '@interfaces/services';
import { __DEV__ } from '@sk-web-gui/react';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools, persist } from 'zustand/middleware';
import { ApiResponse, apiService } from '@services/api-service';
import {
  CreateDocument,
  Direction,
  MetaData,
  SearchDocument,
  DocumentType,
  PageDocument,
} from '@interfaces/document/document';
import { toBase64 } from '@utils/toBase64';

export const getDocuments: (metaData: MetaData[]) => Promise<PageDocument> = async (metaData: MetaData[]) => {
  const body: SearchDocument = {
    page: 1,
    limit: 15,
    sortDirection: Direction.ASC,
    includeConfidential: true,
    onlyLatestRevision: true,
    metaData: metaData,
  };
  return await apiService
    .post<any>(`/document/search`, body)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching employee documents');
      throw e;
    });
};

export const fetchDocument: (
  registrationNumber: string,
  documentDataId: string
) => Promise<ApiResponse<Object>> = async (registrationNumber, documentDataId) => {
  if (!registrationNumber || !documentDataId) {
    console.error('No document registrationNumber or documentDataId found, cannot fetch. Returning.');
  }
  const url = `/document/${registrationNumber}/files/${documentDataId}`;
  return await apiService
    .get<ApiResponse<Object>>(url)
    .then((res) => res.data)
    .catch((e) => {
      console.error('Something went wrong when fetching document: ', documentDataId);
      throw e;
    });
};

export const uploadDocument: (document: CreateDocument, file: File) => Promise<Object> = async (
  document: CreateDocument,
  file: File
) => {
  const fileData = await toBase64(file);
  const buf = Buffer.from(fileData, 'base64');
  const blob = new Blob([buf], { type: file.type });

  const formData = new FormData();

  formData.append(`documentFiles`, blob, file.name);
  formData.append(`createdBy`, document.createdBy);
  formData.append(`confidentiality`, JSON.stringify(document.confidentiality));
  formData.append(`archive`, `${document.archive}`);
  formData.append(`description`, document.description);
  formData.append(`metadataList`, JSON.stringify(document.metadataList));
  formData.append(`type`, document.type);

  return await apiService
    .post<CreateDocument>(`/document/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when uploading document to employee');
      throw e;
    });
};

export const getDocumentTypes: () => Promise<DocumentType[]> = async () => {
  return await apiService
    .get<any>('/document/types')
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching document types');
      throw e;
    });
};

export const deleteDocument: (registrationNumber: string, documentDataId: string) => Promise<boolean> = async (
  registrationNumber,
  documentDataId
) => {
  try {
    const res = await apiService.delete<boolean>(`/document/${registrationNumber}/files/${documentDataId}`);
    return res.data;
  } catch (e) {
    console.error('Something went wrong when deleting note');
    throw e;
  }
};

interface State {
  documentList: PageDocument;
  documentTypes: DocumentType[];
  documentsIsLoading: boolean;
}
interface Actions {
  setDocumentList: (documentList: PageDocument) => void;
  setDocumentTypes: (DocumentTypes: DocumentType[]) => void;
  getDocumentList: (metadata: MetaData[]) => Promise<ServiceResponse<PageDocument>>;
  getDocument: (registrationNumber: string, documentDataId: string) => Promise<ServiceResponse<Object>>;
  uploadDocument: (UploadBody: CreateDocument, file: File) => Promise<ServiceResponse<Object>>;
  getDocumentTypes: () => Promise<ServiceResponse<DocumentType[]>>;
  deleteDocument: (registrationNumber: string, documentDataId: string) => Promise<ServiceResponse<boolean>>;
  reset: () => void;
}

const initialState: State = {
  documentList: {},
  documentTypes: [],
  documentsIsLoading: false,
};

export const useDocumentStore = createWithEqualityFn<
  State & Actions,
  [
    ['zustand/devtools', never],
    [
      'zustand/persist',
      {
        documentList: PageDocument;
        documentTypes: DocumentType[];
      },
    ],
  ]
>(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setDocumentList: (documentList) => set(() => ({ documentList, documentsIsLoading: false })),
        setDocumentTypes: (documentTypes) => set(() => ({ documentTypes })),
        getDocumentList: async (metadata: MetaData[]) => {
          let documents = get().documentList;
          await set(() => ({ documentsIsLoading: true }));
          const res = await getDocuments(metadata);
          if (res) {
            documents = res;
            set(() => ({ documentList: documents, documentsIsLoading: false }));
          }

          return { data: documents };
        },
        getDocument: async (registrationNumber, documentDataId) => {
          const res = await fetchDocument(registrationNumber, documentDataId);
          return { data: res };
        },
        uploadDocument: async (body: CreateDocument, file: File) => {
          const res = await uploadDocument(body, file);
          return { data: res };
        },
        getDocumentTypes: async () => {
          let types = get().documentTypes;
          const res = await getDocumentTypes();
          if (res) {
            types = res;
            set(() => ({ documentTypes: types }));
          }
          return { data: types };
        },
        deleteDocument: async (registrationNumber, documentDataId) => {
          let res;
          if (registrationNumber && documentDataId) {
            res = await deleteDocument(registrationNumber, documentDataId);
          }
          return { data: res };
        },
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'document-storage',
        version: 1,
        partialize: ({ documentList, documentTypes }) => ({
          documentList,
          documentTypes,
        }),
      }
    ),
    { enabled: __DEV__ }
  )
);
