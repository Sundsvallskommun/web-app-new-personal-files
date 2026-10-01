/// <reference types="cypress" />

import { mockEmployee } from '../fixtures/mockEmployee';
import { mockMe, mockEmployeeByLoginName, mockUserEmployments } from '../fixtures/mockMe';

describe('Search personal file', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/me', mockMe);

    cy.intercept('GET', `**/getEmployeeByLoginName/${mockMe.data.username}`, mockEmployeeByLoginName);
    cy.intercept('GET', `**/getemployments/**/employeeEmployments`, mockUserEmployments);

    cy.intercept('GET', '**/user/avatar?width=44', {
      statusCode: 200,
      body: '',
    });

    cy.visit('http://localhost:3000/sok-personakt');
  });

  it('Displays the searchField and searches personal file', () => {
    cy.intercept('GET', `**getEmployeeByLoginName/${mockEmployee.data[0].accounts[0].loginname}`, mockEmployee).as(
      'getLogin'
    );
    cy.intercept('GET', `**/portalpersondata/personal/**`, mockEmployee);
    cy.intercept('GET', `**/portalpersondata/198104197838/guid`, mockEmployee);
    cy.intercept('GET', `**/getemployments/**/employeeEmployments`, mockEmployee);

    cy.get('[data-cy="searchfield-personalfiles"][placeholder="Skriv personnummer"]').should('exist');
    cy.get('[data-cy="searchfield-personalfiles"][placeholder="Skriv personnummer"]').type('198104197838');
    cy.get('button.sk-search-field-button-reset').should('exist');
    cy.get('button.sk-search-field-button-search').contains('Sök').should('exist').click();

    cy.get('[data-cy="personalfile-result-table"]').should('exist');

    const columns = ['name', 'personnumber', 'numberofemployments'];
    columns.forEach((c) => {
      let value: string | number;
      if (c === columns[0]) value = `${mockEmployee.data[0].givenname} ${mockEmployee.data[0].lastname}`;
      if (c === columns[1]) value = `${mockEmployee.data[0].personNumber}`;
      if (c === columns[2]) value = `${mockEmployee.data[0].employments?.find((x) => x.isMainEmployment)?.title}`;

      cy.get(`[data-cy="pf-${c}"]`).contains(value).should('exist');
    });
    cy.get(`[data-cy="pf-openbutton"] button`).contains('Öppna personakt').should('exist');
  });

  it('Displays info message when typing wrong or too short search value for person number', () => {
    cy.get('[data-cy="searchfield-personalfiles"][placeholder="Skriv personnummer"]').type('ABCD');
    cy.get('div.sk-form-error-message')
      .should('exist')
      .contains('Personnumret måste innehålla siffror och efterlikna följande struktur: ååååmmddnnnn');
  });

  it('Returns error message if no personal file', () => {
    cy.intercept('GET', '**/portalpersondata/199902025678/guid', {
      statusCode: 404,
      body: {
        data: null,
        message: 'not found',
      },
    }).as('getGuidNotFound');

    cy.intercept('GET', '**/portalpersondata/personal/**', {
      statusCode: 404,
      body: {
        data: null,
        message: 'not found',
      },
    }).as('getPersonalNotFound');

    cy.intercept('GET', '**/getEmployeeByLoginName/**', {
      statusCode: 404,
      body: {
        data: null,
        message: 'not found',
      },
    }).as('getEmployeeNotFound');

    cy.intercept('GET', '**/getemployments/**/employeeEmployments', {
      statusCode: 200,
      body: {
        data: [],
        message: 'success',
      },
    }).as('getEmploymentsEmpty');

    cy.get('[data-cy="searchfield-personalfiles"][placeholder="Skriv personnummer"]').clear().type('19990202-5678');

    cy.get('button.sk-search-field-button-search').contains('Sök').should('exist').click();

    cy.get('.sk-snackbar-error .sk-snackbar-content span').should(
      'contain',
      'Det gick inte att hitta någon personakt under det här personnumret'
    );

    cy.get('[data-cy="personalfile-result-table"]').should('not.exist');

    cy.get('button.sk-search-field-button-reset').should('exist').click();
  });
});
