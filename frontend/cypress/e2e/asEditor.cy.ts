/// <reference types="cypress" />

import { mockCompanies, mockEmployee, mockFormOfEmployments } from 'cypress/fixtures/mockEmployee';
import { mockEditor, mockEmployeeByLoginName, mockUserEmployments } from '../fixtures/mockMe';
import { mockDocuments, mockTypes } from '../fixtures/mockDocuments';
import { mockEndedEmploymentsEmpty } from '../fixtures/mockEndedEmployments';

const EMPLOYEE_ID = mockEmployee.data[0].personId;
const EMPLOYMENT_ID = `${mockEmployee.data[0].employments[0].employmentId}`;

const mockEmployeeDocuments = {
  ...mockDocuments,
  data: {
    ...mockDocuments.data,
    documents: mockDocuments.data.documents.map((doc) => ({
      ...doc,
      metadataList: doc.metadataList.map((meta) =>
        meta.key === 'employmentId' ? { ...meta, value: EMPLOYMENT_ID } : meta
      ),
    })),
  },
};

describe('Handling personal files as editor', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/me', mockEditor).as('getMe');
    cy.intercept('GET', `**/getEmployeeByLoginName/${mockEditor.data.username}`, mockEmployeeByLoginName).as(
      'getEmployeeByLoginName'
    );
    cy.intercept('GET', '**/getemployments/**/employeeEmployments', mockUserEmployments).as('getUserEmployments');
    cy.intercept('GET', `**/getemployments/${EMPLOYEE_ID}/employeeEmployments`, mockEmployee).as(
      'getEmployeeEmployments'
    );
    cy.intercept('GET', '**/user/avatar?width=44', {
      statusCode: 200,
      body: '',
    }).as('getAvatar');
    cy.intercept('GET', '**/api/getmanageremployees/**', {
      data: { pageNumber: 0, pageSize: 0, totalRecords: 0, totalPages: 0, data: [] },
      message: 'success',
    }).as('getManagerEmployees');
    cy.intercept('GET', '**/companies', mockCompanies).as('getCompanies');
    cy.intercept('GET', '**/formofemployments', mockFormOfEmployments).as('getFormOfEmployments');
    cy.intercept('GET', '**/document/types', mockTypes).as('getDocumentTypes');
    cy.intercept('POST', '**/document/search', mockEmployeeDocuments).as('getDocuments');
    cy.intercept('GET', '**/endedEmployments/**', mockEndedEmploymentsEmpty).as('getEndedEmployments');
  });

  it('lands on search personal file instead of my employees', () => {
    cy.visit('http://localhost:3000/mina-medarbetare');
    cy.wait('@getMe');
    cy.url().should('include', '/sok-personakt');
    cy.get('[data-cy="searchfield-personalfiles"]').should('exist');
  });

  it('can upload but not delete documents on a searched personal file', () => {
    cy.visit(`http://localhost:3000/sok-personakt/${EMPLOYEE_ID}`);
    cy.wait('@getMe');
    cy.wait('@getEmployeeEmployments');
    cy.wait('@getDocuments');

    const person = mockEmployee.data[0];
    cy.get('h1').should('contain', `${person.givenname} ${person.lastname}`);
    cy.get('[data-cy="managed-employments-back-link"]').should('not.exist');

    cy.get('[data-cy="upload-document"]').should('exist');

    cy.contains(`Dokument (${mockEmployeeDocuments.data.documents.length})`).should('exist');
    cy.get('[data-cy="document-list"]').should('exist');

    mockEmployeeDocuments.data.documents.forEach((doc) => {
      const fileName = doc.documentData?.[0].fileName || '';

      cy.contains(fileName)
        .should('be.visible')
        .parents('li')
        .within(() => {
          cy.get('[aria-haspopup="dialog"]').should('exist').click();
        });

      cy.get(`[data-cy="document-open-${doc.id}"]`).should('be.visible');
      cy.get(`[data-cy="document-delete-${doc.id}"]`).should('not.exist');

      cy.get('body').type('{esc}');
    });
  });
});
