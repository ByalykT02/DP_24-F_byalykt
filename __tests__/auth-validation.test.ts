/**
 * Names the authentication operation precisely:
 * Credentials provider + bcryptjs (cost 10) + NextAuth JWT strategy carrying
 * a role claim ("ADMIN" | "USER"). There is NO Google OAuth provider in
 * `auth.ts` — this test documents that fact so resume bullets cannot claim
 * "Google OAuth" without adding the provider first.
 */
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { LoginSchema, RegisterSchema } from "schemas";

describe("LoginSchema (Credentials authorize() input contract)", () => {
  it("accepts a valid email + 6+ char password", () => {
    expect(
      LoginSchema.safeParse({ email: "a@b.com", password: "secret1" }).success,
    ).toBe(true);
  });

  it("rejects malformed emails and short passwords", () => {
    expect(
      LoginSchema.safeParse({ email: "not-an-email", password: "secret1" })
        .success,
    ).toBe(false);
    expect(
      LoginSchema.safeParse({ email: "a@b.com", password: "123" }).success,
    ).toBe(false);
  });
});

describe("RegisterSchema (register() input contract)", () => {
  it("requires matching confirm password", () => {
    const good = {
      name: "Ada",
      email: "ada@example.com",
      password: "secret1",
      confirm: "secret1",
    };
    expect(RegisterSchema.safeParse(good).success).toBe(true);

    const mismatch = { ...good, confirm: "other12" };
    const parsed = RegisterSchema.safeParse(mismatch);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["confirm"]);
    }
  });
});

describe("bcryptjs password hashing (cost factor 10)", () => {
  it("hashes and verifies a password round-trip", async () => {
    const hash = await bcrypt.hash("correct-horse-1", 10);
    expect(hash).not.toContain("correct-horse-1");
    await expect(bcrypt.compare("correct-horse-1", hash)).resolves.toBe(true);
    await expect(bcrypt.compare("wrong-password", hash)).resolves.toBe(false);
  }, 15000);
});

describe("NextAuth provider configuration (auth.ts)", () => {
  const authSource = fs.readFileSync(
    path.join(__dirname, "..", "auth.ts"),
    "utf8",
  );

  it("uses the JWT session strategy with a role claim", () => {
    expect(authSource).toMatch(/strategy:\s*["']jwt["']/);
    expect(authSource).toMatch(/role\?:\s*"ADMIN" \| "USER"/);
  });

  it("documents that Google OAuth is NOT configured (Credentials-only)", () => {
    expect(authSource).toMatch(/Credentials\(/);
    // If someone adds Google OAuth later, this test intentionally fails so
    // the resume bullet "Google OAuth" becomes true and measurable.
    expect(authSource).not.toMatch(/Google\(|GoogleProvider/);
  });
});
