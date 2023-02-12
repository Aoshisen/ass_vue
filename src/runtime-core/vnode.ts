import { shapeFlags } from "../shared/shapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");
export { createVNode as createElementVNode };
export function createVNode(type, props?, children?) {
  //下面的就是初始的type
  // {
  //   render() {
  //     return h(
  //       "div",
  //       {
  //         id: "root",
  //         class: ["red"],
  //         onClick() {
  //           console.log("this is app div onclick");
  //         },
  //         onMousedown() {
  //           console.log("mouseDown,app");
  //         },
  //       },
  //       [h("p", { class: "red" }, "hi red"), h(Foo, { count: 1 })]
  //     );
  //   },
  //   setup() {
  //     return {
  //       msg: "ass-vue",
  //     };
  //   },
  // };

  const vnode = {
    type,
    props,
    children,
    component: null,
    el: null,
    key: props && props.key,
    shapeFlag: getShapeFlag(type),
  };
  // 处理children的flag
  if (typeof children === "string") {
    vnode.shapeFlag |= shapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= shapeFlags.ARRAY_CHILDREN;
  }

  //现在这个vnode 可以标识element 类型也可标识 stateful_component 类型的组件
  //也可以在vnode上面直接体现children 的类型，是需要即将渲染的text_children 还是需要path继续处理的array-children

  //处理slots 的flog
  if (vnode.shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= shapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

export function createTextVNode(text) {
  return createVNode(Text, {}, text);
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? shapeFlags.ELEMENT
    : shapeFlags.STATEFUL_COMPONENT;
}
