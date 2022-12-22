# 实现reactive和readonly嵌套对象转换功能

其实这个功能也很简单,我们在createGetter的时候会去拿到每一个调用了的target[key]，我们在拿到这个值的时候判断一下当前对象是否是一个对象，如果是的话那么就再次的去调用reactive函数或者是readonly函数来构造响应式对象

瞅一瞅对应的测试

> reactive的测试

```typescript
  //reactive.spec.ts
  it("nested reactive",()=>{
    const original={
      nested:{
        foo:1
      },array:[{bar:2}]
    }
    const observer=reactive(original)
    expect(isReactive(observer.nested)).toBe(true)
    expect(isReactive(observer.array)).toBe(true)
    expect(isReactive(observer.array[0])).toBe(true)
  })
```

> readonly的测试

```typescript
  //readonly.spec.ts
  it("nested readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    //IsReadonly
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(wrapped.bar)).toBe(true)
  });
```
