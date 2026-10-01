export const mockEmployee = {
  data: [
    {
      personId: 'babababa-aaaa-aaaaaaaa-bbbc0e598c2d',
      personNumber: '198907311234',
      isClassified: false,
      givenname: 'Carina',
      middlename: null,
      lastname: 'Testensen',
      accounts: [
        {
          loginname: 'car25Test',
          companyId: 1,
          emailAddress: 'carina.test@sundsvall.se',
        },
      ],
      employments: [
        {
          companyId: 1,
          startDate: '2024-04-01T00:00:00',
          endDate: '2026-03-31T00:00:00',
          employmentType: 0,
          title: 'Vårdbiträde',
          managerCode: null,
          orgId: 7284,
          orgName: 'VOF Gemensam administration',
          topOrgId: 23,
          topOrgName: 'Vård och omsorgsförvaltningen',
          benefitGroupId: 44,
          formOfEmploymentId: 'T',
          isManual: false,
          paTeam: 'Tim Sblå',
          isMainEmployment: true,
          isManager: false,
          manager: {
            personId: 'vavavava-xxxx-aaaa-bbbb-lalalalalala',
            givenname: 'Erika',
            middlename: null,
            lastname: 'Testberg',
            loginname: 'eri31Test',
            emailAddress: 'erika.testberg@sundsvall.se',
            referenceNumber: '9ERI31TEST',
          },
          hiringManager: null,
          aid: '207024',
          empRowId: '1000',
          employmentId: 284397,
        },
      ],
    },
  ],
  message: 'success',
};

export const mockCompanies = {
  data: [
    {
      companyId: 1,
      companyCode: '10',
      shortName: 'SK',
      displayName: 'Sundsvalls kommun',
      isSchool: false,
      isPrivateSchool: false,
    },
  ],
  message: 'success',
};

const formOfEmploymentDescriptions: Record<string, string> = {
  '1': 'Tillsvidare',
  '2': 'Vikariat mån.avlönad',
  '3': 'Vikariat timavlönad',
  '4': 'Allmän visstid månad',
  '5': 'Allmän visstid tim',
  '6': 'Arbetsmarknadsåtgärd',
  '7': 'Övriga',
  '8': '*Introd år skollagen',
  '9': 'Tidsbegr provanställ',
  A: 'Säsongsanställda',
  C: 'Obehörig lärare',
  D: 'Arb.tag fyllt 67 år',
  E: 'Pensionär före 67år',
  F: 'Projektanställning',
  S: 'Särskild visstidanst',
  T: 'Tidsbegr anställning',
  X: 'Extern resurs',
};

export const mockFormOfEmployments = {
  data: Object.entries(formOfEmploymentDescriptions).map(([foeId, description]) => ({
    foeId,
    description,
  })),
  message: 'success',
};
