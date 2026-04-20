import '@cypress/code-coverage/support';
import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command';

import { getMe } from '../fixtures/getMe';

localStorage.clear();

beforeEach(() => {
  cy.intercept('GET', '**/api/me', getMe).as('getMe');
});

addMatchImageSnapshotCommand({
  failureThreshold: 0.05,
  failureThresholdType: 'percent',
  capture: 'viewport',
  comparisonMethod: 'ssim',
});
