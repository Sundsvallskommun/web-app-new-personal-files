/// <reference types="cypress" />

import { mockTypes } from 'cypress/fixtures/mockDocuments';
import {
  mockMe,
  mockEmployeeByLoginName,
  mockUser,
  mockSuperUser,
  mockAdmin,
  mockUserEmployments,
} from '../fixtures/mockMe';

import { mockCompanies, mockFormOfEmployments } from 'cypress/fixtures/mockEmployee';

type SidebarMenuExpected = {
  searchPersonalFile: boolean;
  myPersonalFile: boolean;
  myEmployees: boolean;
};

const mockBaseRequests = (userMock: typeof mockMe, userAlias = 'getMe') => {
  cy.intercept('GET', '**/me', userMock).as(userAlias);

  cy.intercept('GET', `**/getEmployeeByLoginName/${userMock.data.username}`, mockEmployeeByLoginName).as(
    'getEmpByLoginName'
  );
  cy.intercept('GET', '**/document/types', mockTypes).as('getDocumentTypes');

  cy.intercept('GET', '**/getemployments/employeeEmployments', mockUserEmployments).as('getUserEmployments');
  cy.intercept('GET', '**/user/avatar?width=44', {
    statusCode: 200,
    body: '',
  }).as('getAvatar');
};

const waitForBaseRequests = (userAlias = 'getMe') => {
  cy.wait(`@${userAlias}`);
  cy.wait('@getEmpByLoginName');
  cy.wait('@getUserEmployments');
};

const assertSidebarMenu = (expected: SidebarMenuExpected) => {
  cy.get('[data-cy="sidebar-menu-sok-personakt"]').should(expected.searchPersonalFile ? 'be.visible' : 'not.exist');

  cy.get('[data-cy="sidebar-menu-min-personakt"]').should(expected.myPersonalFile ? 'be.visible' : 'not.exist');

  cy.get('[data-cy="sidebar-menu-mina-medarbetare"]').should(expected.myEmployees ? 'be.visible' : 'not.exist');
};

describe('Overview sidebar', () => {
  it('shows user information and sidebar menu based on super admin role', () => {
    mockBaseRequests(mockMe);

    cy.visit('http://localhost:3000/sok-personakt');

    waitForBaseRequests();

    cy.get('[data-cy="overview-aside"]').should('be.visible');

    cy.get('[data-cy="usertitle"]').should('contain', mockMe.data.name);
    cy.get('[data-cy="userwork"]').should('contain', mockMe.data.workTitle);

    assertSidebarMenu({
      searchPersonalFile: true,
      myPersonalFile: true,
      myEmployees: false,
    });
  });

  const roleCases = [
    {
      title: 'user role',
      userMock: mockUser,
      path: '/min-personakt',
      needsEmploymentMeta: true,
      expected: {
        searchPersonalFile: false,
        myPersonalFile: true,
        myEmployees: false,
      },
    },
    {
      title: 'superuser role',
      userMock: mockSuperUser,
      path: '/sok-personakt',
      expected: {
        searchPersonalFile: true,
        myPersonalFile: true,
        myEmployees: false,
      },
    },
    {
      title: 'admin role',
      userMock: mockAdmin,
      path: '/mina-medarbetare',
      expected: {
        searchPersonalFile: false,
        myPersonalFile: true,
        myEmployees: true,
      },
    },
  ];

  roleCases.forEach(({ title, userMock, path, expected, needsEmploymentMeta }) => {
    it(`shows sidebar menu based on ${title}`, () => {
      mockBaseRequests(userMock);

      if (needsEmploymentMeta) {
        cy.intercept('GET', '**/companies', mockCompanies).as('getCompanies');
        cy.intercept('GET', '**/formofemployments', mockFormOfEmployments).as('getFormOfEmployments');
      }

      cy.visit(`http://localhost:3000${path}`);

      waitForBaseRequests();

      if (needsEmploymentMeta) {
        cy.wait('@getCompanies');
        cy.wait('@getFormOfEmployments');
      }

      assertSidebarMenu(expected);
    });
  });
});
