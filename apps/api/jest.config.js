module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@pms/config$': '<rootDir>/../../../packages/config/src',
    '^@pms/shared-types$': '<rootDir>/../../../packages/shared-types/src',
    '^@pms/validation$': '<rootDir>/../../../packages/validation/src',
  },
};
