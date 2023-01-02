import { isObject } from "../shared";
import {
  mutableHandlers,
  reactiveFlags,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandler";

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`target ${target} 必须是一个对象`);
    return target;
  } else {
    return new Proxy(target, baseHandlers);
  }
}

export const isReadonly = (value: any) => {
  return !!value[reactiveFlags.IS_READONLY];
};

export const isReactive = (value: any) => {
  return !!value[reactiveFlags.IS_REACTIVE];
};

export const isProxy = (value: any) => {
  return isReactive(value) || isReadonly(value);
};
