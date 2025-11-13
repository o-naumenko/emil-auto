// @ts-check
/**
 * Playwright config for API testing against the local server.
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  // Start the API server before tests
  // webServer: {
  //   command: 'node app.js',
  //   url: process.env.BASE_URL || 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30_000,
  // },
});
