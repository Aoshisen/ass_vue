import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  TO_DISPLAY_STRING,
  helperMapName,
} from "./runtimeHelpers";

export function generator(ast) {
  const context = createCodegenContext();
  const { push } = context;
  const args = ["_ctx", "_cache"];

  genFunctionPreamble(ast, context);

  const functionName = "render";
  const signature = args.join(", ");

  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");
  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "Vue";

  // const helpers=["toDisplayString"]
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length) {
    push(`const {${ast.helpers.map(aliasHelper).join(", ")}}=${VueBinging}`);
  }
  push("\n");
  push("return ");
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpress(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    default:
      break;
  }
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children } = node;
  //联合类型该怎么半
  push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}"), null,`);
  genNode(children, context);
  push(")");
}

function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };
  return context;
}

function genExpress(node: any, context: any) {
  const { push } = context;
  push(`${node.content}`);
  console.log("genExpress>>>>>");
}

function genCompoundExpression(node: any, context: any) {
  const { push } = context;
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    console.log("compoundExpression", child);
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}
// return function render(_ctx,cache){
// return "hi"
// }
