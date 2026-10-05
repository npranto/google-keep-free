import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { envSchema, parseEnv } from "./env";

// lib/env.ts validates process.env on import, so seed a valid value first.
const { validUrl } = vi.hoisted(() => {
  const validUrl =
    "postgresql://user:pass@ep-cool-123-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
  process.env.DATABASE_URL = validUrl;
  return { validUrl };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("env module", () => {
  it("exports the validated process.env", async () => {
    const { env } = await import("./env");
    expect(env.DATABASE_URL).toBe(validUrl);
  });

  it("throws on import naming DATABASE_URL when it is unset", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    await expect(import("./env")).rejects.toThrow(/DATABASE_URL/);
  });
});

describe("parseEnv", () => {
  it("loads a well-formed DATABASE_URL", () => {
    expect(parseEnv({ DATABASE_URL: validUrl })).toEqual({
      DATABASE_URL: validUrl,
    });
  });

  it("accepts the postgres:// scheme", () => {
    const url = "postgres://user:pass@localhost:5432/keep";
    expect(parseEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("fails naming DATABASE_URL when it is missing", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("fails naming DATABASE_URL when it is empty", () => {
    expect(() => parseEnv({ DATABASE_URL: "" })).toThrow(/DATABASE_URL/);
  });

  it("fails naming DATABASE_URL when it is not a URL", () => {
    expect(() => parseEnv({ DATABASE_URL: "not a url" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("fails naming DATABASE_URL when the scheme is not postgres", () => {
    expect(() => parseEnv({ DATABASE_URL: "https://example.com/db" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("does not echo the invalid value in the error", () => {
    const secret = "mysql://user:hunter2@host/db";
    expect(() => parseEnv({ DATABASE_URL: secret })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("hunter2"),
      }),
    );
  });
});

describe(".env.example", () => {
  it("documents every variable in the env schema", () => {
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    const documented = new Set(
      example
        .split("\n")
        .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
        .filter((name): name is string => Boolean(name)),
    );

    for (const name of Object.keys(envSchema.shape)) {
      expect(documented, `${name} missing from .env.example`).toContain(name);
    }
  });
});
