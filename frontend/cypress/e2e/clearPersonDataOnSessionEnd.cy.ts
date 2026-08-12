import { mockCompanies, mockFormOfEmployments } from 'cypress/fixtures/mockEmployee';
import { mockTypes } from '../fixtures/mockDocuments';

const PERSON_STORAGE = {
  'employee-storage': {
    state: {
      employeeEmployments: [{ personId: 'aaaa-bbbb-cccc', personNumber: '199001011234', givenname: 'Test' }],
      employmentslist: [],
      selectedEmployment: {},
    },
    version: 1,
  },
  'document-storage': {
    state: { documentList: [{ fileName: 'anstallningsavtal.pdf' }], documentTypes: [] },
    version: 1,
  },
};

const REFERENCE_STORAGE = {
  'foundationObject-storage': {
    state: { companies: mockCompanies.data, formOfEmployments: mockFormOfEmployments.data },
    version: 1,
  },
};

const seedStorage = (win: Cypress.AUTWindow) => {
  Object.entries({ ...PERSON_STORAGE, ...REFERENCE_STORAGE }).forEach(([key, value]) => {
    win.localStorage.setItem(key, JSON.stringify(value));
  });
};

describe('Stored person data when a session ends', () => {
  it('is cleared when the session has expired', () => {
    cy.intercept('GET', '**/me', { statusCode: 401, body: { message: 'NOT_AUTHORIZED' } }).as('getMe');
    cy.intercept('GET', '**/document/types', mockTypes);
    cy.intercept('GET', '**/companies', mockCompanies);
    cy.intercept('GET', '**/formofemployments', mockFormOfEmployments);
    cy.intercept('GET', '**/user/avatar*', { statusCode: 200, body: '' });

    cy.visit('http://localhost:3000/min-personakt', { onBeforeLoad: seedStorage });

    cy.wait('@getMe');

    cy.window().should((win) => {
      expect(win.localStorage.getItem('employee-storage'), 'employee-storage').to.be.null;
      expect(win.localStorage.getItem('document-storage'), 'document-storage').to.be.null;
    });
  });

  it('keeps reference data, which says nothing about a person', () => {
    cy.intercept('GET', '**/me', { statusCode: 401, body: { message: 'NOT_AUTHORIZED' } }).as('getMe');
    cy.intercept('GET', '**/document/types', mockTypes);
    cy.intercept('GET', '**/companies', mockCompanies);
    cy.intercept('GET', '**/formofemployments', mockFormOfEmployments);
    cy.intercept('GET', '**/user/avatar*', { statusCode: 200, body: '' });

    cy.visit('http://localhost:3000/min-personakt', { onBeforeLoad: seedStorage });

    cy.wait('@getMe');

    cy.window().should((win) => {
      expect(win.localStorage.getItem('foundationObject-storage'), 'foundationObject-storage').to.not.be.null;
    });
  });
});
