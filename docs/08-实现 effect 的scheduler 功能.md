# 实现effect 的scheduler 功能

> effect 的scheduler 功能简介
    1. 通过effect 的第二个参数给定的一个scheduler 的fn
    2. effect 第一次执行的时候 还会执行fn
    3. 当响应式对象更新的时候不会执行fn了而是执行scheduler
    4 .如果说执行runner 的时候会再次执行fn

---
对应的 测试用例写法

```typescript
  it("scheduler", () => {
    //1.通过effect 的第二个参数给定的一个scheduler 的fn
    //2. effect 第一次执行的时候 还会执行fn
    //3. 当响应式对象更新的时候不会执行fn了而是执行scheduler
    //4 .如果说执行runner 的时候会再次执行fn
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );
    //scheduler 就是effect 的第二个参数，在初始化的时候不会被调用
    expect(scheduler).not.toHaveBeenCalled()
    //然后第一次的时候是会被调用的，调用后dummy 就会被赋值为1
    expect(dummy).toBe(1)
    obj.foo++;
    //当obj 改变的时候会被调用scheduler
    expect(scheduler).toHaveBeenCalledTimes(1)
    //但是这个时候不会去更新dummy的值
    expect(dummy).toBe(1)
    //当执行run的时候才会被调用dummy
    run();
    expect(dummy).toBe(2)
  });
```

---

对应的effect 代码就不贴了，可以看对应的提交记录
这里有些值得学习的地方
**scheduler** 这个参数**不会影响依赖收集**的过程，**只会影响触发依赖**的过程，
但是触发依赖的时候我们不知道当前的scheduler是传递了的还是没传递的，
而对应的依赖是由**ReactiveEffect**这个构造函数生成的，
所以我们可以在这个类**初始化**的时候传递这个**scheduler**进到每一个**effect** 实例里面去，
当我们触发依赖的时候拿出每一个**effect** 然后判断**effect** 有没有**scheduler** 属性，有的话就执行scheduler 没有的话就执行effect.run()
