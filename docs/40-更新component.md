# 实现组件更新功能

实现组件更新功能有下面的几个点

- 判断组件是否需要更新
- 更新组件 ，就是调用组件的render函数对组件再次的进行渲染

我们先创建两个组件

App.js

```javascript
import { h, ref, renderSlots } from "../../lib/ass-vue.esm.js";

import Child from "./Child.js";
export const App = {
  name: "App",
  setup() {
    const msg = ref("123");
    const count = ref(1);
    window.msg = msg;
    const changeChildProps = () => {
      msg.value = "245555";
    };
    const changeCount = () => {
      count.value++;
    };
    return { msg, changeChildProps, changeCount, count };
  },
  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h("button", { onClick: this.changeChildProps }, "change child props"),
      h(Child, {
        msg: this.msg,
      }),
      h("button", { onClick: this.changeCount }, "change self count"),
      h("p", {}, "count" + this.count),
    ]);
  },
};
```

 Child.js

 ```javascript
import { h, ref, renderSlots } from "../../lib/ass-vue.esm.js";
const Child = {
  setup() {
    return {};
  },

  render() {
    return h("p", {}, "child-props-msg" + this.msg);
  },
};
export default Child;
 ```

现在出现的情况是我们点击changeChildProps 就会新创建一个节点，该节点就是新的节点

我们反观一下renderer.ts 我们并没有去处理我们的组件更新逻辑

```typescript
function processComponent(n1, n2, container, parentComponent, anchor) {
    //处理组件
    //先去mountComponent
    if(!n1){
      //如果n1不存在那么就是第一次创建 ，那么就先去挂载组件
      mountComponent(n1, n2, container, parentComponent, anchor);
    }else{
      //如果n1存在那么就去更新组件
      updateComponent(n1,n2)
    }
  }
```

我们更新组件就是去调用我们当前组件的render 函数 重新生成新的虚拟节点，然后再进行patch 然后再进行对比

我们可以把effect 返回的 值赋值给component 这个 值并把这个值保存在instance.update 上面

然后我们就可以通过instance.update()这个方法更新组件了

```typescript

//vnode.ts
  const vnode = {
    type,
    props,
    children,
    component:null,
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
  //mountComponent 的时候给initialVNode 的update 函数赋值

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    /*
1. 通过initialVNode 创建组件实例对象
2. 通过组件实例对象来初始化组件(component) 处理props 处理slot 处理当前组件调用setup返回出来的值
3. 创建renderEffect 
*/
    const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container, null);
  }

  //同时我们在updateComponent 里面的逻辑就可以简化了

  function updateComponent(n1, n2) {
    const instance =n2.component=n1.component;
    instance.update();
  }

```

我们在更新 child的时候是获取到的是组件实例上的props 上面的msg所以我们在组件更新的时候也是需要更新组件的props 的

```typescript

//component.ts
export function createComponentInstance(vnode: any, parent) {
  const component = {
    vnode,
    type: vnode.type,
    next:null,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted:false,
    subTree:{},
    emit: (event) => {},
  };
  //这里有点东西的啊,不想传递第一个参数等到emit调用的时候在传递,先把component填充好
  //填充emit的第一个参数

  component.emit = emit.bind(null, component);
  return component;
}
//renderer.ts
function updateComponent(n1, n2) {
    const instance =n2.component=n1.component;
    instance.next=n2
    instance.update();
  }

  function setupRenderEffect(instance, initialVNode, container, anchor) {
    //因为 count 改变的值是一个响应式对象，而我们需要收集到响应式对象改变所触发的依赖
    //所以我们在这里收集依赖
    //这里也是一次渲染逻辑的终点
    instance.update = effect(() => {
      if (!instance.isMounted) {
        console.log("mount");

        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        //subTree 就是虚拟节点树
        /* 
    initialVNode ->patch
    initialVNode -> element  mountElement 
    */
        // patch(vnode,container,parent)
        patch(null, subTree, container, instance, anchor);
        // element=> mount
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        //
        console.log("update");
        //更新组件的props
        //需要一个更新之后的虚拟节点

        const { next, vnode } = instance;

        if (next) {
          vnode.el = next.el;
          updateComponentPreRender(instance, next);
        }

        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        //更新subTree
        instance.subTree = subTree;
        console.log("mounted", prevSubTree);
        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }
  function updateComponentPreRender(instance, nextVNode) {
    instance.vnode=nextVNode;
    instance.next=null;
    instance.props=nextVNode.props
  }
```

但是现在调用count ++ 这个逻辑child 视图也会更新 这个肯定时不对的

思路就是通过props  来判断是否需要更新，如果props 改变了那么就需要更新，如果没有改变就不更新

```typescript
//render.ts
function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    }else{
        //在不需要更新的时候也要把之前的el 赋值给之后的el 并且instance的vnode 也要改变一下

      n2.el=n1.el;
      instance.vnode=n2;
    }
  }
  //componentUpdateUtils.ts

export default function shouldUpdateComponent(n1, n2) {
  const { props: prevProps } = n1;
  const { props: nextProps } = n2;
  for (let key in nextProps) {
    if (prevProps[key]!== nextProps[key]) {
      return true;
    }
  }
  return false;
}
```

> NOTE

- 更新组件的数据 更新组件的props
- 调用组件的render 函数 利用effect 返回的runner 来给instance 上面绑定了一个update 方法来供后面更新的时候调用
- 更新的时候检测一下到底需不需要更新，我们检测了组件的props时候前后一样
