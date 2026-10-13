import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { allowThroughProtection, expect, test } from "./fixtures";

// Two local servers stand for two origins: the deployment, and a third party
// such as Clerk. Each records the bypass header it receives.
async function listen(received: Array<string | undefined>) {
  const server: Server = createServer((request, response) => {
    received.push(request.headers["x-vercel-protection-bypass"] as string);
    response.setHeader("content-type", "text/html");
    response.end("<!doctype html><title>ok</title><p>ok</p>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

test("the bypass header reaches the protected origin and no other", async ({
  context,
  page,
}) => {
  const protectedHeaders: Array<string | undefined> = [];
  const otherHeaders: Array<string | undefined> = [];
  const protectedOrigin = await listen(protectedHeaders);
  const otherOrigin = await listen(otherHeaders);

  try {
    await allowThroughProtection(
      context,
      protectedOrigin.origin,
      "not-a-real-secret",
    );
    await page.goto(protectedOrigin.origin);
    await page.goto(otherOrigin.origin);

    expect(protectedHeaders.length).toBeGreaterThan(0);
    expect(protectedHeaders.every((h) => h === "not-a-real-secret")).toBe(true);
    expect(otherHeaders.length).toBeGreaterThan(0);
    expect(otherHeaders.every((h) => h === undefined)).toBe(true);
  } finally {
    protectedOrigin.server.close();
    otherOrigin.server.close();
  }
});
