export const mockEndedEmployments = {
  data: [
    {
      title: 'Undersköterska',
      orgId: 13,
      orgName: 'VOF Hemtjänst',
      topOrgId: 13,
      topOrgName: 'Vård och omsorgsförvaltningen',
      benefitGroupId: 11,
      hireDate: '2018-06-01',
      retireDate: '2022-12-31',
      eventType: 'termination',
      eventInfo: null,
      companyId: 1,
      companyName: 'Sundsvalls kommun',
      empId: 111111,
      businessKey: 'ended-1',
    },
    {
      title: 'Barnskötare',
      orgId: 13,
      orgName: 'Förskola',
      topOrgId: 13,
      topOrgName: 'Barn och utbildningsförvaltningen',
      benefitGroupId: null,
      hireDate: '2015-08-15',
      retireDate: '2018-05-31',
      eventType: 'termination',
      eventInfo: null,
      companyId: 1,
      companyName: 'Sundsvalls kommun',
      empId: 222222,
      businessKey: 'ended-2',
    },
  ],
  message: 'success',
};

export const mockEndedEmploymentsEmpty = {
  data: [],
  message: 'success',
};
