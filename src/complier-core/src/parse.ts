import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createContext(content);
  return createRoot(parseChildren(context));
}

function createRoot(children) {
  return { children };
}

function parseChildren(context) {
  const nodes: any = [];
  let node;
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context);
  }
  nodes.push(node);
  return nodes;
}

function parseInterpolation(context) {
  //{{message}}
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  //从{{ 开始找}}
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  //剔除掉{{
  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  //得到message  截取得到
  const rawContent = context.source.slice(0, rawContentLength);

  const content = rawContent.trim();

  //推进 提出掉 message}}
  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createContext(content: string) {
  return {
    source: content,
  };
}
