# 转化我们的生成的ast 树，以及节点转化过程中引入插件抽离出具体的处理逻辑

## 测试驱动代码

我们先来理一理我们的主要逻辑

> 我希望我得到通过*"<div>hi,{{message}}</div>"*这个 字符串生成的ast树，然后改变ast 里面text 节点的值为 hi,mini-vue

- 把大象放冰箱的第一步 (找到我们的text节点)

- 把大象放冰箱的第二部 (改变我们的text 的值)

通过深度优先的算法来遍历我们的ast树，得到我们的text 节点

```typescript
//深度优先遍历树
export function transform (root){
travelNode(root)
}

function travelNode(node){
    const children=node.children;
    console.log("children")
    if(children){
        for(let i;i<children.length;i++){
            const childNode=children[i];
            travelNode(childNode)
        }
    }
}
```

现在我们还只是遍历了我们的树解构

我们在遍历的时候去找到我们的Text 类型的节点

```typescript
function travelNode(node){
    const children=node.children;
    console.log("children",children)
    if(children.type===NodeTypes.TEXT){
        children.content=children.content+"mini-vue"
    }
    if(children){
        for(let i;i<children.length;i++){
            const childNode=children[i];
            travelNode(childNode)
        }
    }
}
```

现在这个功能就算是实现了，但是。。。
我们的代码处理逻辑是处理死的，我如果以后想要扩展我们的处理逻辑，以及处理其他的的类型的比如tag ，比如插值，不可能也写死在这个transform 函数里面啊，我们在这个transform 方法上面可以支持外部的扩展

比如我把处理text 的逻辑写在外部，然后通过我们的transform 传入对应的配置，然后再transform 里面去拿到对应的处理函数再在我们的travelNode 函数里面执行

```typescript
it("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + "mini-vue";
      }
    };
    //通过插件注入的方法来动态的控制我们的代码执行 (就是我们的处理函数插件化，把写在travelNode 里面的逻辑抽离了出来)
    transform(ast, { nodeTransforms: [plugin] });
    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe("hi,mini-vue");
  });
```

再回到我们的transform 函数里面，改写函数，支持配置扩展

```typescript
export function transform(root: any, options: any) {
  const context = createTransformContext(root, options);

  travelNode(root, context);
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  };
  return context;
}
function travelNode(node,context){
    const children=node.children;
    console.log("children",children)
    //执行我们的transforms 对应定义的插件逻辑，
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const nodeTransform = nodeTransforms[i];
    nodeTransform(node);
  }


    if(children){
        for(let i;i<children.length;i++){
            const childNode=children[i];
            travelNode(childNode)
        }
    }
}

```

代码解构优化，抽离处理children 逻辑到单独函数

```typescript
function travelNode(node: any, context) {
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const nodeTransform = nodeTransforms[i];
    nodeTransform(node);
  }

  travelChildren(node, context);
}
function travelChildren(node: any, context: any) {
  const children = node.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      travelNode(node, context);
    }
  }
}
```

>NOTE:值得注意的几个点

1. 利用深度优先遍历ast 节点树的时候，循环调用函数，(travelNode,和transform 是分开的,利用transform 这个函数做总的逻辑的处理，插件的初始化处理，以及其他)
2. travelNode 的处理函数抽离，抽离到外部传入
3. 递归处理我们的children ，如果children 存在，遍历children，然后循环调用travelNode 来处理children

