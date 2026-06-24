const createDocument = ({
  id,
  fileName,
  created,
  registrationNumber,
}: {
  id: string;
  fileName: string;
  created: string;
  registrationNumber: string;
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
      value: '287987',
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
