# 更新element 的children 

首先我们得children 有两种类型一种是text 类型一种是array 类型

所以如果讨论所有得情况得话就会有四种情况

- text => text (把文本直接替换掉就行)
- text => array (先把文本清空然后再挂载array 类型得节点)
- array => text (先卸载array 类型的节点 然后再设置父级的textContent)
- array => array (很复杂需要算法来解决)

```javascript
// ArrayToText
import { h, ref } from "../../lib/ass-vue.esm.js";

const nextChildren = "newChildren";
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];
export default {
  name: "ArrayToText",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return { isChange };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};

//App.js
import { h } from "../../lib/ass-vue.esm.js";

import ArrayToText from "./ArrayToText.js";
import TextToText from './TextToText.js'
import TextToArray from "./TextToArray.js";
export const App = {
  name: "App",
  setup() {},
  render() {
    return h("div", { tId: 1 }, [
      h("p", {}, "主页"),
      //老的是Array，新的是text
      // h(ArrayToText),
      //老的是Text 新的是不同的text
      // h(TextToText),
      //老的是text 新的是Array
      h(TextToArray),
      //老的是Array 新的也是Array
      // h(ArrayToArray),
    ]);
  },
};
```

然后我们去render.ts 里面处理相关的逻辑

```typescript
//patchElement 通过patchChildren 处理children 的变化
function patchElement(n1, n2, container,parentComponent) {
    // console.log("patchElement");

    // console.log("n1", n1);

    // console.log("n2", n2);
    const prevProps = n1.props || EMPTY_OBJECT;
    const nextProps = n2.props || EMPTY_OBJECT;
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el,parentComponent);
    patchProps(el, prevProps, nextProps);
  }

  function patchChildren(n1, n2, container,parentComponent) {
    //ArrayToText
    //先删除Array 然后再 添加文本
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const nextShapeFlag = n2.shapeFlag;
    const c2 = n2.children;
    if (nextShapeFlag & shapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & shapeFlags.ARRAY_CHILDREN) {
        //ArrayToText
        //卸载children 元素
        //需要动态的传入unmountChildren 函数

        unMountChildren(n1.children);
      }
      if (c1 !== c2) {
        hostSetElementText(c2, container);
      }
    } else {
      //新的是一个数组类型的节点
      //所以我们需要去判断老的是否为文本节点还是数组
      if (prevShapeFlag & shapeFlags.TEXT_CHILDREN) {
        //删除之前的文本节点，mount 新的child数组
        //这个方法需要动态的传入，customRender
        hostSetElementText("", container);
        mountChildren(c2,container,parentComponent)
      }
    }

    console.log("patchChildren", n1, n2);
  }
  
  //把卸载Children单独拎出来 remove 单独的一个children 应该作为一个渲染方法传递进来，可以动态配置
function unMountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      //remove
      //insert
      hostRemove(el);
    }
  }
  //然后去runtime-dom 里面定义相关的函数
  //runtime-dom/index.ts
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}
//当然设置文本节点的内容也应该是传递进来的渲染方法
function setElementText(text, container) {
  container.textContent = text;
}


```