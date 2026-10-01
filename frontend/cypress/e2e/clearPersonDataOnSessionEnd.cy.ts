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

const PREFERENCE_STORAGE_KEY = `${Cypress.env('appName')}-admin-store`;

const seedStorage = (win: Cypress.AUTWindow) => {
  Object.entries(PERSON_STORAGE).forEach(([key, value]) => {
    win.localStorage.setItem(key, JSON.stringify(value));
  });
  win.localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify({ state: { colorScheme: 'dark' }, version: 0 }));
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

  it('keeps user preferences, which say nothing about a person', () => {
    cy.intercept('GET', '**/me', { statusCode: 401, body: { message: 'NOT_AUTHORIZED' } }).as('getMe');
    cy.intercept('GET', '**/document/types', mockTypes);
    cy.intercept('GET', '**/companies', mockCompanies);
    cy.intercept('GET', '**/formofemployments', mockFormOfEmployments);
    cy.intercept('GET', '**/user/avatar*', { statusCode: 200, body: '' });

    cy.visit('http://localhost:3000/min-personakt', { onBeforeLoad: seedStorage });

    cy.wait('@getMe');

    cy.window().should((win) => {
      expect(PREFERENCE_STORAGE_KEY, 'preference key').to.not.contain('undefined');
      expect(win.localStorage.getItem(PREFERENCE_STORAGE_KEY), PREFERENCE_STORAGE_KEY).to.not.be.null;
    });
  });
});
