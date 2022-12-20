# 优化stop功能

> 遇到的问题
> 之前通过stop停止了一个runner然后再直接改变reactive对象的值，然后去观察dump 的值是否改变
> 但是现在如果通过obj.foo++这种方式去改变reactive对象的值，那么测试就会不通过

新的测试用例

```typescript
it("stop", () => {
    // 1. effect.ts 会导出一个stop函数，当调用stop函数，并且把runner(也就是effect的返回值传递给他时),再次触发trigger 也就是触发响应式对象值得更新得时候，当前用户传递进来得依赖不会执行(就是effect包裹得函数不会执行)
    // 2. 当再次调用runner 的时候effect包裹的函数执行
    let dump;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dump = obj.prop;
    });
    obj.prop = 2;
    expect(dump).toBe(2);
    stop(runner);
    // obj.prop = 3;
    //这里会先去走get的操作，从而把清空的依赖重新收集了起来
    obj.prop++;
    expect(dump).toBe(2);

    //stopped effect should still be manually callable
    runner();
    expect(dump).toBe(3);
  });
```

**bug出现的原因分析**
正常的情况是这样的，我们直接去改变响应式对象的值，那么响应式对象只会去触发set操作，但是我们通过obj.foo++这种方式去改变值的话那么会触发get操作先去读取一遍值，读取值的时候触发了依赖收集，而我们之前的stop方法刚刚把依赖删除了，这时候有因为依赖收集从而有收集了依赖

**bug解决方案**
我们再申明一个全局变量shouldTrack来判断当前的这个effect时候应该被收集
而我们是在ReactEffect 的run方法里面首次去触发依赖收集这个动作的，那么我们可以在run方法那边给shouldTrack来赋值，通过this.active来判断当前的effect的状态,如果是active的状态那么改变shouldTrack的值为true,并且在执行完函数的时候reset掉shouldTrack

**后续操作**
然后在track函数的时候判断一下当前的track时候为真，如果是假那么就返回掉

NOTE:调用了stop方法之后整个ReactEffect的active为false,为false 的话，只能调用run方法才能改变reactive对象的值，但是如果调用了get方法之后，执行用户传递的fn会被收集依赖，我们在执行fn前把shouldtrack的值赋值为true那么到track的时候再判断一下shouldTrack为不为true然后再收集，要是为false就不收集，为true就收集。