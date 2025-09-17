import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

const { join } = path;
const { default: defaultConfig } = pkg.configuration;

class Config {
  constructor() {
    this._configFile = join(os.homedir(), '.taskbook.json');

    this._ensureConfigFile();
  }

  _ensureConfigFile() {
    if (fs.existsSync(this._configFile)) {
      return;
    }

    const data = JSON.stringify(defaultConfig, null, 4);
    fs.writeFileSync(this._configFile, data, 'utf8');
  }

  _formatTaskbookDir(path) {
    return join(os.homedir(), path.replace(/^~/g, ''));
  }

  get() {
    let config = {};

    const content = fs.readFileSync(this._configFile, 'utf8');
    config = JSON.parse(content);

    if (config.taskbookDirectory.startsWith('~')) {
      config.taskbookDirectory = this._formatTaskbookDir(config.taskbookDirectory);
    }

    return Object.assign({}, defaultConfig, config);
  }
}

export default new Config();
