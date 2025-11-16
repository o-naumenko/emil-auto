/**
 * Centralized test configuration to avoid magic values throughout the test suite
 */
export const TEST_CONFIG = {
  /**
   * Timeout configurations
   */
  timeouts: {
    apiCall: 10_000,
    testCase: 30_000,
  },

  /**
   * API configuration
   */
  api: {
    retryAttempts: 1,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },

  /**
   * Default test data values
   */
  testData: {
    defaultClaimant: 'Test User',
    defaultDescription: 'Integration test loss',
    defaultDate: '2025-11-01',
  },

  /**
   * Expected error messages (for flexible matching)
   */
  errorMessages: {
    requiredFields: /required|missing/i,
    invalidTransition: /invalid.*transition|cannot.*transition/i,
    notFound: /not found|does not exist/i,
  },
} as const;
