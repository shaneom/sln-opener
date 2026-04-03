module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'config.js',
    'mainMenu.js'
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 24,
      lines: 24,
      statements: 24
    }
  },
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  verbose: true
};
