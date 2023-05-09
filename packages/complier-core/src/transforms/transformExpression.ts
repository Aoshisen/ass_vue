// ok
import { NodeTypes } from "../ast";

export function transformExpression(node) {
  //复合类型节点不会进来
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

function processExpression(node) {
  node.content = `_ctx.${node.content}` ;
  return node;
}
