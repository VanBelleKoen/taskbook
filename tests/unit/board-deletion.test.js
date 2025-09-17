'use strict';

const { createTestTaskbook } = require('../helpers/testUtils');

describe('Taskbook - Board Deletion', () => {
  let taskbook, storage, render;

  beforeEach(() => {
    const testSetup = createTestTaskbook();
    taskbook = testSetup.taskbook;
    storage = testSetup.storage;
    render = testSetup.render;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Basic board deletion', () => {
    test('should delete board and reassign items to default board', () => {
      const testData = {
        1: { _id: 1, description: 'Task 1', boards: ['@work'] },
        2: { _id: 2, description: 'Task 2', boards: ['@work'] },
        3: { _id: 3, description: 'Task 3', boards: ['@personal'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work');

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({ boards: ['My Board'] }),
        2: expect.objectContaining({ boards: ['My Board'] }),
        3: expect.objectContaining({ boards: ['@personal'] })
      });

      expect(result.stats).toEqual({
        itemsReassigned: 0,
        itemsMovedToDefault: 2,
        totalItemsProcessed: 2
      });

      expect(render.successDeleteBoard).toHaveBeenCalledWith('@work', result.stats);
    });

    test('should delete board and keep items in other boards', () => {
      const testData = {
        1: { _id: 1, description: 'Multi-board task', boards: ['@work', '@urgent'] },
        2: { _id: 2, description: 'Work only task', boards: ['@work'] },
        3: { _id: 3, description: 'Unrelated task', boards: ['@personal'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work');

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({ boards: ['@urgent'] }),
        2: expect.objectContaining({ boards: ['My Board'] }),
        3: expect.objectContaining({ boards: ['@personal'] })
      });

      expect(result.stats).toEqual({
        itemsReassigned: 1,
        itemsMovedToDefault: 1,
        totalItemsProcessed: 2
      });
    });

    test('should return detailed information about affected items', () => {
      const testData = {
        1: { _id: 1, description: 'Task to modify', boards: ['@work', '@urgent'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work');

      expect(result.affected).toEqual([
        {
          id: 1,
          description: 'Task to modify',
          originalBoards: ['@work', '@urgent'],
          newBoards: ['@urgent'],
          action: 'reassigned'
        }
      ]);
    });
  });

  describe('Input validation', () => {
    test('should reject invalid board names', () => {
      taskbook.deleteBoard('');

      expect(render.invalidBoardName).toHaveBeenCalled();
      // process.exit(1) is mocked, so function continues
    });

    test('should reject null/undefined board names', () => {
      taskbook.deleteBoard(null);

      expect(render.invalidBoardName).toHaveBeenCalled();
    });

    test('should reject non-string board names', () => {
      taskbook.deleteBoard(123);

      expect(render.invalidBoardName).toHaveBeenCalled();
    });

    test('should prevent deletion of default board without force', () => {
      taskbook.deleteBoard('My Board');

      expect(render.cannotDeleteDefaultBoard).toHaveBeenCalled();
    });

    test('should allow deletion of default board with force option', () => {
      const testData = {
        1: { _id: 1, description: 'Default board task', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('My Board', { force: true });

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({ boards: ['My Board'] }) // Still goes to default
      });

      expect(result.stats.totalItemsProcessed).toBe(1);
    });

    test('should check if board exists', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['@existing'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.deleteBoard('@nonexistent');

      expect(render.boardNotFound).toHaveBeenCalledWith('@nonexistent');
    });
  });

  describe('Dry run functionality', () => {
    test('should preview changes without modifying data', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['@work'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work', { dryRun: true });

      expect(storage.set).not.toHaveBeenCalled();
      expect(render.successDeleteBoard).not.toHaveBeenCalled();

      expect(result.wouldAffect).toEqual([
        {
          id: 1,
          description: 'Task',
          originalBoards: ['@work'],
          newBoards: ['My Board'],
          action: 'moved_to_default'
        }
      ]);
    });

    test('should provide accurate statistics in dry run', () => {
      const testData = {
        1: { _id: 1, description: 'Multi-board', boards: ['@work', '@urgent'] },
        2: { _id: 2, description: 'Work only', boards: ['@work'] },
        3: { _id: 3, description: 'Unrelated', boards: ['@personal'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work', { dryRun: true });

      expect(result.stats).toEqual({
        itemsReassigned: 1,
        itemsMovedToDefault: 1,
        totalItemsProcessed: 2
      });
    });
  });

  describe('Custom default board', () => {
    test('should use custom default board for orphaned items', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['@work'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.deleteBoard('@work', { defaultBoard: '@archive' });

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({ boards: ['@archive'] })
      });
    });

    test('should handle custom default board in statistics', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['@work'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work', { defaultBoard: '@backup' });

      expect(result.affected[0].action).toBe('moved_to_default');
      expect(result.affected[0].newBoards).toEqual(['@backup']);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty storage gracefully', () => {
      storage.get.mockReturnValue({});

      taskbook.deleteBoard('@nonexistent');

      expect(render.boardNotFound).toHaveBeenCalled();
    });

    test('should handle board with no items', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['@other'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work');

      expect(result.stats.totalItemsProcessed).toBe(0);
      expect(storage.set).not.toHaveBeenCalled();
    });

    test('should handle items with duplicate board references', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['@work', '@work', '@urgent'] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@work');

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({ boards: ['@work', '@urgent'] })
      });

      expect(result.stats.totalItemsProcessed).toBe(1);
    });

    test('should handle very long board names', () => {
      const longBoardName = '@' + 'a'.repeat(100);
      const testData = {
        1: { _id: 1, description: 'Task', boards: [longBoardName] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard(longBoardName);

      expect(result.stats.totalItemsProcessed).toBe(1);
    });

    test('should handle board names with special characters', () => {
      const specialBoard = '@work-project_2023!';
      const testData = {
        1: { _id: 1, description: 'Task', boards: [specialBoard] }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard(specialBoard);

      expect(result.stats.totalItemsProcessed).toBe(1);
    });
  });

  describe('Performance with large datasets', () => {
    test('should handle many items efficiently', () => {
      const manyItems = {};
      const targetBoard = '@work';

      for (let i = 1; i <= 1000; i++) {
        manyItems[i] = {
          _id: i,
          description: `Task ${i}`,
          boards: i % 2 === 0 ? [targetBoard] : ['@other']
        };
      }

      storage.get.mockReturnValue(manyItems);

      const result = taskbook.deleteBoard(targetBoard);

      expect(result.stats.totalItemsProcessed).toBe(500);
      expect(result.stats.itemsMovedToDefault).toBe(500);
    });

    test('should handle items with many boards', () => {
      const manyBoards = [];
      for (let i = 0; i < 50; i++) {
        manyBoards.push(`@board-${i}`);
      }

      const testData = {
        1: { _id: 1, description: 'Multi-board task', boards: manyBoards }
      };
      storage.get.mockReturnValue(testData);

      const result = taskbook.deleteBoard('@board-25');

      expect(result.stats.totalItemsProcessed).toBe(1);
      expect(result.stats.itemsReassigned).toBe(1);
      expect(result.affected[0].newBoards).toHaveLength(49);
    });
  });
});