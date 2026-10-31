// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAutosave } from "./use-autosave";

type Props = Parameters<typeof useAutosave>[0];
type Save = Props["save"];

const SAVED: Awaited<ReturnType<Save>> = { ok: true, data: null };
const FAILED: Awaited<ReturnType<Save>> = {
  ok: false,
  error: { kind: "not_found", message: "This note could not be saved" },
};
const EMPTY = { title: "", body: "" };

// Testing Library only cleans up on its own when afterEach is a global, and
// Vitest does not expose it as one here.
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  // Drops the override from changeTab and falls back to jsdom's own value.
  Reflect.deleteProperty(document, "visibilityState");
});

function changeTab(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function mount(save: Save, values = EMPTY) {
  return renderHook((props: Props) => useAutosave(props), {
    initialProps: { values, save },
  });
}

describe("useAutosave", () => {
  it("saves once with the latest values, 1s after the last edit", async () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { rerender } = mount(save);

    rerender({ values: { title: "Gro", body: "" }, save });
    act(() => vi.advanceTimersByTime(600));
    rerender({ values: { title: "Groceries", body: "" }, save });
    act(() => vi.advanceTimersByTime(999));
    expect(save).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(1));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: "Groceries", body: "" });
  });

  it("saves at once on flush and cancels the timer, so an edit is not saved twice", async () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { result, rerender } = mount(save);

    rerender({ values: { title: "Groceries", body: "" }, save });
    await act(async () => result.current.flush());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: "Groceries", body: "" });

    await act(async () => vi.advanceTimersByTime(5000));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not save a note that was never edited", async () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { result } = mount(save, { title: "Groceries", body: "milk" });

    await act(async () => vi.advanceTimersByTime(5000));
    await act(async () => result.current.flush());

    expect(save).not.toHaveBeenCalled();
  });

  it("does not save again on flush when nothing changed since the last save", async () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { result, rerender } = mount(save);

    rerender({ values: { title: "Groceries", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => result.current.flush());
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not save an edit that was typed and then undone", async () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { result, rerender } = mount(save, { title: "Groceries", body: "" });

    rerender({ values: { title: "Groceries!", body: "" }, save });
    rerender({ values: { title: "Groceries", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => result.current.flush());

    expect(save).not.toHaveBeenCalled();
  });

  it("never runs two saves at once, then sends the latest edit once", async () => {
    // The first save stays open until the test lets it finish.
    let finishFirst!: () => void;
    const save = vi
      .fn<Save>()
      .mockImplementationOnce(
        () => new Promise((resolve) => (finishFirst = () => resolve(SAVED))),
      )
      .mockResolvedValue(SAVED);
    const { rerender } = mount(save);

    rerender({ values: { title: "A", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(save).toHaveBeenCalledTimes(1);

    rerender({ values: { title: "AB", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    rerender({ values: { title: "ABC", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => finishFirst());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ title: "ABC", body: "" });

    await act(async () => vi.advanceTimersByTime(5000));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("reports saving, then saved, then idle after about 2s", async () => {
    let finish!: () => void;
    const save = vi.fn<Save>(
      () => new Promise((resolve) => (finish = () => resolve(SAVED))),
    );
    const { result, rerender } = mount(save);
    expect(result.current.status).toBe("idle");

    rerender({ values: { title: "Groceries", body: "" }, save });
    expect(result.current.status).toBe("idle");

    await act(async () => vi.advanceTimersByTime(1000));
    expect(result.current.status).toBe("saving");

    await act(async () => finish());
    expect(result.current.status).toBe("saved");

    await act(async () => vi.advanceTimersByTime(1999));
    expect(result.current.status).toBe("saved");
    await act(async () => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe("idle");
  });

  it("saves when the tab is hidden, but not when it is shown again", async () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { rerender } = mount(save);

    rerender({ values: { title: "Groceries", body: "" }, save });
    await act(async () => changeTab("visible"));
    expect(save).not.toHaveBeenCalled();

    await act(async () => changeTab("hidden"));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: "Groceries", body: "" });
  });

  it("saves an unsaved edit when it unmounts mid-timer, once", async () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { rerender, unmount } = mount(save);

    rerender({ values: { title: "Groceries", body: "" }, save });
    unmount();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: "Groceries", body: "" });

    await vi.advanceTimersByTimeAsync(5000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("saves nothing and leaves no timer behind when it unmounts untouched", () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { unmount } = mount(save);

    unmount();

    expect(save).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("leaves no timer behind when a save finishes after it unmounted", async () => {
    let finish!: () => void;
    const save = vi.fn<Save>(
      () => new Promise((resolve) => (finish = () => resolve(SAVED))),
    );
    const { rerender, unmount } = mount(save);

    rerender({ values: { title: "Groceries", body: "" }, save });
    unmount();
    await act(async () => finish());

    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["returns a failure", () => Promise.resolve(FAILED)],
    ["throws", () => Promise.reject(new Error("network down"))],
  ])(
    "reports error when save %s, and sends the same values on the next flush",
    async (_case, fail) => {
      const save = vi
        .fn<Save>()
        .mockImplementationOnce(fail)
        .mockResolvedValue(SAVED);
      const { result, rerender } = mount(save);

      rerender({ values: { title: "Groceries", body: "" }, save });
      await act(async () => vi.advanceTimersByTime(1000));
      expect(result.current.status).toBe("error");

      // No retry timer: the values wait for the next edit or flush.
      await act(async () => vi.advanceTimersByTime(10_000));
      expect(save).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe("error");

      await act(async () => result.current.flush());
      expect(save).toHaveBeenCalledTimes(2);
      expect(save).toHaveBeenLastCalledWith({ title: "Groceries", body: "" });
      expect(result.current.status).toBe("saved");
    },
  );

  it("still sends an edit made during a save that then failed", async () => {
    let fail!: () => void;
    const save = vi
      .fn<Save>()
      .mockImplementationOnce(
        () => new Promise((resolve) => (fail = () => resolve(FAILED))),
      )
      .mockResolvedValue(SAVED);
    const { result, rerender } = mount(save);

    rerender({ values: { title: "A", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    rerender({ values: { title: "AB", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));

    await act(async () => fail());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ title: "AB", body: "" });
    expect(result.current.status).toBe("saved");
  });

  it("treats a save that throws before returning as a failed save and keeps saving", async () => {
    const save = vi
      .fn<Save>()
      .mockImplementationOnce(() => {
        throw new Error("no id yet");
      })
      .mockResolvedValue(SAVED);
    const { result, rerender } = mount(save);

    rerender({ values: { title: "Groceries", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(result.current.status).toBe("error");

    await act(async () => result.current.flush());
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("saved");
  });

  it("clears an error once the text is back to what was saved", async () => {
    const save = vi
      .fn<Save>()
      .mockResolvedValueOnce(FAILED)
      .mockResolvedValue(SAVED);
    const { result, rerender } = mount(save, { title: "Groceries", body: "" });

    rerender({ values: { title: "Groceries!", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(result.current.status).toBe("error");

    rerender({ values: { title: "Groceries", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(result.current.status).toBe("idle");
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("keeps the same flush function across renders, so it is safe in effect dependencies", () => {
    const save = vi.fn<Save>().mockResolvedValue(SAVED);
    const { result, rerender } = mount(save);
    const first = result.current.flush;

    rerender({
      values: { title: "Groceries", body: "" },
      save: vi.fn<Save>().mockResolvedValue(SAVED),
    });

    expect(result.current.flush).toBe(first);
  });

  it("calls the newest save, so a caller need not memoize it", async () => {
    const staleSave = vi.fn<Save>().mockResolvedValue(SAVED);
    const newestSave = vi.fn<Save>().mockResolvedValue(SAVED);
    const { rerender } = mount(staleSave);
    const edited = { title: "Groceries", body: "" };

    rerender({ values: edited, save: staleSave });
    act(() => vi.advanceTimersByTime(600));
    rerender({ values: edited, save: newestSave });
    await act(async () => vi.advanceTimersByTime(400));

    expect(newestSave).toHaveBeenCalledTimes(1);
    expect(staleSave).not.toHaveBeenCalled();
  });

  it("sends nothing after a save when the edits made during it were undone", async () => {
    let finish!: () => void;
    const save = vi.fn<Save>(
      () => new Promise((resolve) => (finish = () => resolve(SAVED))),
    );
    const { rerender } = mount(save);

    rerender({ values: { title: "A", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));
    rerender({ values: { title: "AB", body: "" }, save });
    rerender({ values: { title: "A", body: "" }, save });
    await act(async () => vi.advanceTimersByTime(1000));

    await act(async () => finish());
    await act(async () => vi.advanceTimersByTime(5000));
    expect(save).toHaveBeenCalledTimes(1);
  });
});
