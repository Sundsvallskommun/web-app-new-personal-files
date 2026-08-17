export const mockMeAsManager = {
  data: {
    personId: '',
    name: 'Chef Chefsson',
    email: '',
    username: 'che01che',
    givenName: 'Chef',
    surname: 'Chefsson',
    workTitle: 'Chef',
    permissions: {
      canReadOwnPF: true,
      canReadOwnDocs: true,
      canReadPF: true,
      canUploadDocs: true,
      canReadDocs: true,
      canDeleteDocs: false,
    },
    ADgroups: 'Kommunstyrelsekontoret-CHEFER',
    systemRole: 'pf_hr_admin',
  },
  message: 'success',
};

export const mockMeAsManagerByLoginName = {
  data: {
    personid: 'xxxxxx-aaaa-aaaa-aaaa-bbb878aa64c2',
    loginName: mockMeAsManager.data.username,
    title: 'Chef',
    workTitle: 'Chef',
    isManager: true,
  },
  message: 'success',
};

export const mockManagerEmployees = {
  data: {
    pageNumber: 1,
    pageSize: 12,
    totalRecords: 3,
    totalPages: 1,
    data: [
      {
        personId: 'aaaaaaaa-2913-4b21-9d2a-49357e1169d3',
        fullName: 'Testanställd 1',
        birthdate: '19900101',
        employments: [
          {
            employmentId: 1,
            title: 'Systemarkitekt',
            isMainEmployment: true,
            orgName: 'Sundsvalls kommun',
          },
        ],
      },
      {
        personId: 'bbbbbbbb-6b63-4a4d-b743-92756efb33c7',
        fullName: 'Testanställd 2',
        birthdate: '19900102',
        employments: [
          {
            employmentId: 2,
            title: 'UX-designer',
            isMainEmployment: true,
            orgName: 'Sundsvalls kommun',
          },
        ],
      },
      {
        personId: 'cccccccc-787b-4d03-ba96-69190f09576b',
        fullName: 'Testanställd 3',
        birthdate: '19900103',
        employments: [
          {
            employmentId: 3,
            title: 'Systemutvecklare',
            isMainEmployment: true,
            orgName: 'Sundsvalls kommun',
          },
        ],
      },
    ],
  },
  message: 'success',
};
