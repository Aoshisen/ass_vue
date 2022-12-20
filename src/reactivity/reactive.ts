import { mutableHandlers, reactiveFlags, readonlyHandlers } from "./baseHandler";
export function reactive(raw) {
  return createActionObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActionObject(raw, readonlyHandlers);
}

function createActionObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}

export const IsReadonly=(value:any)=>{
  return !!value[reactiveFlags.IS_READONLY]
}

export const IsReactive=(value:any)=>{
  return !!value[reactiveFlags.IS_REACTIVE]
}