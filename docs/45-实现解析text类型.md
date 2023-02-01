# 实现解析text类型

和之前一样

- text 类型是默认的类型，如果不是插值也不是我们的element 类型，那么就默认是text类型
- 思路还是解析我们的context.source 然后返回
- 然后处理完成之后我们再推进我们的context

```typescript
  describe("text", () => {
    test("simple text", () => {
      const ast = baseParse("some text");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "some text",
      });
    });
  });

```

然后我们来实现他

抽离出单独的处理text的函数 parseText


```typescript
function parseText(context: any): any {
  //1.获取当前的内容
  //推进字符串
  const content = parseTextData(context,context.source.length);
  // console.log(context.source,"source");
   return {
        type: NodeTypes.TEXT,
        content,
      }
}

function parseTextData(context: any,length) {
  const content = context.source.slice(0, length);
  advanceBy(context, content.length);
  return content;
}
```

> 解析我们的text类型的应该是最简单的，我们的content就是传递过来的context.source,然后我们推进的距离也是content 的距离，就很舒服

