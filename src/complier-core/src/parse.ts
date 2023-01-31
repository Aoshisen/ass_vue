import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}
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
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    //解析<div></div>
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }
  nodes.push(node);
  return nodes;
}

function parseElement(context) {
  const element = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  console.log(context.source, "=============");
  return element;
}

function parseTag(context, type: TagType) {
  //Implement
  // 1.解析tag
  // 2.删除处理完成的代码
  // 正则匹配
  const reg = new RegExp(/^<([a-z]*)/i);
  const match: any = reg.exec(context.source);
  const tag = match[1];
  // console.log(match,"match<<");
  //推进我们解析后的代码

  advanceBy(context, match[0].length);
  //删除我们的左边的右边的闭合尖括号
  advanceBy(context, 1);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
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
