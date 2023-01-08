# 更新element 流程搭建

更新流程搭建

```javascript
import { h, ref } from "../../lib/ass-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const onClick = () => count.value++;
    return {
      count,
      onClick,
    };
  },
  render() {
    return h("div", { id: "root" }, [
      h("div", {}, "count:" + this.count),
      h("button", { onClick: this.onClick }, "click me to add 1"),
    ]);
  },
};
```

我希望能 在点击按钮的时候视图能发生变化

1. 我们希望通过this.count 直接拿到ref 的值,可以使用之前我们包装的proxyRefs函数包裹setup 返回的值
2. 我们通过ref 创建了一个响应式对象，那么我们可以通过依赖收集的方式来更新视图
3. 我们需要区分现在是组件初始化阶段还是组件更新阶段
4. 我们判断更新阶段然后拿到之前的节点的数据然后再做其他的事

```typescript
//1.通过 proxy包裹setup返回值实现通过this.count 可以获取到count的值
//component.ts
function handleSetupResult(instance, setupResult) {
  //setup => function || object
  // function => render 函数
  // object=> 注入到组件上下文中
  //TODO: function

  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }
  //保证组件的render是一定有值的
  finishComponentSetup(instance);
}
//通过effect 把渲染逻辑收集下来
//renderer.ts
function setupRenderEffect(instance, initialVNode, container) {
    effect(() => {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        patch( subTree, container, instance);
        initialVNode.el = subTree.el;
 }
 }

//通过instance 挂载isMount属性区分现在是挂载阶段还是更新阶段

  function setupRenderEffect(instance, initialVNode, container) {
    //因为 count 改变的值是一个响应式对象，而我们需要收集到响应式对象改变所触发的依赖
    //所以我们在这里收集依赖
    //这里也是一次渲染逻辑的终点
    effect(() => {
      if (!instance.isMounted) {
        console.log("mount");
        const { proxy } = instance;
        const subTree =   instance.render.call(proxy);
        patch( subTree, container, instance);
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        console.log("update")
      }
    });
  }

  //通过subTree 属性存储当前的subTree 节点树，保存节点树状态

  function setupRenderEffect(instance, initialVNode, container) {
    //因为 count 改变的值是一个响应式对象，而我们需要收集到响应式对象改变所触发的依赖
    //所以我们在这里收集依赖
    //这里也是一次渲染逻辑的终点
    effect(() => {
      if (!instance.isMounted) {
        console.log("mount");
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch( subTree, container, instance);
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTree;
        console.log("mounted", prevSubTree);
        patch( subTree, container, instance);
      }
    });
  }

// 改写patch 方法 通过前后两个vnode 对象的不同来渲染节点
function patch(n1, n2, container, parentComponent) {
    //处理组件
    const { shapeFlag, type } = n2;

    // 需要特殊处理我们的Fragment 类型的
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);

        break;
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & shapeFlags.ELEMENT) {
          // console.log("element 类型");
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
          // console.log("component 类型");
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  //然后处理相关函数调用,然后再在processElement 里面通过传递进来参数来区分是否是更新Element,并抽离出更新Element 的逻辑
function processElement(n1, n2, container, parentComponent) {
    if (!n1) {
      // init
      mountElement(null, n2, container, parentComponent);
    } else {
      //update
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container) {
    console.log("patchElement");

    console.log("n1", n1);

    console.log("n2", n2);
  }
```

简单总结一下，这一章节的流程搭建的难点是 在哪去做依赖 的处理，还好之前我们架构的时候专门弄了一个函数setupRenderEffect 来专门处理所有参数都准备好的时候 处理我们视图的逻辑，这个阶段是从component转化成真实dom的一层也是一个完整流程的最后一个阶段