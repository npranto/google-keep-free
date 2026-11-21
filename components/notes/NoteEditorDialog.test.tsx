// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NoteEditorDialog } from "./NoteEditorDialog";

// The action reaches the database and Clerk: it is the boundary, so it is
// replaced. Its own rules are covered by actions.test.ts and the integration
// tests.
const updateNote = vi.hoisted(() => vi.fn());
vi.mock("@/lib/notes/actions", () => ({ updateNote }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const NOTE_ID = "6f0c2c24-6a7c-4e1c-8d7e-3d1f6a3b9c11";
// Longer than the 500-character card preview.
const LONG_BODY = `${"line of text ".repeat(60)}the very end`;

beforeEach(() => {
  fetchMock.mockResolvedValue(
    Response.json({
      id: NOTE_ID,
      title: "Groceries",
      body: LONG_BODY,
      version: 4,
    }),
  );
  updateNote.mockImplementation(async (input: { version: number }) => ({
    ok: true,
    data: { id: NOTE_ID, version: input.version + 1 },
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  fetchMock.mockReset();
  updateNote.mockReset();
});

async function openEditor() {
  render(
    <NoteEditorDialog
      noteId={NOTE_ID}
      trigger={<button type="button">Open note</button>}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Open note" });
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Edit note" });
  await screen.findByLabelText("Title");
  return { trigger, dialog };
}

// Testing Library's own waiting hangs on a faked clock, so a test opens the
// dialog on the real clock and only then takes control of the timers.
const takeControlOfTimers = () =>
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

const status = () => screen.getByRole("status");

describe("NoteEditorDialog", () => {
  it("opens with the Note's full title and body, read from the route", async () => {
    await openEditor();

    expect(fetchMock.mock.calls[0][0]).toBe(`/api/notes/${NOTE_ID}`);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    expect(screen.getByLabelText("Title")).toHaveProperty("value", "Groceries");
    expect(screen.getByLabelText("Note")).toHaveProperty("value", LONG_BODY);
  });

  it("names the dialog and has an empty polite status region", async () => {
    const { dialog } = await openEditor();

    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(status().getAttribute("aria-live")).toBe("polite");
    expect(status().textContent).toBe("");
  });

  it("saves one second after typing stops, then shows Saved and clears it after 2s", async () => {
    await openEditor();
    takeControlOfTimers();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Groceries today" },
    });
    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(updateNote).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(updateNote).toHaveBeenCalledWith({
      id: NOTE_ID,
      title: "Groceries today",
      body: LONG_BODY,
      version: 4,
    });
    expect(status().textContent).toBe("Saved");

    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(status().textContent).toBe("");
  });

  it("shows Saving… while the save is on its way", async () => {
    await openEditor();
    takeControlOfTimers();
    let finish: (value: unknown) => void = () => {};
    updateNote.mockImplementation(
      () => new Promise((resolve) => (finish = resolve)),
    );

    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "milk" },
    });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(status().textContent).toBe("Saving…");

    await act(async () =>
      finish({ ok: true, data: { id: NOTE_ID, version: 5 } }),
    );
    expect(status().textContent).toBe("Saved");
  });

  it("sends the version each save returned, not the one it opened with", async () => {
    await openEditor();
    takeControlOfTimers();

    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "a" } });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "ab" },
    });
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(updateNote.mock.calls.map(([input]) => input.version)).toEqual([
      4, 5,
    ]);
  });

  it("saves at once when a field loses focus", async () => {
    await openEditor();
    const title = screen.getByLabelText("Title");

    fireEvent.change(title, { target: { value: "Renamed" } });
    fireEvent.blur(title);
    await act(async () => {});

    expect(updateNote).toHaveBeenCalledTimes(1);
    expect(updateNote.mock.calls[0][0]).toMatchObject({ title: "Renamed" });
  });

  it("saves the pending edit when Escape closes it, and gives focus back", async () => {
    const { trigger } = await openEditor();

    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "typed, then Escape at once" },
    });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await act(async () => {});

    expect(updateNote).toHaveBeenCalledTimes(1);
    expect(updateNote.mock.calls[0][0]).toMatchObject({
      body: "typed, then Escape at once",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("saves the pending edit when the close control is used", async () => {
    const { dialog } = await openEditor();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Closed with the X" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await act(async () => {});

    expect(updateNote).toHaveBeenCalledTimes(1);
    expect(updateNote.mock.calls[0][0]).toMatchObject({
      title: "Closed with the X",
    });
  });

  it("does not save when nothing changed", async () => {
    await openEditor();
    takeControlOfTimers();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(updateNote).not.toHaveBeenCalled();
  });

  it("reads the Note again each time it opens", async () => {
    const { trigger } = await openEditor();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fetchMock.mockResolvedValue(
      Response.json({
        id: NOTE_ID,
        title: "Edited",
        body: "short",
        version: 9,
      }),
    );

    fireEvent.click(trigger);

    await waitFor(() =>
      expect(screen.getByLabelText("Title")).toHaveProperty("value", "Edited"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  describe("when the Note cannot be read", () => {
    async function openAndExpectError() {
      render(
        <NoteEditorDialog
          noteId={NOTE_ID}
          trigger={<button type="button">Open note</button>}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Open note" }));
      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toContain("Could not open this note");
      expect(screen.queryByLabelText("Title")).toBeNull();
    }

    it("shows an error for a 404", async () => {
      fetchMock.mockResolvedValue(
        Response.json({ error: "not_found" }, { status: 404 }),
      );
      await openAndExpectError();
    });

    it("shows an error for the HTML a signed-out call is redirected to", async () => {
      fetchMock.mockResolvedValue(
        new Response("<html>Sign in</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );
      await openAndExpectError();
    });

    it("shows an error for JSON that is not a Note", async () => {
      fetchMock.mockResolvedValue(Response.json({ ok: true }));
      await openAndExpectError();
    });

    it("shows an error when the request fails", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      await openAndExpectError();
    });

    it("never saves anything", async () => {
      fetchMock.mockResolvedValue(Response.json({}, { status: 404 }));
      await openAndExpectError();
      takeControlOfTimers();

      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      await act(() => vi.advanceTimersByTimeAsync(3000));

      expect(updateNote).not.toHaveBeenCalled();
    });
  });

  describe("when a save fails", () => {
    it("says a Note needs a title or a body when both are emptied", async () => {
      await openEditor();
      takeControlOfTimers();
      updateNote.mockResolvedValue({
        ok: false,
        error: {
          kind: "validation",
          message: "A note needs a title or a body",
        },
      });

      fireEvent.change(screen.getByLabelText("Title"), {
        target: { value: "" },
      });
      fireEvent.change(screen.getByLabelText("Note"), {
        target: { value: "" },
      });
      await act(() => vi.advanceTimersByTimeAsync(1000));

      expect(status().textContent).toBe("A note needs a title or a body");
    });

    it("does not show a raw validation message it did not write", async () => {
      await openEditor();
      takeControlOfTimers();
      updateNote.mockResolvedValue({
        ok: false,
        error: { kind: "validation", message: "Too big: expected int32" },
      });

      fireEvent.change(screen.getByLabelText("Note"), {
        target: { value: "x" },
      });
      await act(() => vi.advanceTimersByTimeAsync(1000));

      expect(status().textContent).toContain("Could not save");
      expect(status().textContent).not.toContain("int32");
    });

    it("shows the same generic message when the call throws", async () => {
      await openEditor();
      takeControlOfTimers();
      updateNote.mockRejectedValue(new Error("network"));

      fireEvent.change(screen.getByLabelText("Note"), {
        target: { value: "x" },
      });
      await act(() => vi.advanceTimersByTimeAsync(1000));

      expect(status().textContent).toContain("Could not save");
    });
  });
});
