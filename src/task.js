import Item from './item.js';

class Task extends Item {
  constructor(options = {}) {
    super(options);
    this._isTask = true;
    this.isComplete = options.isComplete || false;
    this.inProgress = options.inProgress || false;
    this.isStarred = options.isStarred || false;
    this.priority = options.priority || 1;
  }
}

export default Task;
