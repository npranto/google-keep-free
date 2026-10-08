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

import AppLayout from "./layout";

beforeEach(() => {
  authMock.mockReset();
  redirectMock.mockClear();
});

describe("(app) layout guard", () => {
  it("redirects a signed-out visitor to /sign-in", async () => {
    authMock.mockResolvedValue({ userId: null });
    await expect(AppLayout({ children: "page" })).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in",
    );
  });

  it("renders its children for a signed-in Owner", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    await expect(AppLayout({ children: "page" })).resolves.toBe("page");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
