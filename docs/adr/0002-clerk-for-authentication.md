# Clerk for authentication

Authentication is delegated to Clerk, a hosted provider. Users, credentials, sessions, email verification, password reset, and OAuth live in Clerk, not in our Postgres. Our database stores only the Clerk user ID as an opaque owner key on notes and labels.

We chose Clerk over Better Auth (self-owned data in our own Postgres), Auth.js, and a hand-rolled implementation. Better Auth would have kept user data in our database and avoided a vendor dependency, but would have required us to build email verification and password reset ourselves. Clerk gives a polished, secure flow with the least time and security risk, accepting a third-party dependency, pricing tiers, and that user identity data lives outside our database.

Consequences: there is no local users table to join against, so every user-owned row is scoped by the Clerk user ID taken from the verified session on the server. Migrating away from Clerk later means exporting users and reissuing credentials.
