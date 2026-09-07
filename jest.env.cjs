// Set before any `~/env` import so @t3-oss/env-nextjs never throws in tests.
process.env.SKIP_ENV_VALIDATION = "1";
process.env.POSTGRES_URL =
  process.env.POSTGRES_URL || "postgres://test:test@localhost:5432/test";
process.env.NODE_ENV = process.env.NODE_ENV || "test";
