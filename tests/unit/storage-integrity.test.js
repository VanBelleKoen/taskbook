'use strict';

const { createTestTaskbook } = require('../helpers/testUtils');

describe('Taskbook - Storage and Data Integrity', () => {
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

  describe('Data persistence', () => {
    test('should save data after creating a task', () => {
      taskbook.createTask(['Test', 'task']);

      expect(storage.set).toHaveBeenCalledTimes(1);
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            _id: 1,
            description: 'Test task'
          })
        })
      );
    });

    test('should save data after creating a note', () => {
      taskbook.createNote(['Test', 'note']);

      expect(storage.set).toHaveBeenCalledTimes(1);
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            _id: 1,
            description: 'Test note'
          })
        })
      );
    });

    test('should save data after moving items', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'work']);

      expect(storage.set).toHaveBeenCalledTimes(1);
    });

    test('should save data after checking tasks', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['My Board'], _isTask: true, isComplete: false }
      };
      storage.get.mockReturnValue(testData);

      taskbook.checkTasks(['1']);

      expect(storage.set).toHaveBeenCalledTimes(1);
    });

    test('should save data after starring items', () => {
      const testData = {
        1: { _id: 1, description: 'Task', boards: ['My Board'], isStarred: false }
      };
      storage.get.mockReturnValue(testData);

      taskbook.starItems(['1']);

      expect(storage.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('Archive operations', () => {
    test('should archive items when deleting', () => {
      const testData = {
        1: { _id: 1, description: 'Task to delete', boards: ['My Board'] },
        2: { _id: 2, description: 'Task to keep', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.deleteItems(['1']);

      expect(storage.setArchive).toHaveBeenCalledTimes(1);
      expect(storage.set).toHaveBeenCalledWith({
        2: { _id: 2, description: 'Task to keep', boards: ['My Board'] }
      });
    });

    test('should restore items from archive', () => {
      const testArchive = {
        1: { _id: 1, description: 'Archived task', boards: ['My Board'] }
      };
      storage.getArchive.mockReturnValue(testArchive);
      storage.get.mockReturnValue({});

      taskbook.restoreItems(['1']);

      expect(storage.set).toHaveBeenCalledTimes(1);
      expect(storage.setArchive).toHaveBeenCalledTimes(1);
    });

    test('should clear completed tasks', () => {
      const testData = {
        1: { _id: 1, description: 'Completed task', boards: ['My Board'], isComplete: true },
        2: { _id: 2, description: 'Incomplete task', boards: ['My Board'], isComplete: false }
      };
      storage.get.mockReturnValue(testData);

      taskbook.clear();

      // Should archive the completed task
      expect(storage.setArchive).toHaveBeenCalled();
      // Should save data with only incomplete task
      expect(storage.set).toHaveBeenCalledWith({
        2: { _id: 2, description: 'Incomplete task', boards: ['My Board'], isComplete: false }
      });
    });

    test('should handle clearing when no completed tasks exist', () => {
      const testData = {
        1: { _id: 1, description: 'Incomplete task', boards: ['My Board'], isComplete: false }
      };
      storage.get.mockReturnValue(testData);

      taskbook.clear();

      // Should not call any storage methods since no items to clear
      expect(storage.setArchive).not.toHaveBeenCalled();
      expect(storage.set).not.toHaveBeenCalled();
    });
  });

  describe('ID generation and management', () => {
    test('should generate sequential IDs', () => {
      // First task
      taskbook.createTask(['First', 'task']);
      expect(storage.set).toHaveBeenLastCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({ _id: 1 })
        })
      );

      // Mock existing data for second task
      storage.get.mockReturnValue({
        1: { _id: 1, description: 'First task', boards: ['My Board'] }
      });

      // Second task
      taskbook.createTask(['Second', 'task']);
      expect(storage.set).toHaveBeenLastCalledWith(
        expect.objectContaining({
          1: { _id: 1, description: 'First task', boards: ['My Board'] },
          2: expect.objectContaining({ _id: 2 })
        })
      );
    });

    test('should handle empty storage', () => {
      storage.get.mockReturnValue({});

      taskbook.createTask(['First', 'task']);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({ _id: 1 })
        })
      );
    });

    test('should generate IDs correctly with gaps', () => {
      // Mock data with gaps in IDs
      const testData = {
        1: { _id: 1, description: 'Task 1', boards: ['My Board'] },
        5: { _id: 5, description: 'Task 5', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.createTask(['New', 'task']);

      // Should generate ID 6 (max + 1)
      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: { _id: 1, description: 'Task 1', boards: ['My Board'] },
          5: { _id: 5, description: 'Task 5', boards: ['My Board'] },
          6: expect.objectContaining({ _id: 6 })
        })
      );
    });
  });

  describe('Data consistency', () => {
    test('should preserve existing data when adding new items', () => {
      const existingData = {
        1: { _id: 1, description: 'Existing task', boards: ['@work'], isComplete: true },
        2: { _id: 2, description: 'Another task', boards: ['@personal'], isStarred: true }
      };
      storage.get.mockReturnValue(existingData);

      taskbook.createTask(['New', 'task']);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: { _id: 1, description: 'Existing task', boards: ['@work'], isComplete: true },
          2: { _id: 2, description: 'Another task', boards: ['@personal'], isStarred: true },
          3: expect.objectContaining({
            _id: 3,
            description: 'New task'
          })
        })
      );
    });

    test('should preserve item properties when updating', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Important task',
          boards: ['@work'],
          _isTask: true,
          isComplete: false,
          isStarred: true,
          priority: '3',
          _date: 'Wed Sep 17 2025',
          _timestamp: 1234567890
        }
      };
      storage.get.mockReturnValue(testData);

      taskbook.checkTasks(['1']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          _id: 1,
          description: 'Important task',
          boards: ['@work'],
          _isTask: true,
          isComplete: true,  // This should change
          isStarred: true,   // This should remain
          priority: '3',     // This should remain
          _date: 'Wed Sep 17 2025',
          _timestamp: 1234567890,
          inProgress: false  // This should be set to false when completed
        })
      });
    });

    test('should handle board changes correctly', () => {
      const testData = {
        1: {
          _id: 1,
          description: 'Task with properties',
          boards: ['@old-board'],
          isComplete: true,
          isStarred: true
        }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'new-board']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          _id: 1,
          description: 'Task with properties',
          boards: ['@new-board'],  // This should change
          isComplete: true,        // This should remain
          isStarred: true         // This should remain
        })
      });
    });
  });

  describe('Data validation', () => {
    test('should identify when storage data is malformed', () => {
      // Mock corrupted/empty storage
      storage.get.mockReturnValue(null);

      // The original code doesn't handle null data gracefully - this is a known limitation
      expect(() => {
        taskbook.displayByBoard();
      }).toThrow('Cannot convert undefined or null to object');
    });

    test('should identify missing properties in items', () => {
      const incompleteData = {
        1: { _id: 1, description: 'Incomplete item' }  // Missing boards, isComplete, etc.
      };
      storage.get.mockReturnValue(incompleteData);

      // The original code doesn't handle missing boards property gracefully
      expect(() => {
        taskbook.displayByBoard();
      }).toThrow();
    });

    test('should work with well-formed empty data', () => {
      storage.get.mockReturnValue({});

      expect(() => {
        taskbook.displayByBoard();
      }).not.toThrow();
    });
  });

  describe('Concurrent operations simulation', () => {
    test('should handle multiple rapid operations', () => {
      let callCount = 0;
      storage.get.mockImplementation(() => {
        callCount++;
        return {
          1: { _id: 1, description: `Task ${callCount}`, boards: ['My Board'] }
        };
      });

      // Simulate rapid operations
      taskbook.checkTasks(['1']);
      taskbook.starItems(['1']);
      taskbook.beginTasks(['1']);

      // Should call storage.set for each operation
      expect(storage.set).toHaveBeenCalledTimes(3);
    });
  });
});