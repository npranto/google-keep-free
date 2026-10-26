import { afterEach, describe, expect, it, vi } from "vitest";

import { DUMMY_API, fetchDummy } from "./dummy-api";

// fetch is the system boundary: replacing it keeps the tests offline.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => fetchMock.mockReset());

describe("fetchDummy", () => {
  it("returns the parsed body when the API answers 200", async () => {
    fetchMock.mockResolvedValue(Response.json({ posts: [{ id: 1 }] }));

    expect(await fetchDummy("/posts")).toEqual({
      ok: true,
      data: { posts: [{ id: 1 }] },
    });
  });

  it("calls the API with the path, the caller's options and a timeout signal", async () => {
    fetchMock.mockResolvedValue(Response.json({}));

    await fetchDummy("/posts?limit=1", { cache: "no-store" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DUMMY_API}/posts?limit=1`);
    expect(init.cache).toBe("no-store");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns { ok: false } for a non-2xx answer", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 503 }));

    expect(await fetchDummy("/posts")).toEqual({ ok: false });
  });

  it("returns { ok: false } when the request fails or times out", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await fetchDummy("/posts")).toEqual({ ok: false });

    fetchMock.mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    expect(await fetchDummy("/posts")).toEqual({ ok: false });
  });

  it("returns { ok: false } when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>oops</html>"));

    expect(await fetchDummy("/posts")).toEqual({ ok: false });
  });
});
