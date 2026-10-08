import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// The one place that reads identity. The Owner is the Clerk user id from the
// verified session, never a value passed in by the client (ADR 0002).
export async function getOwnerId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}
