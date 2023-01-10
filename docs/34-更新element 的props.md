# 更新element 的props

这一个小节其实很简单，我们需要在element 变化的时候动态去跟新props

然后这个情况其实可以勉强分为三个小的情节

- 我们改变element 的值
- 我们把值改变成undefined
- 我们把值连同key 全部删掉


基于我们之前监听到props 变化，我们申明了一个叫patchProp 的函数,然后我们在里面去调用hostPathProps 方法
而这个方法是我们实现自定义渲染器传递进来的渲染函数

```typescript
function patchElement(n1, n2, container) {
    //值得注意的是我们为了保证{} 是同一个引用所以在shared 里面去定义了一个 empty_object 这样一个变量
    //然后就是我们需要把旧 的el 属性绑定在新的上面，不然新的instance 上面会没有el属性

    const prevProps = n1.props || EMPTY_OBJECT;
    const nextProps = n2.props || EMPTY_OBJECT;
    const el = (n2.el = n1.el);
    patchProps(el, prevProps, nextProps);
  }

function patchProps(el, prevProps, nextProps) {
    //新的props 里面值改变了或者是新的props 里面的值为undefined
    if (nextProps !== prevProps) {
        //如果新的props 和原来的props 不相同才做更改
      for (const key in nextProps) {
        //循环新的props 然后拿到新的值对原现的属性尽心更改
        // 值得一提的是如果新的props 里面有旧的props 里面没有的属性那么也会添加上
        const prevProp = prevProps[key];
        const nextProp = nextProps[key];
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
      if (prevProps !== EMPTY_OBJECT ){
        //如果之前的props 不为一个空数组的话
        for (const key in prevProps) {
            //循环之前的数组，然后删除之后的属性
          if (!(key in nextProps)) {
            hostPatchProp(el, key, prevProps[key], null);
          }
        }
      }
    }
  }
```

然后我们去更新一下我们的hostPatchProp里面的逻辑

```typescript
//新增删除属性的方法
function patchProp(el, key, prevVal, nextVal) {
  const isOn = (eventName: string) => /^on[A-Z]/.test(eventName);
  if (isOn(key)) {
    const eventName = key.slice(2).toLocaleLowerCase();
    el.addEventListener(eventName, nextVal);
  } else {
    const _val = Array.isArray(nextVal) ? nextVal.join(" ") : nextVal;
    if (nextVal === undefined || nextVal === null) {
      console.log("undefined or null");
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, _val);
    }
  }
}
```

这一节最值得注意的就是el的赋值，需要把之前的el属性赋值给新的vnode 