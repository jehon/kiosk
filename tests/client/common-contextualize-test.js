import ctxFactory from "../../client/contextualize.js";

import { fn } from "./helper-main.js";

describe(fn(import.meta.url), () => {
  it("should contextualize relative keys", () => {
    const ctx = ctxFactory("test");

    expect(ctx(".brol")).toBe("test.brol");
    expect(ctx("brol")).toBe("brol");

    expect(ctx(".")).toBe("test");
    expect(ctx()).toBe("test");
  });

  // it('should contextualize functions', () => {
  // 	// The base function
  // 	let key = [];
  // 	const fn = (...args) => { key = args; return 123; };

  // 	// The contextualizing function
  // 	const cfn = api.ctxForFunction('test');

  // 	// The contextualized function
  // 	const fnctx = cfn(fn);

  // 	let res = fnctx('.key', 'a1', 'a2');
  // 	expect(res).toBe(123);
  // 	expect(key[0]).toBe('test.key');
  // 	expect(key[1]).toBe('a1');
  // 	expect(key[2]).toBe('a2');
  // });
});
