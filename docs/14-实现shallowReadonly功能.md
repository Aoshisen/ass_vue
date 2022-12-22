# 实现shallowReadonly 功能

> shallowReadonly 字面意思就是浅的readonly功能
> 是为了性能优化做的api只有最外面一层对象是readonly而其内部是原始的对象

我们来到测试这边

```typescript
import { isReadonly,shallowReadonly } from "../reactive";

describe("shallowReadonly happy path",()=>{
    it("should not make non-reactive properties reactive",()=>{
        const props=shallowReadonly({n:{foo:1}})
        expect(isReadonly(props)).toBe(true)
        expect(isReadonly(props.n)).toBe(false)
    })
  it("warn then call set", () => {
    console.warn = jest.fn();
    const user = shallowReadonly({ age: 10 });
    user.age = 11;
    expect(console.warn).toBeCalled();
  });
})
```

然后来到reactive这边发现我们的所有的函数都被我们层层封装了，那么再要创建一个shallowReadonly 还是得重新走一遍流程

我们来到baseHandler里面
照葫芦画瓢

```typescript
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
```

然后改造createGetter方法

```typescript
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);
    if (key === reactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === reactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    if (shallow) {
      return res;
    }
    if (!isReadonly) {
      track(target, key);
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}
```

然后更新一下导出函数就可以了

```typescript
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet,
});
```
