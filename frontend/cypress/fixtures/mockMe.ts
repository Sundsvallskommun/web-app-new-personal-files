export const mockMe = {
  data: {
    personId: '',
    name: 'Elin Testqvist',
    email: '',
    username: 'testi31test',
    givenName: 'Elin',
    surname: 'Testqvist',
    workTitle: 'Verksamhetsutvecklare',
    permissions: {
      canReadOwnPF: true,
      canReadOwnDocs: true,
      canReadPF: true,
      canUploadDocs: true,
      canReadDocs: true,
      canDeleteDocs: true,
    },
    ADgroups: 'hr_department_admin_test,SG_Appl_Personakt_HR_Admin',
    systemRole: 'pf_hr_superadmin',
  },
  message: 'success',
};

export const mockEmployeeByLoginName = {
  data: {
    personid: 'xxxxxxxx-bbbb-aaaaaaaa-bbbc0e598c2d',
    loginName: mockMe.data.username,
    title: 'Verksamhetsutvecklare',
    workTitle: 'Verksamhetsutvecklare',
  },
  message: 'success',
};

export const mockUserEmployments = {
  data: [
    {
      personId: 'xxxxxxxx-bbbb-aaaaaaaa-bbbc0e598c2d',
      personNumber: '198907311234',
      isClassified: false,
      givenname: 'Elin',
      middlename: null,
      lastname: 'Testqvist',
      accounts: [
        {
          loginname: 'testi31test',
          companyId: 1,
          emailAddress: 'elin.testqvist@sundsvall.se',
        },
      ],
      referenceNumbers: [
        {
          referenceNumber: '1testi31TEST',
          companyId: 1,
        },
      ],
      employments: [
        {
          companyId: 1,
          startDate: '2025-01-01T00:00:00',
          endDate: null,
          employmentType: 0,
          title: 'Verksamhetsutvecklare',
          managerCode: null,
          orgId: 650,
          orgName: 'KSK Avd HR Stab',
          topOrgId: 28,
          topOrgName: 'Kommunstyrelsekontoret',
          benefitGroupId: 11,
          formOfEmploymentId: '1',
          isManual: false,
          paTeam: 'AS03A',
          isMainEmployment: true,
          isManager: false,
          manager: {
            personId: 'xxxxxx-aaaa-aaaa-aaaa-bbb878aa64c2',
            givenname: 'Johanna',
            middlename: null,
            lastname: 'Testin',
            loginname: 'joh28test',
            emailAddress: 'johanna.test@sundsvall.se',
            referenceNumber: null,
          },
          hiringManager: null,
          aid: '151012',
          empRowId: '1000',
          employmentId: 287987,
        },
      ],
    },
  ],
  message: 'success',
};

export const MULTI_EMPLOYMENT_IDS = {
  first: 287987,
  second: 300123,
} as const;

export const mockUserEmploymentsMulti = {
  data: [
    {
      ...mockUserEmployments.data[0],
      employments: [
        {
          ...mockUserEmployments.data[0].employments[0],
          employmentId: MULTI_EMPLOYMENT_IDS.first,
          title: 'Verksamhetsutvecklare',
        },
        {
          ...mockUserEmployments.data[0].employments[0],
          employmentId: MULTI_EMPLOYMENT_IDS.second,
          title: 'Projektledare',
          orgName: 'KSK Avd Digital Utveckling',
          isMainEmployment: false,
        },
      ],
    },
  ],
  message: 'success',
};

export const mockMeCanUpload = {
  ...mockMe,
  data: {
    ...mockMe.data,
    systemRole: 'pf_hr_superadmin',
    permissions: {
      ...mockMe.data.permissions,
      canUploadDocs: true,
      canReadOwnDocs: true,
    },
  },
};

export const mockUser = {
  ...mockMe,
  data: {
    ...mockMe.data,
    systemRole: 'pf_hr_user',
    permissions: {
      canReadOwnPF: true,
      canReadOwnDocs: true,
      canReadPF: false,
      canUploadDocs: false,
      canReadDocs: false,
      canDeleteDocs: false,
    },
    ADgroups: 'Kommunstyrelsekontoret-ALLA',
  },
};

export const mockSuperUser = {
  ...mockMe,
  data: {
    ...mockMe.data,
    systemRole: 'pf_hr_superuser',
    permissions: {
      canReadOwnPF: true,
      canReadOwnDocs: true,
      canReadPF: true,
      canUploadDocs: false,
      canReadDocs: false,
      canDeleteDocs: false,
    },
    ADgroups: 'HR-partners',
  },
};
export const mockAdmin = {
  ...mockMe,
  data: {
    ...mockMe.data,
    systemRole: 'pf_hr_admin',
    permissions: {
      canReadOwnPF: true,
      canReadOwnDocs: true,
      canReadPF: true,
      canUploadDocs: true,
      canReadDocs: true,
      canDeleteDocs: false,
    },
    ADgroups: 'Kommunstyrelsekontoret-CHEFER',
  },
};
