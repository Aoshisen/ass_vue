# 实现slots 功能

首先我们需要创建两个文件来测试我们的代码

```javascript
//App.js
import { h } from "../../lib/ass-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    //我们希望在foo 这里传递h 的第三个参数，能被Foo 接收到并且渲染到children里面
    const foo = h(Foo, {}, h("div", {}, "children slots"));

    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};

//Foo.js

import { h } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    //我想在这里获取到传递过来的children 然后把他渲染到 当前children里面
    console.log(this.$slots);
    return h("div", {}, [foo,this.$slots]);
  },
};

```

然后我们来实现对应的功能

1. 在component的实例上绑定我们的slots 属性
2. 然后在initSlots 阶段把slots 绑定在instance 的$slots 上面
3. 通过render 的this.slots能拿到传递过来的slots

```typescript

//在createComponentInstance 阶段挂载slots属性 component.ts
export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: (event) => {},
  };
  //这里有点东西的啊,不想传递第一个参数等到emit调用的时候在传递,先把component填充好
  //填充emit的第一个参数
  component.emit = emit.bind(null, component);
  return component;
}
//在initSlot 阶段 挂载instance.$slot 属性
//componentSlots.ts
export function initSlots(instance, children) {
  instance.slots = children;

}
//在publicPropertiesMap里卖挂载$slots 属性

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance) => instance.slots,
};
```

## 如果插槽是一个数组的话

1. 如果插槽是一个数组的话，传递是没有问题的，但是渲染会有一点问题，就是说，传递过去的是一个没有经过处理的对象,而我们需要的是一个虚拟节点
2. 在slots 初始化的时候就把它初始化为一个数组的形式
3. 在render的时候通过renderSlots 工具函数来处理slots

```typescript
//保证页面正常显示
import { h, renderSlots } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    console.log(this.$slots);
    return h("div", {}, [foo, h("div",{},this.$slots)]);
  },
};

//初始化的时候就把slots 初始化为数组
//componentSlots
export function initSlots(instance, children) {
  instance.slots = Array.isArray(children) ? children : [children];
}
// 抽离工具函数renderSlots.ts
//runtime-core/helpers/renderSlots.ts
import { createVNode } from "../vnode";

export function renderSlots(slots) {
  return createVNode("div", {}, slots);
}
//改写Foo组件渲染函数
import { h, renderSlots } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    console.log(this.$slots);
    return h("div", {}, [foo, renderSlots(this.$slots)]);
  },
};
```

## 如果插槽可以指定位置的话

我们把这个问题简单化一下

1. 需要指定插槽的位置，并且指定插槽渲染的节点
2. 需要在对应的地方渲染指定的 节点

```typescript
//改写初始数据结构为对象形式
//App.js
import { h } from "../../lib/ass-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    //我们希望在foo 这里传递h 的第三个参数，能被Foo 接收到并且渲染到children里面
    const foo = h(
      Foo,
      {},
      {
        header: h("div", {}, "header"),
        footer: h("div", {}, "footer"),
      }
    );

    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};

//改写初始化slots 逻辑
// componentSlot.ts

export function initSlots(instance, childrenObject) {
  //   instance.slots = Array.isArray(children) ? children : [children];
  const slots = {};
  for (const key in childrenObject) {
    const slot = childrenObject[key];
    slots[key] = Array.isArray(slot) ? slot : [slot];
  }
  instance.slots = slots;
}
//改写renderSlots 函数
//renderSlot.ts
import { createVNode } from "../vnode";

export function renderSlots(slots, key) {
  return createVNode("div", {}, slots[key]);
}


//在对应的位置渲染指定的节点
//改写Foo.js

//componentSlots/Foo.js
import { h, renderSlots } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    console.log(this.$slots);
    // 1.获取到要渲染的节点
    // 2.获取到要渲染的位置
    return h("div", {}, [
      renderSlots(this.$slots, "header"),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
```

## 如果需要传递参数的话

1. 传递参数
2. 接收参数
3. 改变initSlots 初始值
4. 细节处理

```javascript
//变成函数调用的形式
//App.js
import { h } from "../../lib/ass-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    //我们希望在foo 这里传递h 的第三个参数，能被Foo 接收到并且渲染到children里面
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => h("div", {}, "header" + age),
        footer: () => h("div", {}, "footer"),
      }
    );

    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};

//Foo.js
//传递函数的props
import { h, renderSlots } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    console.log(this.$slots);
    // 1.获取到要渲染的节点
    // 2.获取到要渲染的位置
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age: 10000 }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};

```

具体的代码实现

```typescript
//在renderSlots的时候传递参数进去
//renderSlots.ts
import { createVNode } from "../vnode";

export function renderSlots(slots, key, props) {
  const slot = slots[key];
  if (slot) {
    if (typeof slot == "function") {
      return createVNode("div", {}, slot(props));
    }
  }
}


//components.ts
//initSlots 的时候变成函数调用的形式
function normalizeSlotObject(slots, childrenObject) {
  for (const key in childrenObject) {
    const slot = childrenObject[key];
    slots[key] = (props) => normalizeSlotValue(slot(props));
  }
}
```

## 优化代码

给有slots 的component加上flag

```typescript
//定义slot_ children 类型
export const enum shapeFlags {
  ELEMENT = 1, //0001
  STATEFUL_COMPONENT = 1 << 1, //0010
  TEXT_CHILDREN = 1 << 2, //0100
  ARRAY_CHILDREN = 1 << 3, //1000
  SLOT_CHILDREN = 1 << 4,
}
```

```typescript
import { shapeFlags } from "../shared/shapeFlags";

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlag: getShapeFlag(type),
  };
  // 处理children的flag
  if (typeof children === "string") {
    vnode.shapeFlag |= shapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= shapeFlags.ARRAY_CHILDREN;
  }
 //处理slots 的flog
  if (vnode.shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= shapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? shapeFlags.ELEMENT
    : shapeFlags.STATEFUL_COMPONENT;
}
```

优化componentSlots 函数

```typescript
import { shapeFlags } from "../shared/shapeFlags";

export function initSlots(instance, childrenObject) {
  const { vnode } = instance;
  if (vnode.shapeFlag & shapeFlags.SLOT_CHILDREN) {
    normalizeSlotObject(instance.slots, childrenObject);
  }
}
```
