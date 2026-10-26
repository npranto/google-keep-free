import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StreamedSection, StreamedSkeleton } from "./StreamedSection";

// fetch is the system boundary: replacing it keeps the tests offline.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => fetchMock.mockReset());

describe("StreamedSection", () => {
  it("asks the API to wait, uncached, and renders the comments it gets", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        comments: [
          { id: 1, body: "Nice one", likes: 2, user: { username: "ada" } },
        ],
      }),
    );

    const markup = renderToStaticMarkup(await StreamedSection());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("delay=2000");
    expect(init.cache).toBe("no-store");
    expect(markup).toContain("Nice one");
    expect(markup).toContain('data-state="ready"');
  });

  it("shows the unavailable message when the API fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const markup = renderToStaticMarkup(await StreamedSection());

    expect(markup).toContain('data-state="unavailable"');
    expect(markup).toContain("unavailable right now");
  });

  it("has a skeleton fallback that is the same section in its loading state", () => {
    const markup = renderToStaticMarkup(<StreamedSkeleton />);

    expect(markup).toContain('data-section="streamed"');
    expect(markup).toContain('data-state="loading"');
  });
});
