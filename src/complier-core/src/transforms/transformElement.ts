import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export default function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    context.helper(CREATE_ELEMENT_VNODE);

    //tag
    const vnodeTag = node.tag;

    //props
    let vnodeProps;

    //children
    const children = node.children;

    const vnodeChildren = children[0];

    const vnodeElement = {
      type: NodeTypes.ELEMENT,
      tag: vnodeTag,
      props: vnodeProps,
      children: vnodeChildren,
    };

    node.codegenNode = vnodeElement;
  }
}
