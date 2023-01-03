# 实现组件emit 功能

> 需求场景需要 在组件里面setup的时候调用emit方法然后在 组件render的时候去调用对应的方法

下面以示例代码做个演示

```typescript

//Foo.js
setup(props,{emit}) {
    //通过 setup 的第二个参数 处理emit

    const emitAdd = () => {
      emit("add",1,2)
      emit("add-foo")
      console.log("emit add");
    };
    return { emitAdd };
  },
//App.js
 render() {
    //ui  逻辑
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red"],
      },
      [
        h("p", { class: "red" }, "hi red"),
        h(Foo, {
          count: 1,
          onAdd(a, b) {
            console.log("on add in app js", a, b);
          },
          onAddFoo(){
            console.log("on Add foo in app js")
          }
        }),
      ]
    );
  },
```

我们之前已经实现了通过setup返回值参数挂载到instance 实例上，所以instance 上面可以调用 emitAdd 方法
所以我们在渲染button的时候给他加上点击事件事件的名称就为this.emitAdd

然后我们把emit声明在instance上面,然后再在setup的时候传递这个emit给setup

```typescript
//component.ts
export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: (event) => {},
  };
  //这里有点东西的啊,不想传递第一个参数等到emit调用的时候在传递,先把component填充好
  component.emit = emit.bind(null,component);
  return component;
}
//
function setupStatefulComponent(instance) {
  //在最开始的时候很简单，去调用setup 拿到setup的返回值就可以了
  const Component = instance.type;
  const { setup } = Component;

  //ctx

  const proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  instance.proxy = proxy;

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
        //传递emit给setup
      emit: instance.emit,
    });
    handleSetupResult(instance, setupResult);
  }
}
```

然后我们再创建一个文件实现emit方法

```typescript
//componentEmit
export function emit(instance,event){
 import { camelize, toHandlerKey } from "../shared";

export function emit(instance, event, ...arg) {
  const { props } = instance;
  //TPP
  // 先去写一个特定的行为然后再重构成一个通用的行为

  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...arg);
}
}

//shared/index.ts
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};
```

这一节课最主要学到的方法是 我只想给emit传递一个event参数，但是emit 这个函数需要两个参数，我可以通过`component.emit = emit.bind(null,component)` 这种方式来传递emit 的第一个参数为component 就是组件实例