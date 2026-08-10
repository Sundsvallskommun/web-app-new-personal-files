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
  DocumentDataList,
  MetadataList,
} from '@interfaces/document/document';
import { Employment } from '@interfaces/employee/employee';
import { toBase64 } from '@utils/toBase64';
import dayjs from 'dayjs';

export const employmentIdsOf = (employments: Employment[]): string[] =>
  employments.map((employment) => `${employment.employmentId}`).filter((id) => id && id !== 'undefined');

export const buildPersonDocumentsMetadata = (personId: string, employments: Employment[]): MetaData[] => [
  { key: 'employmentId', matchesAny: employmentIdsOf(employments) },
  { key: 'partyId', matchesAny: [personId] },
];

export const getDocuments: (metaData: MetaData[]) => Promise<PageDocument> = async (metaData: MetaData[]) => {
  const body: SearchDocument = {
    page: 1,
    limit: 100,
    sortDirection: Direction.ASC,
    includeConfidential: true,
    onlyLatestRevision: true,
    metaData: metaData,
  };

  return await apiService
    .post<ApiResponse<PageDocument>>(`/document/search`, body)
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
) => Promise<ApiResponse<{ data: string; message: string }>> = async (registrationNumber, documentDataId) => {
  if (!registrationNumber || !documentDataId) {
    console.error('No document registrationNumber or documentDataId found, cannot fetch. Returning.');
  }
  const url = `/document/${registrationNumber}/files/${documentDataId}`;
  return await apiService
    .get<ApiResponse<{ data: string; message: string }>>(url)
    .then((res) => res.data)
    .catch((e) => {
      console.error('Something went wrong when fetching document: ', documentDataId);
      throw e;
    });
};

export const uploadDocument: (document: CreateDocument, file: File) => Promise<CreateDocument> = async (
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
    .get<ApiResponse<DocumentType[]>>('/document/types')
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
  documentList: DocumentDataList[];
  documentTypes: DocumentType[];
  documentsIsLoading: boolean;
}
interface Actions {
  setDocumentList: (documentList: DocumentDataList[]) => void;
  setDocumentTypes: (DocumentTypes: DocumentType[]) => void;
  getDocumentList: (metadata: MetaData[]) => Promise<ServiceResponse<PageDocument>>;
  getDocument: (registrationNumber: string, documentDataId: string) => Promise<ServiceResponse<object>>;
  uploadDocument: (UploadBody: CreateDocument, file: File) => Promise<ServiceResponse<object>>;
  getDocumentTypes: () => Promise<ServiceResponse<DocumentType[]>>;
  deleteDocument: (registrationNumber: string, documentDataId: string) => Promise<ServiceResponse<boolean>>;
  reset: () => void;
}

const initialState: State = {
  documentList: [],
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
        documentList: DocumentDataList[];
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

          const formatDateTime = (created?: string): string => {
            if (!created) {
              return '';
            }

            const date = dayjs(created).date();
            const month = new Date(created).toLocaleString('default', { month: 'long' });
            const year = dayjs(created).year();
            const time = dayjs(created).format('HH.mm');

            return `${date} ${month} ${year} kl.${time}`;
          };

          const getEmploymentId = (metadataList?: MetadataList[]): string => {
            const value = metadataList?.find((x) => x.key === 'employmentId')?.value || '';
            return typeof value === 'string' ? value : '';
          };

          await set(() => ({ documentsIsLoading: true }));

          try {
            const res = await getDocuments(metadata);
            let documentTypes = get().documentTypes;
            if (!documentTypes.length) {
              documentTypes = await getDocumentTypes();
              set(() => ({ documentTypes }));
            }

            const list: DocumentDataList[] =
              res?.documents?.flatMap((document) => {
                if (!document.documentData?.length) {
                  return [];
                }

                const dateTime = formatDateTime(document.created);
                const createdOriginal = new Date(document.created ?? '');
                const employmentId = getEmploymentId(document.metadataList);
                const documentTypeDisplayName =
                  documentTypes?.find((documentType) => documentType.type === document.type)?.displayName ?? '';

                const typeSuffixName = documentTypeDisplayName ? ` (${documentTypeDisplayName})` : '';

                return document.documentData.map((data) => ({
                  fileName: `${data.fileName ?? ''}${typeSuffixName}`,
                  originalName: data.fileName ?? '',
                  registrationNumber: document.registrationNumber ?? '',
                  id: data.id ?? '',
                  mimeType: data.mimeType ?? '',
                  dateTime,
                  createdOriginal,
                  employmentId,
                }));
              }) ?? [];

            documents = list.toSorted((a, b) => b.createdOriginal.getTime() - a.createdOriginal.getTime());

            set(() => ({
              documentList: documents,
            }));

            return { data: documents };
          } finally {
            set(() => ({ documentsIsLoading: false }));
          }
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
