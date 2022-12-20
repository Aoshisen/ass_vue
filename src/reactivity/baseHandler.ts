import { track, trigger } from "./effect";
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export const enum reactiveFlags {
  IS_READONLY = "__v_isReadonly",
  IS_REACTIVE = "__v_isReactive",
}

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);
    if (!isReadonly) {
      track(target, key);
    }
    if (key === reactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === reactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(
      `target ${target} is readonly, ${key.toString()} can not be set to ${value}`
    );
    return true;
  },
};