# 处理element 类型

处理element 类型还是和处理插值类型一样分三步走

1. 处理我们的函数的参数，
2. 处理我们的函数的主体逻辑
3. 处理我们的tag 标签

```typescript
it.only("element",() => { 
      const ast =baseParse("<div></div>")
      //注入插件的里面
      transform(ast,{nodeTransforms:[transformElement]})
      const {code}=generator(ast)
      expect(code).toMatchSnapshot()
     })
```

```typescript
//处理函数需要导入的函数名
//transformElement
import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";


export default function transformElement (node,context) {
if(node.type=== NodeTypes.ELEMENT){
    context.helper(CREATE_ELEMENT_VNODE)
}
}


```


处理函数的主要逻辑以及我们的tag获取；

````typescript
function genElement(node,context){
  const {push ,helper}=context;
  const {tag}=node
  push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}")`)
}
```

解析element 还是很简单的， 但是不要忘了我们的解析函数名字和别名的操作是通过plugin 这种方式来添加的；
