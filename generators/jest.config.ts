export default {
  displayName: 'generators',
  preset: '../jest.preset.js',
  setupFiles: ['<rootDir>/src/test-setup.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { 
      tsconfig: '<rootDir>/tsconfig.spec.json',
      isolatedModules: true,
      useESM: true
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/generators',
  moduleNameMapper: {
    '^@mi/(.*)$': '<rootDir>/../../libs/$1/src'
  }
};
