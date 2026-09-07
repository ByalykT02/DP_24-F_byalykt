/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^(auth|routes|schemas)$": "<rootDir>/$1",
    "^(auth|routes|schemas)/(.*)$": "<rootDir>/$1/$2",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFiles: ["<rootDir>/jest.env.cjs"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  testTimeout: 15000,
  clearMocks: true,
};
