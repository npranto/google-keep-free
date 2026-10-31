import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

// Access to the internal /examples pages. They are surface-level protected only:
// they hold demo text and fake data, never anything real. Without
// EXAMPLES_ACCESS_KEY the pages are closed.

export const EXAMPLES_COOKIE = "examples_access";
// 8 hours. The cookie outlives the browser session, up to this maximum.
export const EXAMPLES_SESSION_SECONDS = 8 * 60 * 60;

export function examplesAreEnabled(): boolean {
  return env.EXAMPLES_ACCESS_KEY !== undefined;
}

// Compares two secrets without leaking, through timing, how much of them
// matches. Hashing first gives both the same length, which timingSafeEqual needs.
function sameSecret(a: string, b: string): boolean {
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(a), digest(b));
}

// True when the person typed the right key.
export function keyIsCorrect(candidate: string): boolean {
  const key = env.EXAMPLES_ACCESS_KEY;
  return key !== undefined && sameSecret(candidate, key);
}

// What the cookie holds: a signature made with the key, never the key. Changing
// the key changes the signature, so every cookie handed out earlier stops
// working. Null when the pages are closed.
export function createSessionToken(): string | null {
  const key = env.EXAMPLES_ACCESS_KEY;
  if (key === undefined) return null;
  return createHmac("sha256", key).update("examples-session-v1").digest("hex");
}

// True when this request carries a cookie that matches the current key.
export async function hasExamplesAccess(): Promise<boolean> {
  const expected = createSessionToken();
  if (expected === null) return false;
  const sent = (await cookies()).get(EXAMPLES_COOKIE)?.value;
  return sent !== undefined && sameSecret(sent, expected);
}
