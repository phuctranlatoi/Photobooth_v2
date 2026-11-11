/** Isolated Jest smoke test; the existing Vitest suite remains unchanged. */
module.exports = {
  rootDir: './frontend',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.jest.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'CommonJS',
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },
};
