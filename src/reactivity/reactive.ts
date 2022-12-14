import { mutableHandlers, readonlyHandlers } from "./baseHandler";

export function reactive(raw) {
  return createActionObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActionObject(raw, readonlyHandlers);
}

function createActionObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
