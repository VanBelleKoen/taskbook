'use strict';

const path = require('path');
const os = require('os');

/**
 * Creates a mock storage with predef  // Mock the Storage class
  jest.doMock('../../src/storage', () => {
    return jest.fn().mockImplementation(() => storage);
  });
  
  // Mock the render module to prevent actual output during tests
  jest.doMock('../../src/render', () => ({ta for testing
 * @param {Object} initialData - Initial data to populate storage with
 * @returns {Object} Mock storage instance
 */
function createMockStorage(initialData = {}) {
  let data = { ...initialData };
  let archive = {};

  return {
    get: jest.fn(() => data),
    set: jest.fn((newData) => {
      data = { ...newData };
    }),
    getArchive: jest.fn(() => archive),
    setArchive: jest.fn((newArchive) => {
      archive = { ...newArchive };
    })
  };
}

/**
 * Creates sample task data for testing
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Task object
 */
function createSampleTask(overrides = {}) {
  const defaults = {
    _id: 1,
    _date: new Date().toDateString(),
    _timestamp: Date.now(),
    description: 'Sample task',
    isStarred: false,
    isComplete: false,
    inProgress: false,
    priority: 1,
    boards: ['My Board'],
    _isTask: true
  };

  return { ...defaults, ...overrides };
}

/**
 * Creates sample note data for testing
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Note object
 */
function createSampleNote(overrides = {}) {
  const defaults = {
    _id: 2,
    _date: new Date().toDateString(),
    _timestamp: Date.now(),
    description: 'Sample note',
    isStarred: false,
    boards: ['My Board'],
    _isTask: false
  };

  return { ...defaults, ...overrides };
}

/**
 * Creates a sample dataset with multiple items for testing
 * @returns {Object} Data object with multiple items
 */
function createSampleDataset() {
  return {
    1: createSampleTask({
      _id: 1,
      description: 'Task in My Board',
      boards: ['My Board']
    }),
    2: createSampleTask({
      _id: 2,
      description: 'Task in work board',
      boards: ['@work']
    }),
    3: createSampleTask({
      _id: 3,
      description: 'Task in multiple boards',
      boards: ['@work', '@urgent', 'My Board']
    }),
    4: createSampleNote({
      _id: 4,
      description: 'Note in personal board',
      boards: ['@personal']
    }),
    5: createSampleTask({
      _id: 5,
      description: 'Completed task',
      boards: ['@work'],
      isComplete: true
    })
  };
}

/**
 * Creates a test instance of Taskbook with mocked dependencies
 * @param {Object} mockStorage - Optional mock storage instance
 * @returns {Object} Taskbook instance with mocked storage
 */
function createTestTaskbook(mockStorage = null) {
  // Clear the module cache to get a fresh instance
  jest.resetModules();

  const storage = mockStorage || createMockStorage();

  // Mock the Storage class
  jest.doMock('../../src/storage', () => {
    return jest.fn().mockImplementation(() => storage);
  });

  // Mock render to prevent output during tests
  jest.doMock('../../src/render', () => ({
    missingID: jest.fn(),
    invalidID: jest.fn(),
    missingBoards: jest.fn(),
    missingDesc: jest.fn(),
    invalidBoardName: jest.fn(),
    cannotDeleteDefaultBoard: jest.fn(),
    boardNotFound: jest.fn(),
    successCreate: jest.fn(),
    successDelete: jest.fn(),
    successDeleteBoard: jest.fn(),
    successMove: jest.fn(),
    successRestore: jest.fn(),
    displayByBoard: jest.fn(),
    displayByDate: jest.fn(),
    displayStats: jest.fn(),
    markComplete: jest.fn(),
    markIncomplete: jest.fn(),
    markStarted: jest.fn(),
    markPaused: jest.fn(),
    markStarred: jest.fn(),
    markUnstarred: jest.fn()
  }));

  const Taskbook = require('../../src/taskbook');

  // Reset the storage mock to ensure clean state
  storage.get.mockClear();
  storage.set.mockClear();
  storage.getArchive.mockClear();
  storage.setArchive.mockClear();

  return {
    taskbook: Taskbook,
    storage,
    render: require('../../src/render')
  };
}

/**
 * Restores all mocks to their original state
 */
function restoreMocks() {
  jest.restoreAllMocks();
  jest.resetModules();
}

module.exports = {
  createMockStorage,
  createSampleTask,
  createSampleNote,
  createSampleDataset,
  createTestTaskbook,
  restoreMocks
};