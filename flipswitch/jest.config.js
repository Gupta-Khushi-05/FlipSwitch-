module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
