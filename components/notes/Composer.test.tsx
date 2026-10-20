/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { createNoteMock } = vi.hoisted(() => ({
  createNoteMock: vi.fn(),
}));

vi.mock("@/lib/notes/actions", () => ({
  createNote: createNoteMock,
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

import { Composer } from "./Composer";

// Resolving the thenable queues the save continuation as a microtask, which is
// the window where a repeated Escape used to start a second insert.
function settledNote() {
  let finish: (() => void) | undefined;
  const thenable = {
    then(onFulfilled: (value: unknown) => void) {
      finish = () => {
        onFulfilled({ ok: true, data: { id: "note-1", version: 1 } });
      };
    },
  };
  return {
    thenable,
    settle() {
      if (!finish) throw new Error("createNote was not awaited");
      finish();
    },
  };
}

function pressEscape(target: Element) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
}

describe("Composer save guard", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    createNoteMock.mockReset();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  async function openAndType(title: string) {
    await act(async () => {
      root.render(<Composer />);
    });
    const collapsed = host.querySelector(
      'input[aria-label="Take a note"]',
    ) as HTMLInputElement;
    await act(async () => {
      collapsed.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const titleField = host.querySelector(
      "#composer-title",
    ) as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(titleField, title);
      titleField.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return titleField;
  }

  it("does not insert a second note when Escape repeats as the save settles", async () => {
    const save = settledNote();
    createNoteMock.mockImplementation(() => save.thenable);

    const titleField = await openAndType("Milk");
    const composer = titleField.parentElement as HTMLElement;

    await act(async () => {
      pressEscape(composer);
    });
    expect(createNoteMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      save.settle();
      queueMicrotask(() => pressEscape(composer));
    });

    expect(createNoteMock).toHaveBeenCalledTimes(1);
    expect(createNoteMock).toHaveBeenCalledWith({ title: "Milk", body: "" });
    expect(host.querySelector("#composer-title")).toBeNull();
  });

  it("keeps the draft and allows another save after a failure", async () => {
    createNoteMock
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce({ ok: true, data: { id: "note-2", version: 1 } });

    const titleField = await openAndType("Milk");
    const composer = titleField.parentElement as HTMLElement;

    await act(async () => {
      pressEscape(composer);
    });

    expect(host.querySelector("[role='alert']")?.textContent).toBe(
      "Could not save the note. Try again.",
    );
    expect(
      (host.querySelector("#composer-title") as HTMLInputElement).value,
    ).toBe("Milk");

    await act(async () => {
      pressEscape(composer);
    });

    expect(createNoteMock).toHaveBeenCalledTimes(2);
    expect(host.querySelector("#composer-title")).toBeNull();
  });
});
