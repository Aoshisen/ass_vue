import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";


export default function transformElement (node,context) {
if(node.type=== NodeTypes.ELEMENT){
    context.helper(CREATE_ELEMENT_VNODE)
}
}