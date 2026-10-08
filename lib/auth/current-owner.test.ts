import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  // Next's redirect() throws to unwind the render; mirror that.
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { getOwnerId } from "./current-owner";

beforeEach(() => {
  authMock.mockReset();
  redirectMock.mockClear();
});

describe("getOwnerId", () => {
  it("returns the Clerk user id of the current session", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    await expect(getOwnerId()).resolves.toBe("user_123");
  });

  it("redirects to /sign-in when there is no session", async () => {
    authMock.mockResolvedValue({ userId: null });
    await expect(getOwnerId()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("takes no arguments, so a client-supplied id cannot reach it", () => {
    expect(getOwnerId.length).toBe(0);
  });
});
