import { track, trigger } from "./effect";
const get = createGetter();
const set = createSetter();
const readonlyGet=createGetter(true)

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);
    track(target, key);
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
  get:readonlyGet,
  set(target, key, value) {
    console.warn(
      `target ${target} is readonly, ${key.toString()} can not be set to ${value}`
    );
    return true;
  },
};
