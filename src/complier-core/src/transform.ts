import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root: any, options: any={}) {
  const context = createTransformContext(root, options);
  travelNode(root, context);
  createRootCodegen(root);
  root.helpers=[...context.helpers.keys()]
}

//rootCodegen Node for codegen
function createRootCodegen(root:any){
  root.codegenNode=root.children[0]
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers:new Map(),
    helper(key){
      context.helpers.set(key,1)
    }
  };
  return context;
}

function travelNode(node: any, context) {
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const nodeTransform = nodeTransforms[i];
    nodeTransform(node,context);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break;
      case NodeTypes.ELEMENT:
      case NodeTypes.ROOT:
        travelChildren(node,context);
      break;
    default:
      break;
  }

}

function travelChildren(node: any, context: any) {
  const children = node.children;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      travelNode(node, context);
    }
}
