import { mockCompanies, mockFormOfEmployments } from 'cypress/fixtures/mockEmployee';
import { mockMe, mockEmployeeByLoginName, mockUserEmployments } from '../fixtures/mockMe';
import { mockTypes } from '../fixtures/mockDocuments';

describe('personId delivered by /me', () => {
  let loginNameLookups = 0;
  let avatarRequests = 0;

  const interceptBaseRequests = (meFixture: typeof mockMe) => {
    loginNameLookups = 0;
    avatarRequests = 0;

    cy.intercept('GET', '**/me', meFixture).as('getMe');

    cy.intercept('GET', '**/getEmployeeByLoginName/**', (req) => {
      loginNameLookups += 1;
      req.reply(mockEmployeeByLoginName);
    }).as('getEmployeeByLoginName');

    cy.intercept('GET', '**/user/avatar*', (req) => {
      avatarRequests += 1;
      req.reply({ statusCode: 200, body: 'fake-avatar-bytes' });
    }).as('getAvatar');

    cy.intercept('GET', '**/getemployments/**/employeeEmployments', mockUserEmployments).as('getUserEmployments');
    cy.intercept('GET', '**/companies', mockCompanies);
    cy.intercept('GET', '**/formofemployments', mockFormOfEmployments);
    cy.intercept('GET', '**/document/types', mockTypes);

    cy.intercept('POST', '**/document/search', {
      data: { _meta: { count: 0, limit: 100, page: 0, totalPages: 0, totalRecords: 0 }, documents: [] },
      message: 'success',
    }).as('getDocuments');
  };

  it('does not look up persondata when /me already provides personId', () => {
    interceptBaseRequests(mockMe);

    cy.visit('http://localhost:3000/min-personakt');

    cy.wait('@getUserEmployments').its('request.url').should('include', mockMe.data.personId);

    cy.then(() => {
      expect(loginNameLookups, 'getEmployeeByLoginName calls for the logged-in user').to.equal(0);
    });
  });

  it('falls back to the persondata lookup when /me has no personId', () => {
    const meWithoutPersonId = { ...mockMe, data: { ...mockMe.data, personId: '' } };
    interceptBaseRequests(meWithoutPersonId);

    cy.visit('http://localhost:3000/min-personakt');

    cy.wait('@getEmployeeByLoginName');

    cy.then(() => {
      expect(loginNameLookups, 'fallback lookup happened').to.be.greaterThan(0);
    });
  });

  it('renders the avatar from the fetched blob rather than refetching it', () => {
    interceptBaseRequests(mockMe);

    cy.visit('http://localhost:3000/min-personakt');

    cy.wait('@getAvatar');

    cy.get('[data-cy="overview-aside"] img')
      .should('have.attr', 'src')
      .and('match', /^blob:/);

    cy.then(() => {
      expect(avatarRequests, 'XHR requests to /user/avatar').to.equal(1);
    });
  });
});
