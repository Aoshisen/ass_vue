# 实现自定义渲染器 custom render

其实实现自定义渲染器没有什么很niubility的 还是下面三个流程

1. 创建节点
2. 给节点添加属性以及事件
3. 将创建好的节点放在视图上面

我们之前的渲染逻辑都是在mountElement 函数里面处理的

我们可以把这三个处理函数单独拎出来


```typescript
//使得 mountElement 不依赖固定的实现而是依赖稳定的接口，稳定的接口 函数可以由上层传递过来
  function mountElement(vnode, container, parentComponent) {
    //vnode =>element  =>div
    const { type, children, props, shapeFlag } = vnode;
    //创建节点  new Element
    // const el = document.createElement(type);
    const el = createElement(type);
    vnode.el = el;

    //设置节点属性   canvas el.x=10

    for (const key in props) {
      const attributeValue = props[key];
      patchProp(el, key, attributeValue);
      // const isOn = (eventName: string) => /^on[A-Z]/.test(eventName);
      // if (isOn(key)) {
      //   const eventName = key.slice(2).toLocaleLowerCase();
      //   el.addEventListener(eventName, attributeValue);
      // } else {
      //   const _attributeValue = Array.isArray(attributeValue)
      //     ? attributeValue.join(" ")
      //     : attributeValue;
      //   el.setAttribute(key, _attributeValue);
      // }
    }

    if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
      // console.log("text");

      el.textContent = children;
    } else if (shapeFlag & shapeFlags.ARRAY_CHILDREN) {
      // console.log("array");
      mountChildren(children, el, parentComponent);
    }

    // 添加节点 canvas container.addChild(el)

    // container.appendChild(el);
    insert(el, container);
  }

```

我们根据不同的渲染平台把上面的三个渲染逻辑抽离出来,我们通过参数的方式传递进来

把整个render.ts 的逻辑包裹起来，然后命名为createRender 

然后我们把需要的三个主要的处理函数解构出来

像下面一样 (然后就可以在mountElement 函数中调用自定义的 渲染函数了)

```typescript
export function createRender(options) {
  const { createElement, patchProp, insert } = options;
}

```

然后我们把浏览器的渲染逻辑提取出来单独处理一下

``` typescript
function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, val) {
  const isOn = (eventName: string) => /^on[A-Z]/.test(eventName);
  if (isOn(key)) {
    const eventName = key.slice(2).toLocaleLowerCase();
    el.addEventListener(eventName, val);
  } else {
    const _val = Array.isArray(val) ? val.join(" ") : val;
    el.setAttribute(key, _val);
  }
}

function insert(el, container) {
  return container.append(el);
}

const renderer: any = createRender({
  createElement,
  patchProp,
  insert,
});

```

但是现在我们createApp 需要返回一个 render 函数 但是我们现在的render.ts 没有导出render 这个方法，我们可以改造一下createApp 我们规定这个render 函数通过函数传递进去

```typescript
import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        const vNode = createVNode(rootComponent);
        render(vNode, rootContainer);
      },
    };
  };
}

```
然后我们在render.ts里面创建render 的时候返回一个createApp 里面就像调用createAppAPI 创建一个createApp函数

```typescript
  return {
    createApp: createAppAPI(render),
  };
```

然后再runtime-dom 里面就可以这样干

```typescript
//通过createRender 创建的 render 里面包含的 createApp 函数 ，是通过 createAppAPI 创建出来的（通过当前作用域下的render）
const renderer: any = createRender({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  //然后在这里导出createApp 这个api 
  return renderer.createApp(...args);
}
```

然后对文件的导出做一下调整
因为runtime-dom 是在runtime-core 上层
所以因该由runtime-dom 来主导runtime-core 的导出

```typescript
// ass-vue 的出口文件
//src/index.ts
export * from "./runtime-dom";

//src/runtime-dom
import { createRender } from "../runtime-core";
export function createApp(...args) {

  return renderer.createApp(...args);
}


export * from "../runtime-core"
```

然后在runtime-core 里面 createRender 代替了之前的render 方法

```typescript
export { h } from "./h";

export { renderSlots } from "./helpers/renderSlots";

export { createTextVNode } from "./vnode";

export { getCurrentInstance } from "./component";

export { provide, inject } from "./apiInject";

export { createRender } from "./renderer";
```


## 通过实例来演示一下这个自定义渲染器如何使用


```javascript
//index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
  <script src="https://pixijs.download/release/pixi.js"></script>
  <script src="main.js" type="module"></script>
</html>
//main.js
//通过pixijs 创建canvas 画布

import { createRender } from "../../lib/ass-vue.esm.js";
import { App } from "./App.js";
console.log(PIXI);

//创建实例对象
const game = new PIXI.Application({
  width: 500,
  height: 500,
});

//页面上添加画布
document.body.appendChild(game.view);

//自定义创建节点元素的方法
const createElement = (type) => {
  if (type === "rect") {
    const rect = new PIXI.Graphics();
    rect.beginFill(0xff0000);
    rect.drawRect(0, 0, 100, 100);
    rect.endFill();
    return rect;
  }
};

//自定义处理props 的方法
const patchProp = (el, key, val) => {
  el[key] = val;
};

//自定义插入节点到父级的方法
const insert = (el, parent) => {
  parent.addChild(el);
};

const renderer = createRender({
  createElement,
  patchProp,
  insert,
});

renderer.createApp(App).mount(game.stage);
//App 里面的写法
import { h } from "../../lib/ass-vue.esm.js";
export const App = {
  setup() {
    return {
      x: 100,
      y: 100,
    };
  },
  render() {
    //这里指定的rect(type) 会被传递到createElement 里面去进行处理
    return h("rect", { x: this.x, y: this.y });
  },
};
```