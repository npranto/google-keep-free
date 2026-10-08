import { z } from "zod";

// Single source of truth for server env vars. Add new variables here and
// document each one in .env.example.
export const envSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "must be a postgres:// or postgresql:// URL",
  }),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "is required"),
  CLERK_SECRET_KEY: z.string().min(1, "is required"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  // Name each failing variable but never echo its value: URLs carry secrets.
  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = parseEnv(process.env);
