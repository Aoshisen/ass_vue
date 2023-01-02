# 实现组件props 功能

主要分为这么几点

1. props是通过setup传递过来的
2. setup传递过来的参数能在render里面通过this拿到
3. props不可被修改

```javascript
//Foo.js
import { h } from "../../lib/ass-vue.esm.js";
export const Foo = {
  render() {
    //1.通过setup 传递过来
    //2. 通过setup传递过来的参数能在render里面通过this 拿到，
    //3. 通过props 传递过来的参数不可被修改
    return h("div", {}, "some text in fool" + this.count);
  },
  setup(props) {
    console.log(props);
  },
};

```

## 实现通过setup 传递props 参数

```typescript
//component.ts
import { initProps } from "./componentProps";
export function setupComponent(instance) {
  //TODO:initSlots
  initProps(instance, instance.vnode.props);
  //初始化一个有状态的component (有状态的组件和函数组件函数组件是没有任何状态的)
  setupStatefulComponent(instance);
}
```

做兼容处理如果没有串props 那么就给instance.props 赋值为一个空对象

```typescript
//componentProps.ts
export function initProps(instance,rawProps){
    instance.props=rawProps||{}
}
```

## 实现通过render 里面通过this 拿到count(还是通过之前的代理对象给注入到render的this上)

```typescript
import { hasOwn } from "../shared";

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    //从setupState里面获取值
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    if (key in publicPropertiesMap) {
      const publicGetter = publicPropertiesMap[key];
      return publicGetter(instance);
    }
  },
};
```

改写createReactiveObject

```typescript
function createReactiveObject(target, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`target ${target} 必须是一个对象`);
    return target;
  } else {
    return new Proxy(target, baseHandlers);
  }
}
```

## 实现props 不可被修改

```typescript
//component.ts
export function setupComponent(instance) {
  //TODO:initSlots
  initProps(instance, instance.vnode.props);
  //初始化一个有状态的component (有状态的组件和函数组件函数组件是没有任何状态的)
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  //在最开始的时候很简单，去调用setup 拿到setup的返回值就可以了
  const Component = instance.type;
  const { setup } = Component;

  //ctx

  const proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  instance.proxy = proxy;

  if (setup) {
    //实现传递进去的props 不可被修改
    const setupResult = setup(shallowReadonly(instance.props));
    handleSetupResult(instance, setupResult);
  }
}
```
