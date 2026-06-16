import { defineConfig } from 'cypress';

export default defineConfig({
  env: {
    userEmail: 'my.testsson@example.com',
    userPassword: 'password',
    apiUrl: 'http://localhost:3001',
  },

  e2e: {
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
