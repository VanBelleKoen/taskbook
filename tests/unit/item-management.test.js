'use strict';

const { createTestTaskbook } = require('../helpers/testUtils');

describe('Taskbook - Item Management', () => {
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

  describe('createTask()', () => {
    test('should create a task with default board', () => {
      const desc = ['Test', 'task', 'description'];

      taskbook.createTask(desc);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            _id: 1,
            description: 'Test task description',
            boards: ['My Board'],
            _isTask: true,
            isComplete: false,
            inProgress: false
          })
        })
      );
      expect(render.successCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 1,
          _isTask: true
        })
      );
    });

    test('should create a task with specified boards', () => {
      const desc = ['@work', '@urgent', 'Implement', 'new', 'feature'];

      taskbook.createTask(desc);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            _id: 1,
            description: 'Implement new feature',
            boards: ['@work', '@urgent'],
            _isTask: true
          })
        })
      );
    });

    test('should handle priority in task description', () => {
      const desc = ['p:2', 'High', 'priority', 'task'];

      taskbook.createTask(desc);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            _id: 1,
            description: 'High priority task',
            boards: ['My Board'],
            priority: '2'
          })
        })
      );
    });

    test('should create multiple tasks with different boards', () => {
      storage.get.mockReturnValue({
        1: { _id: 1, boards: ['@work'], description: 'First task' }
      });

      taskbook.createTask(['@personal', 'Second', 'task']);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: { _id: 1, boards: ['@work'], description: 'First task' },
          2: expect.objectContaining({
            _id: 2,
            description: 'Second task',
            boards: ['@personal']
          })
        })
      );
    });
  });

  describe('createNote()', () => {
    test('should create a note with default board', () => {
      const desc = ['Test', 'note', 'content'];

      taskbook.createNote(desc);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            _id: 1,
            description: 'Test note content',
            boards: ['My Board'],
            _isTask: false
          })
        })
      );
      expect(render.successCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 1,
          _isTask: false
        })
      );
    });

    test('should create a note with specified boards', () => {
      const desc = ['@research', '@ideas', 'Important', 'observation'];

      taskbook.createNote(desc);

      expect(storage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          1: expect.objectContaining({
            _id: 1,
            description: 'Important observation',
            boards: ['@research', '@ideas']
          })
        })
      );
    });
  });

  describe('deleteItems()', () => {
    test('should delete single item and archive it', () => {
      const testData = {
        1: { _id: 1, description: 'Task to delete', boards: ['My Board'] },
        2: { _id: 2, description: 'Task to keep', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.deleteItems(['1']);

      // Should save data without the deleted item
      expect(storage.set).toHaveBeenCalledWith({
        2: { _id: 2, description: 'Task to keep', boards: ['My Board'] }
      });

      // Should archive the deleted item
      expect(storage.setArchive).toHaveBeenCalled();
      expect(render.successDelete).toHaveBeenCalledWith(['1']);
    });

    test('should delete multiple items', () => {
      const testData = {
        1: { _id: 1, description: 'Task 1', boards: ['My Board'] },
        2: { _id: 2, description: 'Task 2', boards: ['@work'] },
        3: { _id: 3, description: 'Task 3', boards: ['@personal'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.deleteItems(['1', '3']);

      expect(storage.set).toHaveBeenCalledWith({
        2: { _id: 2, description: 'Task 2', boards: ['@work'] }
      });
      expect(render.successDelete).toHaveBeenCalledWith(['1', '3']);
    });

    test('should handle duplicate IDs', () => {
      const testData = {
        1: { _id: 1, description: 'Task to delete', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.deleteItems(['1', '1', '1']);

      expect(storage.set).toHaveBeenCalledWith({});
      expect(render.successDelete).toHaveBeenCalledWith(['1']);
    });
  });

  describe('moveBoards()', () => {
    test('should move item to new board', () => {
      const testData = {
        1: { _id: 1, description: 'Task to move', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'work']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          _id: 1,
          description: 'Task to move',
          boards: ['@work']
        })
      });
      expect(render.successMove).toHaveBeenCalledWith(['1'], ['@work']);
    });

    test('should move item to multiple boards', () => {
      const testData = {
        1: { _id: 1, description: 'Task to move', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'work', 'urgent']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          boards: ['@work', '@urgent']
        })
      });
    });

    test('should handle myboard keyword', () => {
      const testData = {
        1: { _id: 1, description: 'Task to move', boards: ['@work'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'myboard']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          boards: ['My Board']
        })
      });
    });

    test('should remove duplicate board names', () => {
      const testData = {
        1: { _id: 1, description: 'Task to move', boards: ['My Board'] }
      };
      storage.get.mockReturnValue(testData);

      taskbook.moveBoards(['@1', 'work', 'work', 'urgent', 'work']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          boards: ['@work', '@urgent']
        })
      });
    });
  });

  describe('checkTasks()', () => {
    test('should mark task as complete', () => {
      const testData = {
        1: { _id: 1, description: 'Task to complete', boards: ['My Board'], _isTask: true, isComplete: false }
      };
      storage.get.mockReturnValue(testData);

      taskbook.checkTasks(['1']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          isComplete: true,
          inProgress: false
        })
      });
    });

    test('should toggle task completion status', () => {
      const testData = {
        1: { _id: 1, description: 'Completed task', boards: ['My Board'], _isTask: true, isComplete: true }
      };
      storage.get.mockReturnValue(testData);

      taskbook.checkTasks(['1']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          isComplete: false
        })
      });
    });
  });

  describe('beginTasks()', () => {
    test('should mark task as in progress', () => {
      const testData = {
        1: { _id: 1, description: 'Task to start', boards: ['My Board'], _isTask: true, inProgress: false }
      };
      storage.get.mockReturnValue(testData);

      taskbook.beginTasks(['1']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          inProgress: true
        })
      });
    });

    test('should toggle task progress status', () => {
      const testData = {
        1: { _id: 1, description: 'In progress task', boards: ['My Board'], _isTask: true, inProgress: true }
      };
      storage.get.mockReturnValue(testData);

      taskbook.beginTasks(['1']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          inProgress: false
        })
      });
    });
  });

  describe('starItems()', () => {
    test('should star an item', () => {
      const testData = {
        1: { _id: 1, description: 'Item to star', boards: ['My Board'], isStarred: false }
      };
      storage.get.mockReturnValue(testData);

      taskbook.starItems(['1']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          isStarred: true
        })
      });
    });

    test('should toggle star status', () => {
      const testData = {
        1: { _id: 1, description: 'Starred item', boards: ['My Board'], isStarred: true }
      };
      storage.get.mockReturnValue(testData);

      taskbook.starItems(['1']);

      expect(storage.set).toHaveBeenCalledWith({
        1: expect.objectContaining({
          isStarred: false
        })
      });
    });
  });
});