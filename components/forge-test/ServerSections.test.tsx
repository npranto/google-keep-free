import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PostsSection,
  QuoteSection,
  TodosSection,
  UsersSection,
} from "./ServerSections";

// fetch is the system boundary: replacing it keeps the tests offline.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => fetchMock.mockReset());

// Static markup is what the server sends before any JavaScript runs, so these
// tests check what a visitor with JavaScript off would get.
const html = async (section: Promise<React.JSX.Element>) =>
  renderToStaticMarkup(await section);

describe("the server sections with the API up", () => {
  it("put the fetched data in the markup", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        Response.json(
          url.includes("/posts")
            ? {
                posts: [
                  { id: 1, title: "Hello post", reactions: { likes: 7 } },
                ],
              }
            : url.includes("/users")
              ? {
                  users: [
                    { id: 1, firstName: "Ada", lastName: "Lovelace", age: 36 },
                  ],
                }
              : url.includes("/todos")
                ? {
                    todos: [
                      { id: 1, todo: "Write tests", completed: true },
                      { id: 2, todo: "Ship it", completed: false },
                    ],
                  }
                : { id: 1, quote: "Be brief.", author: "Someone" },
        ),
      ),
    );

    const posts = await html(PostsSection());
    expect(posts).toContain("Hello post");
    expect(posts).toContain('data-state="ready"');
    expect(posts).toContain('data-rendering="server"');

    expect(await html(UsersSection())).toContain("Ada Lovelace");

    const todos = await html(TodosSection());
    expect(todos).toContain("Write tests");
    expect(todos).toContain("1 of 2 done");

    const quote = await html(QuoteSection());
    expect(quote).toContain("Be brief.");
    expect(quote).toContain('data-rendering="server-cached"');
  });

  it("fetch the request-time sections uncached and the quote with a revalidate window", async () => {
    // A fresh Response per call: a body can only be read once.
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        Response.json({
          posts: [],
          users: [],
          todos: [],
          quote: "q",
          author: "a",
        }),
      ),
    );

    await PostsSection();
    await UsersSection();
    await TodosSection();
    await QuoteSection();

    const inits = fetchMock.mock.calls.map(([, init]) => init);
    expect(inits.slice(0, 3).every((init) => init.cache === "no-store")).toBe(
      true,
    );
    expect(inits[3].next).toEqual({ revalidate: 60 });
  });
});

describe("the server sections with the API down", () => {
  it("each show the unavailable message instead of throwing", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    for (const section of [
      PostsSection,
      UsersSection,
      TodosSection,
      QuoteSection,
    ]) {
      const markup = await html(section());
      expect(markup).toContain('data-state="unavailable"');
      expect(markup).toContain("unavailable right now");
    }
  });
});
