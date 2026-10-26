import { fetchDummy } from "@/lib/forge-test/dummy-api";

import { Section, UnavailableSection } from "./Section";

// Fetched in the server component, so the data is in the first HTML. The
// default fetch would be prerendered once at build time (Next 16), so the
// request-time sections opt out of the cache.
const REQUEST_TIME = { cache: "no-store" } as const;

type Post = { id: number; title: string; reactions: { likes: number } };
type User = { id: number; firstName: string; lastName: string; age: number };
type Todo = { id: number; todo: string; completed: boolean };
type Quote = { id: number; quote: string; author: string };

const list = "divide-y divide-border";
const row = "py-2 text-sm";

export async function PostsSection() {
  const result = await fetchDummy<{ posts: Post[] }>(
    "/posts?limit=5&select=title,reactions",
    REQUEST_TIME,
  );
  if (!result.ok) {
    return (
      <UnavailableSection id="posts" rendering="server" title="Latest posts" />
    );
  }
  return (
    <Section id="posts" rendering="server" title="Latest posts" state="ready">
      <ul className={list}>
        {result.data.posts.map((post) => (
          <li key={post.id} className={row}>
            {post.title}
            <span className="ml-2 text-muted-foreground">
              {post.reactions.likes} likes
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function UsersSection() {
  const result = await fetchDummy<{ users: User[] }>(
    "/users?limit=6&select=firstName,lastName,age",
    REQUEST_TIME,
  );
  if (!result.ok) {
    return <UnavailableSection id="users" rendering="server" title="People" />;
  }
  return (
    <Section id="users" rendering="server" title="People" state="ready">
      <ul className={list}>
        {result.data.users.map((user) => (
          <li key={user.id} className={row}>
            {user.firstName} {user.lastName}
            <span className="ml-2 text-muted-foreground">age {user.age}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function TodosSection() {
  const result = await fetchDummy<{ todos: Todo[] }>(
    "/todos?limit=6",
    REQUEST_TIME,
  );
  if (!result.ok) {
    return <UnavailableSection id="todos" rendering="server" title="To do" />;
  }
  const { todos } = result.data;
  const done = todos.filter((todo) => todo.completed).length;
  return (
    <Section id="todos" rendering="server" title="To do" state="ready">
      <p className="text-sm text-muted-foreground">
        {done} of {todos.length} done
      </p>
      <ul className={`mt-2 ${list}`}>
        {todos.map((todo) => (
          <li key={todo.id} className={row}>
            <span aria-hidden="true">{todo.completed ? "[x]" : "[ ]"}</span>{" "}
            <span className="sr-only">
              {todo.completed ? "Done: " : "Not done: "}
            </span>
            {todo.todo}
          </li>
        ))}
      </ul>
    </Section>
  );
}

// The one cached section: the same random quote is served for 60 seconds.
export async function QuoteSection() {
  const result = await fetchDummy<Quote>("/quotes/random", {
    next: { revalidate: 60 },
  });
  if (!result.ok) {
    return (
      <UnavailableSection
        id="quote"
        rendering="server-cached"
        title="Quote of the minute"
      />
    );
  }
  return (
    <Section
      id="quote"
      rendering="server-cached"
      title="Quote of the minute"
      state="ready"
    >
      <blockquote className="text-sm">
        <p>{result.data.quote}</p>
        <footer className="mt-2 text-muted-foreground">
          {result.data.author}
        </footer>
      </blockquote>
    </Section>
  );
}
