// What a Server Action returns instead of throwing, so the caller can show the
// failure. Later tickets add error kinds as they need them.
export type ActionError = { kind: "validation"; message: string };

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: ActionError };
