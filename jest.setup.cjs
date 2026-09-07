// Silence winston console noise during tests; keep console.error for failures.
const originalError = console.error;
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterAll(() => {
  console.error = originalError;
});
