import { clerkMiddleware } from "@clerk/nextjs/server";

// Makes the Clerk session readable via auth() on every request. It protects
// nothing itself: access is enforced by getOwnerId(), called from the (app)
// layout and from every Server Action.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
