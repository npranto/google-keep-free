// The dummy data source for /forge-test (ticket 02.03.06): DummyJSON, public,
// no key. It supports `select`, `limit` and `delay`, which the page uses.
export const DUMMY_API = "https://dummyjson.com";

// A section waits at most this long. The streamed section asks the API for a
// 2 second delay, so this leaves room for it.
const TIMEOUT_MS = 5000;

// A failure carries no detail on purpose: the page only needs to know it must
// show the "unavailable" message instead of data.
export type DummyResult<T> = { ok: true; data: T } | { ok: false };

// Never throws. A network error, a timeout, a non-2xx answer or a body that is
// not JSON all come back as { ok: false }, so one section failing cannot take
// the whole page down.
export async function fetchDummy<T>(
  path: string,
  init: RequestInit = {},
): Promise<DummyResult<T>> {
  try {
    const response = await fetch(`${DUMMY_API}${path}`, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false };
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false };
  }
}
