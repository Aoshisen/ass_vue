# 实现解析element 类型

逻辑还是和之前的处理插值类型一样的

- 先判断什么情况下需要解析我们的element类型(开始标志为左尖括号的 时候需要解析我们的element类型“<”)

  ```typescript
    if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    //解析<div></div>
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }
  ```

- 我们需要知道这个element到底是什么类型的element ，通过正则匹配找到这个tag，
  
  ```typescript
    const reg = new RegExp(/^<([a-z]*)/i);
    const match: any = reg.exec(context.source);
    const tag = match[1];
  ```

- 推进我们已经处理完的字符串 
  
  ```typescript

  advanceBy(context, match[0].length);
  //删除我们的左边的右边的闭合尖括号
  advanceBy(context, 1);
  ```

- 然后如果是结束标识的话就直接返回

```typescript

  if (type === TagType.End) return;

//如果不是结束标识的话就返回对应解析出来的tag
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
```

