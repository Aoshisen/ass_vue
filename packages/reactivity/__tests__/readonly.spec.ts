import { readonly, isReadonly,isProxy } from "../src/reactive";
import {vi} from "vitest"
describe("readonly", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    //IsReadonly
    expect(isReadonly(wrapped)).toBe(true);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
    expect(isProxy(wrapped)).toBe(true)
  });
  it("warn then call set", () => {
    console.warn = vi.fn();
    const user = readonly({ age: 10 });
    user.age = 11;
    expect(console.warn).toBeCalled();
  });
  it("nested readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    //IsReadonly
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(wrapped.bar)).toBe(true)
  });
});
