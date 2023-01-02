# 实现shapeFlags 功能

> 需求场景：vnode 有两个状态，vnode的children也有两个状态，如果每次都去通过是否为string array ，这样来判断的话，不太好，并且难管理

所以统一来处理这个场景

```typescript
export const shapeFlags ={
    element:0,
    status_component:0,
    text_children:0,
    array_children:0
}

//如果有某个属性，那么就把对应的值赋为1 就行了(设置值)
//判断某个值存在否，也很简单，通过 shapeFlags.element 这样就可以(读取值)
```

但是这样的话不够高效，vue3里面是用位运算符来做的这件事

```typescript
//shared/shapeFlags.ts
export const enum shapeFlags {
  ELEMENT = 1, //0001
  STATEFUL_COMPONENT = 1 << 1, //0010
  TEXT_CHILDREN = 1 << 2, //0100
  ARRAY_CHILDREN = 1 << 3, //1000
}
// 这个对象的两个功能是 设置值，读取值

// 我们可以通过 0001|1000 这种方式来设置值 
// 通过 0001 & 0001 这种方式来读取值
```

改造之前我们需要再createVNode 上面去初始化一下shapeFlag属性

```typescript
// runtime-core/vnode.ts
import { shapeFlags } from "../shared/shapeFlags";

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlag: getShapeFlag(type),
  };
  debugger
  // 处理children的flag
  if (typeof children === "string") {
    vnode.shapeFlag |= shapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= shapeFlags.ARRAY_CHILDREN;
  }
  return vnode;
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? shapeFlags.ELEMENT
    : shapeFlags.STATEFUL_COMPONENT;
}


```

然后改造之前我们的判断函数

```typescript
// runtime-core/renderer.ts
function patch(vnode, container) {
  //处理组件
  const { shapeFlag } = vnode;
  if (shapeFlag & shapeFlags.ELEMENT) {
    console.log("element 类型");
    processElement(vnode, container);
  } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
    console.log("component 类型");
    processComponent(vnode, container);
  }
}

function mountElement(vnode, container) {
  //vnode =>element  =>div
  const { type, children, props, shapeFlag } = vnode;
  const el = document.createElement(type);
  vnode.el = el;

  setMountElementAttribute(el, props);

  if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
    //判断是否为 string 就是text类型 ，马上要渲染成text节点了
    container.textContent = children;
  } else if (shapeFlag & shapeFlags.ARRAY_CHILDREN) {
    //还是array类型，需要再通过patch 方法处理
    mountChildren(children, container);
  }
  container.appendChild(el);
  function mountChildren(children, container) {
  children.map((v) => {
    patch(v, container);
  });
}
}
```
