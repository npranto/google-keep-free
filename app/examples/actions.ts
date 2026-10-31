"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  EXAMPLES_COOKIE,
  EXAMPLES_SESSION_SECONDS,
  createSessionToken,
  keyIsCorrect,
} from "@/lib/examples/access";

export type UnlockState = { error: string } | null;

// Checks the typed key and, if it is right, hands out the session cookie. A
// wrong key and a closed area (no key configured) get the same answer, so
// nothing is revealed about which one it was. A Server Action can be called from
// anywhere, so it makes this check itself and does not rely on the layout.
export async function unlockExamples(
  _previous: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const candidate = formData.get("key");
  const token = createSessionToken();
  if (
    token === null ||
    typeof candidate !== "string" ||
    !keyIsCorrect(candidate)
  ) {
    return { error: "That key is not right." };
  }

  (await cookies()).set(EXAMPLES_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/examples",
    maxAge: EXAMPLES_SESSION_SECONDS,
  });
  redirect("/examples");
}
