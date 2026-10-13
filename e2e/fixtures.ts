import { type BrowserContext, test as base } from "@playwright/test";

export { expect } from "@playwright/test";

// Lets a request past Vercel Deployment Protection. It goes to one origin only,
// from a route handler: `extraHTTPHeaders` would send the secret to every third
// party the page calls, Clerk included.
export async function allowThroughProtection(
  context: BrowserContext,
  origin: string,
  secret: string,
) {
  await context.route(
    (url) => url.origin === origin,
    (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-vercel-protection-bypass": secret,
          "x-vercel-set-bypass-cookie": "true",
        },
      }),
  );
}

// Every spec imports `test` from here. The bypass applies only when the suite
// runs against a deployment (E2E_BASE_URL set) and the secret is available.
export const test = base.extend({
  // The second argument is Playwright's "use". It is named `provide` because
  // the React hooks lint rule reads any call to `use` as a React hook.
  context: async ({ context, baseURL }, provide) => {
    const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (secret && process.env.E2E_BASE_URL && baseURL) {
      await allowThroughProtection(context, new URL(baseURL).origin, secret);
    }
    await provide(context);
  },
});
