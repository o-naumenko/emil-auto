// @ts-check
/**
 * Playwright config for API testing against the local server.
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  retries: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
});
