# element 组件的渲染逻辑

其实渲染实际的 element 并没有那么很高深的样子

```javascript
//创建元素
const el = document.createElement("div");
//为元素设置属性
el.setAttribute("class", "root");
//为元素设置children 等属性
el.textContent = "children here";
//将元素 插入到页面上
document.body.append(el);
```

主流程搞清楚了,我们需要在patch的时候判断一下当前到底是component 还是实际需要渲染出来的实际元素

```typescript
//renderer.ts
function patch(vNode, container) {
  //处理组件
  if (typeof vNode.type === "string") {
    console.log("element 类型");
    processElement(vNode, container);
  } else if (isObject(vNode)) {
    console.log("component 类型");
    processComponent(vNode, container);
  }
}
```

然后我们去实现一下processElement 方法
和processComponent 方法一样先挂载mount一下element

```typescript
//renderer.ts
function mountElement(vNode, container) {
  const { type, children, props } = vNode;
  const el = document.createElement(type);
  setMountElementAttribute(el, props);
  mountChildren(children, el);
  container.appendChild(el);
}
```

正如上面 渲染实际的element 举例那里一样，我们会根据type创建一个element，然后通过setAttribute 设置传递过来的属性props，然后添加children到在我们创建的元素身上，最终我们把这个元素添加到我们的rootContainer身上

```typescript
//renderer.ts
function setMountElementAttribute(el, attributes) {
  for (const key in attributes) {
    const attributeValue = attributes[key];
    const value = Array.isArray(attributeValue)
      ? attributeValue.join(" ")
      : attributeValue;
    el.setAttribute(key, value);
  }
}

function mountChildren(children, container) {
  if (typeof children === "string") {
    container.textContent = children;
  } else if (Array.isArray(children)) {
    children.map((v) => {
      patch(v, container);
    });
  }
}
```
