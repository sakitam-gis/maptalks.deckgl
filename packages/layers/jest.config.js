module.exports = {
  verbose: true,
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  testEnvironment: "jsdom",
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  moduleFileExtensions: [
    "ts", "tsx", "js", "jsx", "json", "node"
  ],
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  watchPathIgnorePatterns: ["/dist/", "/node_modules/"],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/test/"
  ],
  // coverageThreshold: {
  //   "global": {
  //     "branches": 0,
  //     "functions": 0,
  //     "lines": 0,
  //     "statements": 0
  //   }
  // },
  collectCoverageFrom: [
    "src/*.{js,ts,tsx}"
  ],
  clearMocks: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'clover'],
  modulePathIgnorePatterns: ['dist'],
  roots: ['<rootDir>'],
};
