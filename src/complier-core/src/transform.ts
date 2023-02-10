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
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const nodeTransform = nodeTransforms[i];
    nodeTransform(node, context);
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
}

function travelChildren(parent: any, context: any) {
  parent.children.forEach((node)=>{
    travelNode(node,context)
  })
}
