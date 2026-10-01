import { mockCompanies, mockFormOfEmployments } from 'cypress/fixtures/mockEmployee';
import { mockMe, mockEmployeeByLoginName, mockUserEmploymentsMulti, MULTI_EMPLOYMENT_IDS } from '../fixtures/mockMe';
import { mockMultiEmploymentDocumentList, mockTypes } from '../fixtures/mockDocuments';

const FIRST_EMPLOYMENT_TITLE = 'Verksamhetsutvecklare';
const SECOND_EMPLOYMENT_TITLE = 'Projektledare';

const firstEmploymentDocs = mockMultiEmploymentDocumentList.filter((doc) =>
  doc.metadataList.some((meta) => meta.key === 'employmentId' && meta.value === `${MULTI_EMPLOYMENT_IDS.first}`)
);
const secondEmploymentDocs = mockMultiEmploymentDocumentList.filter((doc) =>
  doc.metadataList.some((meta) => meta.key === 'employmentId' && meta.value === `${MULTI_EMPLOYMENT_IDS.second}`)
);

const requestedEmploymentIds = (body: { metaData?: { key?: string; matchesAny?: string[] }[] }): string[] =>
  body.metaData?.find((meta) => meta.key === 'employmentId')?.matchesAny ?? [];

describe('Documents for a person with several employments', () => {
  let searchBodies: { metaData?: { key?: string; matchesAny?: string[] }[] }[] = [];

  beforeEach(() => {
    searchBodies = [];

    cy.intercept('GET', '**/me', mockMe).as('getMe');
    cy.intercept('GET', `**/getEmployeeByLoginName/${mockMe.data.username}`, mockEmployeeByLoginName);
    cy.intercept('GET', '**/getemployments/**/employeeEmployments', mockUserEmploymentsMulti).as('getUserEmployments');
    cy.intercept('GET', '**/user/avatar?width=44', { statusCode: 200, body: '' });
    cy.intercept('GET', '**/companies', mockCompanies);
    cy.intercept('GET', '**/formofemployments', mockFormOfEmployments);
    cy.intercept('GET', '**/document/types', mockTypes);

    cy.intercept('POST', '**/document/search', (req) => {
      searchBodies.push(req.body);
      const requestedIds = requestedEmploymentIds(req.body);
      const documents = mockMultiEmploymentDocumentList.filter((doc) =>
        doc.metadataList.some((meta) => meta.key === 'employmentId' && requestedIds.includes(meta.value))
      );

      req.reply({
        data: {
          _meta: { count: documents.length, limit: 100, page: 0, totalPages: 1, totalRecords: documents.length },
          documents,
        },
        message: 'success',
      });
    }).as('getDocuments');

    cy.intercept('DELETE', '**/document/**/files/**', { data: true, message: 'success' }).as('deleteDocument');

    cy.visit('http://localhost:3000/min-personakt');
  });

  it('searches once for the whole person instead of once per employment', () => {
    cy.wait('@getDocuments');
    cy.contains('table', SECOND_EMPLOYMENT_TITLE).should('exist');

    cy.then(() => {
      expect(searchBodies, 'at least one document search was sent').to.have.length.greaterThan(0);

      searchBodies.forEach((body) => {
        expect(requestedEmploymentIds(body)).to.have.members([
          `${MULTI_EMPLOYMENT_IDS.first}`,
          `${MULTI_EMPLOYMENT_IDS.second}`,
        ]);
      });
    });
  });

  it('shows each employment only its own documents', () => {
    cy.contains('table', FIRST_EMPLOYMENT_TITLE).within(() => {
      cy.contains(`Dokument (${firstEmploymentDocs.length})`).should('be.visible');
      firstEmploymentDocs.forEach((doc) => {
        cy.contains(`${doc.documentData[0].fileName}`).should('be.visible');
      });
      secondEmploymentDocs.forEach((doc) => {
        cy.contains(`${doc.documentData[0].fileName}`).should('not.exist');
      });
    });

    cy.contains('table', SECOND_EMPLOYMENT_TITLE).within(() => {
      cy.contains(`Dokument (${secondEmploymentDocs.length})`).should('be.visible');
      secondEmploymentDocs.forEach((doc) => {
        cy.contains(`${doc.documentData[0].fileName}`).should('be.visible');
      });
    });
  });

  it('keeps the other employment documents after deleting one', () => {
    const docToDelete = firstEmploymentDocs[0];
    const survivingDoc = secondEmploymentDocs[0];

    cy.contains('table', SECOND_EMPLOYMENT_TITLE).within(() => {
      cy.contains(`${survivingDoc.documentData[0].fileName}`).should('be.visible');
    });

    cy.contains('table', FIRST_EMPLOYMENT_TITLE).within(() => {
      cy.contains(`${docToDelete.documentData[0].fileName}`)
        .parents('li')
        .within(() => {
          cy.get('[aria-haspopup="dialog"]').click();
        });
    });

    cy.get(`[data-cy="document-delete-${docToDelete.id}"]`).should('be.visible').click();
    cy.contains('Ja').click();
    cy.wait('@deleteDocument');

    cy.contains('table', SECOND_EMPLOYMENT_TITLE).within(() => {
      cy.contains(`Dokument (${secondEmploymentDocs.length})`).should('be.visible');
      cy.contains(`${survivingDoc.documentData[0].fileName}`).should('be.visible');
    });
  });
});
