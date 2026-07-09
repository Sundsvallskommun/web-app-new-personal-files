import { mockCompanies, mockEmployee, mockFormOfEmployments } from 'cypress/fixtures/mockEmployee';
import { mockUserEmployments } from '../fixtures/mockMe';
import { mockDocuments, mockTypes } from '../fixtures/mockDocuments';
import { mockManagerEmployees, mockMeAsManager, mockMeAsManagerByLoginName } from '../fixtures/mockMeAsManager';

describe('Handling personal files as manager', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/me', mockMeAsManager).as('getMe');
    cy.intercept('GET', `**/getEmployeeByLoginName/${mockMeAsManager.data.username}`, mockMeAsManagerByLoginName).as(
      'getEmployeeByLoginName'
    );
    cy.intercept('GET', '**/getemployments/employeeEmployments', mockUserEmployments).as('getUserEmployments');
    cy.intercept('GET', '**/user/avatar?width=44', {
      statusCode: 200,
      body: '',
    }).as('getAvatar');

    cy.intercept('GET', '**/api/getmanageremployees/**', mockManagerEmployees);
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
    cy.visit('http://localhost:3000/mina-medarbetare');
  });

  it('can view managed employees', () => {
    cy.get('[data-cy="managed-employees-table"]').should('exist');
    const columns = ['fullName', 'birthdate', 'title'];
    columns.forEach((c, index) => {
      let value: string | number = '';
      if (c === columns[0]) value = `${mockManagerEmployees.data.data[index].fullName}`;
      if (c === columns[1]) value = `${mockManagerEmployees.data.data[index].birthdate}`;
      if (c === columns[2])
        value = `${mockManagerEmployees.data.data[index].employments?.find((x) => x.isMainEmployment)?.title}`;

      cy.get(`[data-cy="t-column-${c}"]`).contains(value).should('exist');
    });

    cy.get('[data-cy="show-managed-employee-personal-file-button"]').contains('Visa personakt').should('exist');
  });

  it('can view a managed employee', () => {
    cy.intercept('GET', '**/api/getemployments/aaaaaaaa-2913-4b21-9d2a-49357e1169d3/employeeEmployments', mockEmployee);

    cy.get('[data-cy="managed-employees-table"]').should('exist');
    cy.get('[data-cy="show-managed-employee-personal-file-button"]')
      .contains('Visa personakt')
      .should('exist')
      .first()
      .click();

    cy.get('[data-cy="managed-employments-back-link"]').should('exist');
    cy.get('h1').should('have.text', `${mockEmployee.data[0].givenname} ${mockEmployee.data[0].lastname}`);
  });
});
