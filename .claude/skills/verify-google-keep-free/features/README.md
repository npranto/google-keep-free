# Feature map

One file per user-facing feature, from the user's side. A ticket that adds or changes a feature updates its file in the same PR.

| Feature                             | File                               | Notes                                  |
| ----------------------------------- | ---------------------------------- | -------------------------------------- |
| **App shell and Notes empty state** | [app-shell.md](app-shell.md)       | **Core flow:** shows the app is alive  |
| Auth guard                          | [auth-guard.md](auth-guard.md)     | signed-out `/` goes to `/sign-in`      |
| Try-out page                        | [try-out.md](try-out.md)           | public, placeholder landing page       |
| Forge-test rendering demo           | [forge-test.md](forge-test.md)     | public, server/client/streamed/lazy    |
| Public pages                        | [public-pages.md](public-pages.md) | `/about`, `/faq`, `/stuff`, `/sign-up` |
| Composer                            | [composer.md](composer.md)         | "Take a note...", close to save it     |

Not built yet (tickets 03 to 19): editing, pinning, archiving, deleting, coloring, labeling and searching notes, sign-out. Their files are added with those tickets.
