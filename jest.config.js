module.exports = {
  setupFiles: [
    "dotenv/config"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/console_setup.js"],
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
