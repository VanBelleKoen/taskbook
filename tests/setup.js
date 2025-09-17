'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Global test setup
global.console = {
  ...global.console,
  // Suppress console.log during tests but allow console.error
  log: jest.fn(),
  warn: jest.fn(),
  error: console.error
};

// Prevent process.exit during tests
const originalExit = process.exit;
beforeAll(() => {
  process.exit = jest.fn();
});

afterAll(() => {
  process.exit = originalExit;
});

// Clean up test directories after each test
afterEach(() => {
  // Clean up any test storage directories
  const testDirs = [
    path.join(os.tmpdir(), '.taskbook-test'),
    path.join(os.tmpdir(), '.taskbook-test-*')
  ];

  testDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Helper to create isolated test environment
global.createTestEnvironment = () => {
  const testDir = path.join(os.tmpdir(), `.taskbook-test-${Date.now()}-${Math.random()}`);

  // Mock config to use test directory
  jest.doMock('../src/config', () => ({
    get: () => ({
      taskbookDirectory: testDir,
      displayCompleteTasks: true,
      displayProgressOverview: true
    })
  }));

  return testDir;
};