import { NodeTypes, createVNodeCall } from "../ast";

export default function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // context.helper(CREATE_ELEMENT_VNODE);

      //tag
      const vnodeTag = `'${node.tag}'`;

      //props
      let vnodeProps;

      //children
      const children = node.children;

      const vnodeChildren = children[0];

      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    };
  }
}
