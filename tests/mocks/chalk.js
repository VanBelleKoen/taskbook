const chalk = jest.fn((text) => text);
chalk.blue = jest.fn((text) => text);
chalk.green = jest.fn((text) => text);
chalk.grey = jest.fn((text) => text);
chalk.gray = jest.fn((text) => text);
chalk.magenta = jest.fn((text) => text);
chalk.red = jest.fn((text) => text);
chalk.underline = jest.fn((text) => text);
chalk.yellow = jest.fn((text) => text);
chalk.dim = jest.fn((text) => text);
chalk.bold = jest.fn((text) => text);

export default chalk;