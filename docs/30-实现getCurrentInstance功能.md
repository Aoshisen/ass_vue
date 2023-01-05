# 实现getCurrentInstance 函数

顾名思义getCurrentInstance 就是获取当前组件对象实例

```javascript
//App.js
import { h, getCurrentInstance } from "../../lib/ass-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  render() {
    return h("div", {}, [h("p", {}, "currentInstance Demo"), h(Foo)]);
  },
  setup() {
    const instance = getCurrentInstance();
    console.log("App:", instance);
  },
};

//Foo.js
import { h,getCurrentInstance } from "../../lib/ass-vue.esm.js";
export const Foo = {
  name: "Foo",
  setup() {
    const instance = getCurrentInstance();
    console.log("Foo:", instance);
    return {};
  },
  render() {
    return h("div", {}, "foo");
  },
};

```

然后我们去对应创建instance 的时候拿到instance 然后返回就行了

1. 去拿到instance实例对象
2. 需要等到实例对象instance上面的属性初始化完成
3. 通过调用getCurrentInstance 返回当前实例对象

```typescript
//在调用instance setup的时候给currentInstance赋值，这样得到的instance 已经经过了初始化props，初始化slots 挂载了proxy 对象 得到的是一个成熟的instance了
function setupStatefulComponent(instance) {
  //在最开始的时候很简单，去调用setup 拿到setup的返回值就可以了
  const Component = instance.type;
  const { setup } = Component;

  //ctx

  const proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  instance.proxy = proxy;

  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult);
  }
}
//定义全局变量存储当前的currentInstance
let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}
```

bingo 就是这么简单
