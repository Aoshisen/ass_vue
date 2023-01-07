import { createRender } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, val) {
  const isOn = (eventName: string) => /^on[A-Z]/.test(eventName);
  if (isOn(key)) {
    const eventName = key.slice(2).toLocaleLowerCase();
    el.addEventListener(eventName, val);
  } else {
    const _val = Array.isArray(val) ? val.join(" ") : val;
    el.setAttribute(key, _val);
  }
}

function insert(el, container) {
  return container.append(el);
}

const renderer: any = createRender({
  createElement,
  patchProp,
  insert,
});

//通过createApp 把dom 创建元素的方法默认传递给createApp
export function createApp(...args) {
  return renderer.createApp(...args);
}

//如果要自定义渲染函数的话那么还需要通过createRender 然后再通过renderer.createApp() 创建元素
export * from "../runtime-core"