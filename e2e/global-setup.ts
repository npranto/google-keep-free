import { clerkSetup } from "@clerk/testing/playwright";

export default async function globalSetup() {
  // A production smoke run is signed out and carries no Clerk keys. The tests
  // that sign in check for the keys themselves and name any that is missing.
  if (
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    await clerkSetup();
  }
}
