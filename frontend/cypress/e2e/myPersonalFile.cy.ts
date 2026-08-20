import { mockCompanies, mockFormOfEmployments } from 'cypress/fixtures/mockEmployee';
import { mockMe, mockEmployeeByLoginName, mockUserEmployments } from '../fixtures/mockMe';
import { mockDocuments, mockTypes } from '../fixtures/mockDocuments';
import { IDocument } from '../../src/interfaces/document/document';
import dayjs from 'dayjs';

describe('My personal file', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/me', mockMe).as('getMe');
    cy.intercept('GET', `**/getEmployeeByLoginName/${mockMe.data.username}`, mockEmployeeByLoginName).as(
      'getEmployeeByLoginName'
    );
    cy.intercept('GET', '**/getemployments/**/employeeEmployments', mockUserEmployments).as('getUserEmployments');
    cy.intercept('GET', '**/user/avatar?width=44', {
      statusCode: 200,
      body: '',
    }).as('getAvatar');
    cy.intercept('GET', '**/companies', mockCompanies).as('getCompanies');
    cy.intercept('GET', '**/formofemployments', mockFormOfEmployments).as('getFormOfEmployments');
    cy.intercept('GET', '**/document/types', mockTypes).as('getDocumentTypes');
    cy.intercept('POST', '**/document/search', mockDocuments).as('getDocuments');
    cy.intercept('GET', '**/document/*/files/*', {
      data: 'dGVzdA==',
      message: 'success',
    }).as('getDocument');
    cy.intercept('DELETE', '**/document/**/files/**', {
      data: true,
      message: 'success',
    }).as('deleteDocument');
    cy.intercept('POST', '**/document/upload', {
      data: true,
      message: 'success',
    }).as('uploadDocument');
    cy.visit('http://localhost:3000/min-personakt');
  });

  it('displays all employments and documents', () => {
    const person = mockUserEmployments.data[0];
    cy.get('h1').should('contain', `${person.givenname} ${person.lastname}`);

    person.employments.forEach((employment) => {
      const documentsForEmployment: IDocument[] = mockDocuments.data.documents.filter((doc) => {
        const empId = doc.metadataList?.find((x) => x.key === 'employmentId')?.value || '';
        return empId === `${employment.employmentId}`;
      });

      cy.contains('table', employment.title).within(() => {
        cy.contains(employment.title).should('be.visible');
        cy.contains(employment.topOrgName).should('be.visible');
        cy.contains(employment.orgName).should('be.visible');

        cy.contains(`Dokument (${documentsForEmployment.length})`).should('be.visible');

        documentsForEmployment.forEach((doc) => {
          const date = dayjs(doc.created).date();
          const month = new Date(doc.created).toLocaleString('default', { month: 'long' });
          const year = dayjs(doc.created).year();
          const time = dayjs(doc.created).format('HH.mm');
          const dateString = `${date} ${month} ${year} kl.${time}`;
          cy.get('[data-cy="document-list"]').within(() => {
            cy.contains(`${doc.documentData?.[0].fileName}`).should('be.visible');
            cy.contains(dateString).should('be.visible');
          });
        });
      });
    });
  });
  it('can open and delete all documents', () => {
    const person = mockUserEmployments.data[0];

    person.employments.forEach((employment) => {
      const documentsForEmployment: IDocument[] = mockDocuments.data.documents.filter((doc) => {
        const empId = doc.metadataList?.find((x) => x.key === 'employmentId')?.value || '';
        return empId === `${employment.employmentId}`;
      });

      cy.contains(`Dokument (${documentsForEmployment.length})`).should('exist');

      documentsForEmployment.forEach((doc) => {
        const fileName = doc.documentData?.[0].fileName || '';

        cy.contains(fileName)
          .should('be.visible')
          .parents('li')
          .within(() => {
            cy.get(`[aria-haspopup="dialog"]`).should('exist').click();
          });

        cy.get(`[data-cy="document-open-${doc.id}"]`).should('be.visible').click();

        cy.wait('@getDocument');

        cy.contains(fileName)
          .should('be.visible')
          .parents('li')
          .within(() => {
            cy.get(`[aria-haspopup="dialog"]`).click();
          });

        cy.get(`[data-cy="document-delete-${doc.id}"]`).should('be.visible').click();

        cy.contains('Ja').click();

        cy.wait('@deleteDocument');
      });
    });
  });

  it('shows error for wrong file type and too big file', () => {
    cy.get('[data-cy="upload-document"]').first().click();
    cy.get('[data-cy="attachment-add-file-button"]').should('be.visible');
    cy.get('input[type="file"]').selectFile('cypress/e2e/files/sample_5184_3456.jpeg', { force: true });
    cy.contains('Fel filtyp').should('be.visible');
    cy.contains('Filen är för stor').should('be.visible');
  });

  it('uploads valid pdf', () => {
    cy.get('[data-cy="upload-document"]').first().click();
    cy.get('[data-cy="attachment-add-file-button"]').should('be.visible');
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 test'),
        fileName: 'anstallningsavtal.pdf',
        mimeType: 'application/pdf',
        lastModified: Date.now(),
      },
      { force: true }
    );

    cy.get('select').select(mockTypes.data[0].type);
    cy.get('[data-cy="upload-button"]').should('not.be.disabled').click();
    cy.wait('@uploadDocument');
    cy.wait('@getDocuments');
    cy.contains('Dokumentet laddades upp').should('be.visible');
  });
});
