import { MULTI_EMPLOYMENT_IDS } from './mockMe';

const createDocument = ({
  id,
  fileName,
  created,
  registrationNumber,
  employmentId = '287987',
}: {
  id: string;
  fileName: string;
  created: string;
  registrationNumber: string;
  employmentId?: string;
}) => ({
  archive: false,
  confidentiality: {
    confidential: false,
  },
  created,
  createdBy: 'testi31test',
  description: 'Anställningsbevis för timavlönad',
  documentData: [
    {
      fileName,
      fileSizeInBytes: 81861,
      id,
      mimeType: 'application/pdf',
    },
  ],
  id,
  metadataList: [
    {
      key: 'employmentId',
      value: employmentId,
    },
    {
      key: 'partyId',
      value: 'babababa-aaaa-aaaaaaaa-bbbc0e598c2d',
    },
    {
      key: 'startDate',
      value: '2025-01-01T00:00:00',
    },
    {
      key: 'endDate',
      value: 'null',
    },
  ],
  municipalityId: '2281',
  registrationNumber,
  revision: 0,
  type: 'EMPLOYMENT_CERTIFICATE',
});

export const mockDocuments = {
  data: {
    _meta: {
      count: 57,
      limit: 100,
      page: 0,
      totalPages: 1,
      totalRecords: 57,
    },
    documents: [
      createDocument({
        id: 'hssdjsjshsd-0778-ksksddm-88579eedb253',
        fileName: 'ogaboga.pdf',
        created: '2026-06-01T13:32:40.624+02:00',
        registrationNumber: '2026-2281-64',
      }),
      createDocument({
        id: 'klsdjkfdn-kakakaka-1cefa65b3bf0',
        fileName: 'choklad_manifest.pdf',
        created: '2026-05-13T15:01:35.716+02:00',
        registrationNumber: '2026-2281-42',
      }),
    ],
  },
  message: 'success',
};

export const mockMultiEmploymentDocumentList = [
  createDocument({
    id: 'aaaa1111-doc-first-employment-0001',
    fileName: 'forsta_anstallningen_a.pdf',
    created: '2026-06-01T13:32:40.624+02:00',
    registrationNumber: '2026-2281-101',
    employmentId: `${MULTI_EMPLOYMENT_IDS.first}`,
  }),
  createDocument({
    id: 'aaaa2222-doc-first-employment-0002',
    fileName: 'forsta_anstallningen_b.pdf',
    created: '2026-05-13T15:01:35.716+02:00',
    registrationNumber: '2026-2281-102',
    employmentId: `${MULTI_EMPLOYMENT_IDS.first}`,
  }),
  createDocument({
    id: 'bbbb1111-doc-second-employment-0001',
    fileName: 'andra_anstallningen_a.pdf',
    created: '2026-04-02T09:12:00.000+02:00',
    registrationNumber: '2026-2281-201',
    employmentId: `${MULTI_EMPLOYMENT_IDS.second}`,
  }),
];

const documentTypes = [
  ['Anställningsavtal', 'EMPLOYMENT_CONTRACT'],
  ['Anställningsbevis', 'EMPLOYMENT_CERTIFICATE'],
  ['Lönespecifikation', 'PAY_SLIP'],
  ['Parkeringsböter', 'PARKING_TICKET'],
  ['Testdokument', 'TEST_DOCUMENT'],
];

export const mockTypes = {
  data: documentTypes.map(([displayName, type]) => ({
    displayName,
    type,
  })),
  message: 'success',
};
