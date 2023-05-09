import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

//传入nodeTransform 属性到options 里面，就会执行transform 然后改造我们的node
export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options);
  travelNode(root, context);
  createRootCodegen(root, context);
  root.helpers = [...context.helpers.keys()];
}

//rootCodegen Node for codegen
function createRootCodegen(root: any, context) {
  const { children } = root;
  const child = children[0];
  if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
    const codegenNode = child.codegenNode;
    root.codegenNode = codegenNode;
  } else {
    root.codegenNode = child;
  }
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function travelNode(node: any, context) {
  // console.log("travelNode>>>>>>>>>>>",node);
  //因为调用的时候会去改变我们的text 类型的结构，变成我们的复合类型，所以我们设计一下，先把我们的 复合类型函数收集起来，然后等我们的text 节点类型处理完成之后然后再去处理复合类型的函数

  const exitFn: any = [];

  const nodeTransforms = context.nodeTransforms;

  for (let i = 0; i < nodeTransforms.length; i++) {
    const nodeTransform = nodeTransforms[i];
    const onExit = nodeTransform(node, context);
    if (onExit) {
      exitFn.push(onExit);
    }
  }
  // console.log("travelNode>>>>end",node)
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      travelChildren(node, context);
      break;
    default:
      break;
  }

  //这里的设计非常巧妙，刚开始的时候我们的i是length ，然后循环一次i减少1，然后我们如果到0的时候也不会越界；
  let i = exitFn.length;
  while (i--) {
    exitFn[i]();
  }
}

function travelChildren(parent: any, context: any) {
  parent.children.forEach((node) => {
    travelNode(node, context);
  });
}
