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
  while (!isEnd(context)) {
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
    if (node === undefined) {
      //解析text类型
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function isEnd(context) {
  //当遇到借宿标签的时候就是end
  //当context.source 没有值的时候就是end
  const s = context.source;
  if (s.startsWith("</div>")) {
    return true;
  }
  return !s;
}

function parseElement(context) {
  const element: any = parseTag(context, TagType.Start);
  element.children = parseChildren(context);
  parseTag(context, TagType.End);
  console.log(context.source, "=============");
  return element;
}

//parseTag 有两个作用，如果是以< 开始的，那么就返回我们的tag 以及type,然后推进我们的context

//如果是以结尾，那么就推进context就行了，不用返回什么东西
function parseTag(context, type: TagType) {
  //Implement
  // 1.解析tag
  // 2.删除处理完成的代码
  // 正则匹配

  console.log(context, type, "parseTag<<<<<<<<<");

  const reg = new RegExp(/^<\/?([a-z]*)/i);
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

  console.log(context, "parseInterpolation<<<<<<");
  //剔除掉{{
  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  //得到message  截取得到
  const rawContent = parseTextData(context, rawContentLength);

  const content = rawContent.trim();

  //推进 提出掉 message}}
  console.log("context", context);

  advanceBy(context,  closeDelimiter.length);

  console.log("context>>>>>>>>>>>>>parseInterpolation", context);

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

function parseText(context: any): any {
  //1.获取当前的内容
  //推进字符串
  //判断结束符,遇到结束符号就停止
  let endIndex = context.source.length;
  const endToken = "{{";
  const index = context.source.indexOf(endToken);
  console.log(context, "parseText<<<<<");

  if (index !== -1) {
    endIndex = index;
  }
  console.log("endIndex", endIndex);

  const content = parseTextData(context, endIndex);
  console.log(content, "content----------");
  console.log(context, "end<<<<<<<<<<<<<");
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: any, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, content.length);
  return content;
}
