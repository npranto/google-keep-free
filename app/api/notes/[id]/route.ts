import { NextResponse } from "next/server";

import { getOwnedNote } from "@/lib/notes/queries";

// The editor reads a Note here, not through a Server Action: actions run one at
// a time on the client, so a read would wait behind a save still on its way.
// The JSON is the Owner's private text, so no shared cache may keep it.
const headers = { "Cache-Control": "private, no-store" };

// getOwnedNote redirects by throwing when there is no session, so it is not
// wrapped in a try/catch. Another Owner's Note, a missing id and a malformed id
// all answer the same 404, so the response reveals nothing about which it was.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const note = await getOwnedNote(id);

  if (!note) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers });
  }

  return NextResponse.json(
    { id: note.id, title: note.title, body: note.body, version: note.version },
    { headers },
  );
}
