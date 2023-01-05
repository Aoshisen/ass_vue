# 实现Fragment 和Text 类型组件渲染

## 实现Fragment 组件渲染逻辑

1. 判断当前需要渲染的是Fragment，我们之前渲染插槽的时候是去新创建的一个div ，那么节点渲染就会多一层div
2. 渲染Fragment 就是直接渲染vnode的children
3. 我们需要给创建给创建Fragment 的 事件做一个特殊处理

```typescript
//在render slots 的时候去处理一下这个特殊的类型，然后我们去改写一下渲染vnode的逻辑，让渲染的时候特殊处理一下这个Fragment类型的vnode
import { createVNode, Fragment,  } from "../vnode";

export function renderSlots(slots, key, props) {
  const slot = slots[key];
  if (slot) {
    if (typeof slot === "function") {
      return createVNode(Fragment, {}, slot(props));
    }
  }
}
//vnode.ts
//改写patch 方法判断当前的虚拟节点的类型是否为Fragment 或者其他特殊类型，如果是就特殊处理一下
function patch(vnode, container) {
  //处理组件
  const { shapeFlag, type } = vnode;

  // 需要特殊处理我们的Fragment 类型的
  switch (type) {
    case Fragment:
      processFragment(vnode, container);

      break;
    default:
      if (shapeFlag & shapeFlags.ELEMENT) {
        // console.log("element 类型");
        processElement(vnode, container);
      } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
        // console.log("component 类型");
        processComponent(vnode, container);
      }
      break;
  }
}

//然后再实现一下ProcessFragment 的逻辑,实际上我们只需要去去渲染Fragment类型vnode的children，而不需要使用div去包裹就行了，而我们之前就封装了mountChildren的方法，这个时候就可以拿来使用一下

function processFragment(vnode, container) {
  mountChildren(vnode.children, container);
}

//现在这样应该就可以渲染了

```

## 渲染Text类型组件

我们现在如果要在视图上渲染一个Text类型的组件的话，是不行的,我想的是直接传递参数到h的最后一个参数上面，然后再去判断最后一个参数是不是为一个string类型的就行了，但是官方的实现不一样，他是单独把这个抽离成为了一个函数createTextVNode,然后再通过h去渲染

这个功能虽然简单但是还是要过一下我们这个流程

1. 基于text 创建虚拟节点
2. 然后patch 会基于这个vnode的类型进行对应的处理
3. 处理Text节点
4. document.createTextNode 来创建textNode节点 而节点的内容是vnode的children 属性
5. 处理传递下来的vnode 对象，把创建好的节点挂载到vnode.el 上面

```typescript
// 1. 基于text 创建虚拟节点
import { h, createTextVNode } from "../../lib/ass-vue.esm.js";
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
        header: ({ age }) => [
          h("p", {}, "header" + age),
          createTextVNode("你好呀"),
        ],
        footer: () => h("p", {}, "footer"),
      }
    );

    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};

//patch 处理Text节点
function patch(vnode, container) {
  //处理组件
  const { shapeFlag, type } = vnode;

  // 需要特殊处理我们的Fragment 类型的
  switch (type) {
    case Fragment:
      processFragment(vnode, container);

      break;
    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & shapeFlags.ELEMENT) {
        // console.log("element 类型");
        processElement(vnode, container);
      } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
        // console.log("component 类型");
        processComponent(vnode, container);
      }
      break;
  }
}
//实现对应的processText方法
//实现创建真实textNode节点，实现把创建好的el属性挂载到虚拟节点的el属性下
function processText(vnode, container) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}
```
