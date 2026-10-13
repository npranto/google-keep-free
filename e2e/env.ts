// Reads a variable the suite needs. A missing one fails the run and names the
// variable, so a broken setup never turns into a skipped, green test.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in .env.local (see .env.example), or as a CI secret.`,
    );
  }
  return value;
}
