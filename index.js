#!/usr/bin/env node
import Taskbook from './src/taskbook.js';

const taskbook = new Taskbook();

const taskbookCLI = (input, flags) => {
  if (flags.archive) {
    return taskbook.displayArchive();
  }

  if (flags.task) {
    return taskbook.createTask(input);
  }

  if (flags.restore) {
    return taskbook.restoreItems(input);
  }

  if (flags.note) {
    return taskbook.createNote(input);
  }

  if (flags.delete) {
    return taskbook.deleteItems(input);
  }

  if (flags.check) {
    return taskbook.checkTasks(input);
  }

  if (flags.begin) {
    return taskbook.beginTasks(input);
  }

  if (flags.star) {
    return taskbook.starItems(input);
  }

  if (flags.priority) {
    return taskbook.updatePriority(input);
  }

  if (flags.copy) {
    return taskbook.copyToClipboard(input);
  }

  if (flags.timeline) {
    taskbook.displayByDate();
    return taskbook.displayStats();
  }

  if (flags.find) {
    return taskbook.findItems(input);
  }

  if (flags.list) {
    taskbook.listByAttributes(input);
    return taskbook.displayStats();
  }

  if (flags.edit) {
    return taskbook.editDescription(input);
  }

  if (flags.move) {
    return taskbook.moveBoards(input);
  }

  if (flags.clear) {
    return taskbook.clear();
  }

  if (flags.deleteBoard) {
    if (input.length === 0) {
      console.error('Error: Board name is required for --delete-board');
      process.exit(1);
    }

    const boardName = input[0];
    const options = {};

    if (flags.dryRun) {
      options.dryRun = true;
    }

    if (flags.force) {
      options.force = true;
    }

    if (flags.defaultBoard) {
      options.defaultBoard = flags.defaultBoard;
    }

    return taskbook.deleteBoard(boardName, options);
  }

  taskbook.displayByBoard();
  return taskbook.displayStats();
};

export default taskbookCLI;
