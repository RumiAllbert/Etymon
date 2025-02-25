// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/components/*.test.tsx for DOM testing
import '@testing-library/jest-dom';

// Mock global fetch
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
}); 