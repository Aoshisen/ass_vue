export * from "./toDisplayString"
export const extend = Object.assign;
export const EMPTY_OBJECT ={}

export function isObject(val) {
  return val !== null && typeof val === "object";
}

export function isString(val){
  return typeof val==="string";
}

export function hasChanged(value, newValue) {
  return !Object.is(newValue, value);
}

export function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

//emit function
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};

//add-foo -addFoo
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};
