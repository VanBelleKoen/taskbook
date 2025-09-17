'use strict';

const {
  createMockStorage,
  createSampleDataset,
  createTestTaskbook,
  restoreMocks
} = require('../helpers/testUtils');

describe('Taskbook - Board Operations', () => {
  let taskbook, storage, render;

  beforeEach(() => {
    const testInstance = createTestTaskbook();
    taskbook = testInstance.taskbook;
    storage = testInstance.storage;
    render = testInstance.render;
  });

  afterEach(() => {
    restoreMocks();
  });

  describe('_getBoards()', () => {
    test('should return default board when no items exist', () => {
      storage.get.mockReturnValue({});

      const boards = taskbook._getBoards();

      expect(boards).toEqual(['My Board']);
    });

    test('should return all unique boards from items', () => {
      const sampleData = createSampleDataset();
      storage.get.mockReturnValue(sampleData);

      const boards = taskbook._getBoards();

      expect(boards).toContain('My Board');
      expect(boards).toContain('@work');
      expect(boards).toContain('@urgent');
      expect(boards).toContain('@personal');
      expect(boards.length).toBe(4);
    });

    test('should not return duplicate boards', () => {
      const data = {
        1: { boards: ['@work', 'My Board'] },
        2: { boards: ['@work', '@personal'] },
        3: { boards: ['@work'] }
      };
      storage.get.mockReturnValue(data);

      const boards = taskbook._getBoards();

      const workBoards = boards.filter(board => board === '@work');
      expect(workBoards.length).toBe(1);
    });

    test('should handle items with empty board arrays', () => {
      const data = {
        1: { boards: [] },
        2: { boards: ['@work'] }
      };
      storage.get.mockReturnValue(data);

      const boards = taskbook._getBoards();

      expect(boards).toContain('My Board');
      expect(boards).toContain('@work');
    });
  });

  describe('_groupByBoard()', () => {
    test('should group items by their boards correctly', () => {
      const sampleData = createSampleDataset();
      storage.get.mockReturnValue(sampleData);

      const grouped = taskbook._groupByBoard();

      expect(grouped['My Board']).toBeDefined();
      expect(grouped['@work']).toBeDefined();
      expect(grouped['@personal']).toBeDefined();
      expect(grouped['@urgent']).toBeDefined();

      // Check specific item placement
      expect(grouped['@work']).toContain(sampleData[2]);
      expect(grouped['@work']).toContain(sampleData[3]);
      expect(grouped['@work']).toContain(sampleData[5]);
    });

    test('should handle items belonging to multiple boards', () => {
      const data = {
        1: {
          _id: 1,
          description: 'Multi-board task',
          boards: ['@work', '@urgent']
        }
      };
      storage.get.mockReturnValue(data);

      const grouped = taskbook._groupByBoard();

      expect(grouped['@work']).toContain(data[1]);
      expect(grouped['@urgent']).toContain(data[1]);
    });

    test('should return empty object when no items exist', () => {
      storage.get.mockReturnValue({});

      const grouped = taskbook._groupByBoard();

      expect(grouped).toEqual({});
    });

    test('should filter by specific boards when provided', () => {
      const sampleData = createSampleDataset();
      storage.get.mockReturnValue(sampleData);

      const grouped = taskbook._groupByBoard(sampleData, ['@work']);

      expect(grouped['@work']).toBeDefined();
      expect(grouped['My Board']).toBeUndefined();
      expect(grouped['@personal']).toBeUndefined();
    });
  });

  describe('Board creation through items', () => {
    test('should create boards automatically when creating tasks', () => {
      storage.get.mockReturnValue({});

      // This should create a new board @newproject
      taskbook.createTask(['@newproject', 'Create', 'new', 'feature']);

      // Verify the task was created with the correct board
      const saveCall = storage.set.mock.calls[0][0];
      const createdTask = Object.values(saveCall)[0];

      expect(createdTask.boards).toContain('@newproject');
    });

    test('should handle multiple boards in task creation', () => {
      storage.get.mockReturnValue({});

      taskbook.createTask(['@work', '@urgent', 'Fix', 'critical', 'bug']);

      const saveCall = storage.set.mock.calls[0][0];
      const createdTask = Object.values(saveCall)[0];

      expect(createdTask.boards).toContain('@work');
      expect(createdTask.boards).toContain('@urgent');
    });

    test('should assign to My Board when no boards specified', () => {
      storage.get.mockReturnValue({});

      taskbook.createTask(['Simple', 'task', 'without', 'board']);

      const saveCall = storage.set.mock.calls[0][0];
      const createdTask = Object.values(saveCall)[0];

      expect(createdTask.boards).toEqual(['My Board']);
    });
  });

  describe('Board validation', () => {
    test('should handle board names with special characters', () => {
      const data = {
        1: { boards: ['@work-project', '@team:alpha', '@v2.0'] }
      };
      storage.get.mockReturnValue(data);

      const boards = taskbook._getBoards();

      expect(boards).toContain('@work-project');
      expect(boards).toContain('@team:alpha');
      expect(boards).toContain('@v2.0');
    });

    test('should preserve board name case sensitivity', () => {
      const data = {
        1: { boards: ['@Work', '@URGENT', '@personal'] }
      };
      storage.get.mockReturnValue(data);

      const boards = taskbook._getBoards();

      expect(boards).toContain('@Work');
      expect(boards).toContain('@URGENT');
      expect(boards).toContain('@personal');
      expect(boards).not.toContain('@work');
    });
  });
});