# 实现provide 和inject 功能

[provide 官方文档](https://vuejs.org/api/application.html#app-provide)
我们在根组件里面定义的一些属性可以传递到所有的子组件上面 通过provide 函数实现数据的注入
通过inject 函数拿到我们注入的数据

创建apiInject.ts 来存放我们的代码逻辑

1. 首先我们需要明白我们的inject 和provide函数都是在setup阶段被调用的，然后得到的值通过return这种方式注入到当前组件的实例对象上，然后我们在render的时候就可以通过this 拿到对应的返回值
2. 通过instance 上面的provides 来存储我们的通过provide函数创建的值
3. 获取当前的组件实例对象，然后对其进行操作
4， 调用inject的时候返回父级对象实例的provides

```javascript
import { h, provide, inject } from "../../lib/ass-vue.esm.js";
const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal"), provide("bar", "barVal");
    const foo = inject("foo");
    return { foo };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `provider foo:${this.foo}`),
      h(ProviderTwo),
    ]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    return { foo, bar };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}`);
  },
};
export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};
```

```typescript
//apiInject.ts
import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存数据
  let currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    provides[key] = value;
  }
}
export function inject(key, defaultValue) {
  //取数据
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
      return parentProvides[key];
   }
  }
}
```

在创建实例对象的时候去创建一个parent属性，当然parent属性需要上一个函数传递下来，所以需要改写这个函数
然后再在所有调用这个函数的地方做给更改，

```typescript
//component.ts

export function createComponentInstance(vnode: any, parent) {
  console.log("parent", parent);
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides:  {},
    parent,
    emit: (event) => {},
  };
  //这里有点东西的啊,不想传递第一个参数等到emit调用的时候在传递,先把component填充好
  //填充emit的第一个参数
  console.log(component, component.provides);

  component.emit = emit.bind(null, component);
  return component;
}

//直到这里，我们的instance就是我们的父节点
function setupRenderEffect(instance, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  //subTree 就是虚拟节点树
  /* 
    initialVNode ->patch
    initialVNode -> element  mountElement 
    */
  patch(subTree, container, instance);
  // element=> mount
  initialVNode.el = subTree.el;
}

```

现在我们的逻辑一层的逻辑传递应该就可以跑通了

```javascript
import { h, provide, inject } from "../../lib/ass-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal"), provide("bar", "barVal");
    const foo = inject("foo");
    return { foo };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `provider foo:${this.foo}`),
      h(ProviderTwo),
    ]);
  },
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    const foo=inject("foo")
  },
  render() {
    return h("div", {}, [h("p", {}, `providerTwo-${this.foo}`), h(Consumer)]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    // const baz=inject("baz","bazDefault")
    const baz = inject("baz", () => {
      return "ass";
    });
    return { foo, bar, baz };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}`);
  },
};

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};
```

这个时候显然是不行的

```typescript
// 我们需要把当前的currentInstance的provides 指定为parent的provides 
export function createComponentInstance(vnode: any, parent) {
  console.log("parent", parent);
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides:  {},
    parent,
    emit: (event) => {},
  };
  //这里有点东西的啊,不想传递第一个参数等到emit调用的时候在传递,先把component填充好
  //填充emit的第一个参数
  console.log(component, component.provides);

  component.emit = emit.bind(null, component);
  return component;
}
```

然后我们再增加难度我们在第二层的时候去provide 一个值然后我们再去获取一下第二层的一个数据，我们来看看到底啥情况

```javascript
import { h, provide, inject } from "../../lib/ass-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal"), provide("bar", "barVal");
    const foo = inject("foo");
    return { foo };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `provider foo:${this.foo}`),
      h(ProviderTwo),
    ]);
  },
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooTwo Val");
    const foo = inject("foo");
    return { foo };
  },
  render() {
    return h("div", {}, [h("p", {}, `providerTwo-${this.foo}`), h(Consumer)]);
  },
};
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    return { foo, bar };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}`);
  },
};

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};

```

这个时候我们看到我们的providerTwo和consumer的foo 都显示为fooTwo val

我们来分析一下，我们都是改变的provides 的引用.我们需要在provide 改变的时候去处理,改变了引用的值所有的地方的渲染都会是最后改变的那个值

我们明确一下需求

1. 我们需要我们子组件获取到我们在当前provide 的对象，以及之前之前父级provide的对象,如果在当前组件获取
2. 如果在当前阶段获取那么拿到的是parent 的属性值
3. 如果在当前组件provide了和parent里面的key相同但内容不同的值，在当前获取的是之前parent所提供的值，但是后代子节点获取到的就是我们当前组件provide的值

我们通过原型链的方式继承下来

改写provide方法

***核心逻辑***:判断init 阶段以及原型链继承

```typescript
export function provide(key, value) {
  // 存数据
  let currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    let parentProvides = currentInstance.parent.provides;


    //原型链对接核心代码，核心判断，是否为初始化，初始化的时候provides 和parentProvides 相等
    //初始化过后provides 改变成了继承自parentProvides 的节点
    //核心逻辑
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    // init
    provides[key] = value;
  }
}

```

考虑功能扩展

1. inject 配置默认值

```javascript
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz=inject("baz","bazDefault")
    return { foo, bar, baz };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}-${this.baz}`);
  },
};

```

改写inject函数支持默认值

```typescript
export function inject(key, defaultValue) {
  //取数据
  //取父级组件的instance的providers
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
        return defaultValue();
      }
    }
  }
}
```

2. inject 也可以支持函数

```javascript
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz = inject("baz", () => {
      return "ass";
    });
    return { foo, bar, baz };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}-${this.baz}`);
  },
};


```

再次改写inject函数

```typescript
export function inject(key, defaultValue) {
  //取数据
  //取父级组件的instance的providers
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      } else if (typeof defaultValue === "string") {
        return defaultValue;
      }
    }
  }
}
```