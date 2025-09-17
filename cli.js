#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import meow from 'meow';
import updateNotifier from 'update-notifier';
import help from './src/help.js';
import taskbookCLI from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

const cli = meow(help, {
  importMeta: import.meta,
  flags: {
    help: {
      type: 'boolean',
      shortFlag: 'h'
    },
    version: {
      type: 'boolean',
      shortFlag: 'v'
    },
    archive: {
      type: 'boolean',
      shortFlag: 'a'
    },
    restore: {
      type: 'boolean',
      shortFlag: 'r'
    },
    task: {
      type: 'boolean',
      shortFlag: 't'
    },
    note: {
      type: 'boolean',
      shortFlag: 'n'
    },
    delete: {
      type: 'boolean',
      shortFlag: 'd'
    },
    check: {
      type: 'boolean',
      shortFlag: 'c'
    },
    begin: {
      type: 'boolean',
      shortFlag: 'b'
    },
    star: {
      type: 'boolean',
      shortFlag: 's'
    },
    copy: {
      type: 'boolean',
      shortFlag: 'y'
    },
    timeline: {
      type: 'boolean',
      shortFlag: 'i'
    },
    priority: {
      type: 'boolean',
      shortFlag: 'p'
    },
    find: {
      type: 'boolean',
      shortFlag: 'f'
    },
    list: {
      type: 'boolean',
      shortFlag: 'l'
    },
    edit: {
      type: 'boolean',
      shortFlag: 'e'
    },
    move: {
      type: 'boolean',
      shortFlag: 'm'
    },
    clear: {
      type: 'boolean'
    },
    deleteBoard: {
      type: 'boolean'
    },
    dryRun: {
      type: 'boolean'
    },
    force: {
      type: 'boolean'
    },
    defaultBoard: {
      type: 'string'
    }
  }
});

updateNotifier({ pkg }).notify();

taskbookCLI(cli.input, cli.flags);
