import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  env: {
    userEmail: 'my.testsson@example.com',
    userPassword: 'password',
    apiUrl: 'http://localhost:3001',
    // The value below is a test person number from Skatteverket, it is not a real person number
    mockPersonNumber: '199001012385',
    // The value below is an invalid test person number for testing validation, it is not a real person number
    mockInvalidPersonNumber: '199001012386',
  },
  e2e: {
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  viewportWidth: 1440,
  viewportHeight: 1024,
});
