'use strict';

const { createTestTaskbook } = require('../helpers/testUtils');

describe('Taskbook - Edge Cases', () => {
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

  describe('Empty boards', () => {
    test('should handle boards with no items', () => {
      storage.get.mockReturnValue({});

      const boards = taskbook._getBoards();

      expect(boards).toEqual(['My Board']);
    });

    test('should group empty boards correctly', () => {
      storage.get.mockReturnValue({});

      const grouped = taskbook._groupByBoard();

      expect(grouped).toEqual({});
    });

    test('should display empty boards without error', () => {
      storage.get.mockReturnValue({});

      expect(() => {
        taskbook.displayByBoard();
      }).not.toThrow();

      expect(render.displayByBoard).toHaveBeenCalledWith({});
    });
  });

  describe('Items with multiple boards', () => {
    test('should handle items belonging to many boards', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Multi-board task',
          boards: ['My Board', '@work', '@urgent', '@project-a', '@personal']
        }
      };
      storage.get.mockReturnValue(testData);

      const boards = taskbook._getBoards();

      expect(boards).toEqual(['My Board', '@work', '@urgent', '@project-a', '@personal']);
    });

    test('should group items correctly when they belong to multiple boards', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Multi-board task',
          boards: ['My Board', '@work']
        }
      };
      storage.get.mockReturnValue(testData);

      const grouped = taskbook._groupByBoard();

      expect(grouped['My Board']).toContainEqual(testData[1]);
      expect(grouped['@work']).toContainEqual(testData[1]);
    });

    test('should move items with multiple boards correctly', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Multi-board task',
          boards: ['My Board', '@work', '@urgent']
        }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'personal']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          boards: ['@personal']
        })
      });
    });
  });

  describe('Invalid board names', () => {
    test('should handle board names with special characters', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Task with special chars',
          boards: ['@work-project', '@2023-goals', '@client_name']
        }
      };
      storage.get.mockReturnValue(testData);

      const boards = taskbook._getBoards();

      expect(boards).toContain('@work-project');
      expect(boards).toContain('@2023-goals');
      expect(boards).toContain('@client_name');
    });

    test('should handle very long board names', () => {
      const longBoardName = '@' + 'a'.repeat(100);
      const testData = {
        1: {
          _id: 1,
          description: 'Task with long board name',
          boards: [longBoardName]
        }
      };
      storage.get.mockReturnValue(testData);

      const boards = taskbook._getBoards();

      expect(boards).toContain(longBoardName);
    });

    test('should handle empty board names in arrays', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Task with empty board',
          boards: ['', '@work', '']
        }
      };
      storage.get.mockReturnValue(testData);

      const boards = taskbook._getBoards();

      expect(boards).toContain('');
      expect(boards).toContain('@work');
    });

    test('should handle board names with spaces', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Task with spaced boards',
          boards: ['@work project', '@my personal']
        }
      };
      storage.get.mockReturnValue(testData);

      const boards = taskbook._getBoards();

      expect(boards).toContain('@work project');
      expect(boards).toContain('@my personal');
    });
  });

  describe('Invalid IDs', () => {
    test('should handle non-existent IDs gracefully', () => {
      const testData = {
        1: { _id: 1, description: 'Existing task', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      // This should trigger the process.exit in _validateIDs, but we can't test that directly
      // Instead, we test the render call
      expect(() => {
        taskbook.deleteItems(['999']);
      }).toThrow(); // This will throw because of process.exit mock
    });

    test('should handle non-numeric IDs', () => {
      const testData = {
        1: { _id: 1, description: 'Existing task', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      expect(() => {
        taskbook.deleteItems(['abc']);
      }).toThrow();
    });

    test('should handle empty ID arrays', () => {
      // The _validateIDs function is mocked to not exit, so deleteItems continues
      expect(() => {
        taskbook.deleteItems([]);
      }).not.toThrow();

      // Still saves data (even though no items were deleted)
      expect(storage.set).toHaveBeenCalledWith({});
    });

    test('should handle negative IDs', () => {
      const testData = {
        1: { _id: 1, description: 'Existing task', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      expect(() => {
        taskbook.deleteItems(['-1']);
      }).toThrow();
    });
  });

  describe('Duplicate handling', () => {
    test('should remove duplicate IDs in operations', () => {
      const testData = {
        1: { _id: 1, description: 'Task 1', boards: ['My Board'] },
        2: { _id: 2, description: 'Task 2', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.deleteItems(['1', '1', '2', '1']);

      expect(render.successDelete).toHaveBeenCalledWith(['1', '2']);
    });

    test('should remove duplicate board names', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'work', 'work', 'urgent', 'work']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          boards: ['@work', '@urgent']
        })
      });
    });

    test('should handle duplicate boards in item data', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Task with duplicate boards',
          boards: ['@work', '@work', '@urgent', '@work']
        }
      };
      storage.get.mockReturnValue(testData);

      const boards = taskbook._getBoards();

      // _getBoards doesn't deduplicate boards from item data
      // It just adds them all to the final array
      expect(boards.filter(b => b === '@work').length).toBeGreaterThan(1);
    });
  });

  describe('Large datasets', () => {
    test('should handle many items efficiently', () => {
      const manyItems = {};
      for (let i = 1; i <= 1000; i++) {
        manyItems[i] = {
          _id: i,
          description: `Task ${i}`,
          boards: [`@board-${i % 10}`] // 10 different boards
        };
      }
      storage.get.mockReturnValue(manyItems);

      const boards = taskbook._getBoards();

      // Should have My Board + 10 different boards
      expect(boards.length).toBe(11);
    });

    test('should handle large board lists', () => {
      const manyBoards = [];
      for (let i = 0; i < 100; i++) {
        manyBoards.push(`@board-${i}`);
      }

      const testData = {
        1: {
          _id: 1,
          description: 'Task with many boards',
          boards: manyBoards
        }
      };
      storage.get.mockReturnValue(testData);

      expect(() => {
        taskbook.displayByBoard();
      }).not.toThrow();
    });
  });

  describe('Special characters and encoding', () => {
    test('should handle Unicode characters in descriptions', () => {
      taskbook.createTask(['Task', 'with', 'emoji', '🚀', 'and', 'unicode', 'ñáéíóú']);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            description: 'Task with emoji 🚀 and unicode ñáéíóú'
          })
        })
      );
    });

    test('should handle Unicode in board names', () => {
      taskbook.createTask(['@work🏢', '@personal🏠', 'Task', 'with', 'emoji', 'boards']);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            boards: ['@work🏢', '@personal🏠']
          })
        })
      );
    });

    test('should handle very long descriptions', () => {
      const longDescription = Array(1000).fill('word').join(' ');
      taskbook.createTask(longDescription.split(' '));

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            description: longDescription
          })
        })
      );
    });
  });

  describe('Priority edge cases', () => {
    test('should handle invalid priority values', () => {
      taskbook.createTask(['p:5', 'Invalid', 'priority']);

      // Invalid priority values get filtered out, description includes the invalid priority
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            description: 'p:5 Invalid priority',
            priority: 1  // Default priority as number
          })
        })
      );
    });

    test('should handle multiple priority values', () => {
      taskbook.createTask(['p:1', 'p:2', 'p:3', 'Multiple', 'priorities']);

      // Should use the first valid priority found
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            priority: '1'
          })
        })
      );
    });

    test('should handle malformed priority syntax', () => {
      taskbook.createTask(['p:', 'p:a', 'priority:', 'Task', 'with', 'bad', 'priority']);

      // Malformed priorities get included in description
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            description: 'p: p:a priority: Task with bad priority',
            priority: 1 // Default as number
          })
        })
      );
    });
  });

  describe('Empty input handling', () => {
    test('should handle empty task descriptions', () => {
      // The _getOptions method is mocked to not exit, so createTask continues
      expect(() => {
        taskbook.createTask([]);
      }).not.toThrow();

      // Creates a task with empty description
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            description: ''
          })
        })
      );
    });

    test('should handle whitespace-only descriptions', () => {
      taskbook.createTask(['   ', '\t', '\n']);

      // Whitespace characters are preserved as-is
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            description: '    \t \n'
          })
        })
      );
    });

    test('should handle arrays with only board names', () => {
      taskbook.createTask(['@work', '@urgent']);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            description: '',
            boards: ['@work', '@urgent']
          })
        })
      );
    });
  });
});