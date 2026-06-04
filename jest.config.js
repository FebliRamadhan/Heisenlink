/**
 * Jest config for ESM project ("type": "module").
 * Run via: NODE_OPTIONS=--experimental-vm-modules jest
 * Mock ESM modules with jest.unstable_mockModule + dynamic import.
 *
 * `roots` is constrained to src/ + tests/ so jest's haste-map crawler does NOT
 * scan the large Next.js frontend tree (.next/, app/, components/), which
 * otherwise hangs the crawl on this repo.
 */
export default {
  testEnvironment: 'node',
  transform: {},
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  watchman: false,
  clearMocks: true,
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/validators/**/*.js',
    'src/controllers/**/*.js',
  ],
};
