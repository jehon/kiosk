import Callback from "../../common/callback.js";

import { fn } from "./helper-main.js";

describe(fn(import.meta.url), () => {
  it("should fire when on change", function () {
    const cb = new Callback();
    let i = 0;

    cb.onChange((value) => {
      expect(value).not.toBeUndefined();
      i += value;
    });

    cb.emit(10);
    cb.emit(100);

    expect(i).toBe(110);
  });

  it("should fire history", function () {
    const cb = new Callback();
    let i = 0;

    cb.emit(10);
    cb.onChange((value) => {
      expect(value).not.toBeUndefined();
      i += value ?? 0;
    });

    expect(i).toBe(10);
  });

  it("should fire initial value", function () {
    const cb = new Callback(10);
    let i = 0;

    cb.onChange((value) => {
      expect(value).not.toBeUndefined();
      i += value ?? 0;
    });

    cb.emit(100);

    expect(i).toBe(110);
  });

  it("should unsubscribe", function () {
    const cb = new Callback();
    let i = 0;

    let stop = cb.onChange((value) => {
      expect(value).not.toBeUndefined();
      i += value ?? 0;
    });

    cb.emit(10);
    stop();
    cb.emit(100);

    expect(i).toBe(10);
  });

  it("should handle onChangeWeakRef", function () {
    const cb = new Callback();
    let i = 0;

    let stop = cb.onChangeWeakRef((value) => {
      expect(value).not.toBeUndefined();
      i += value ?? 0;
    });

    cb.emit(10);
    stop();
    cb.emit(100);

    expect(i).toBe(10);
  });
});
