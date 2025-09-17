import Item from './item.js';

class Note extends Item {
  constructor(options = {}) {
    super(options);
    this._isTask = false;
  }
}

export default Note;
