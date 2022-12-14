# 实现effect 的stop功能

## stop 功能

> stop 的功能简介
     1. effect.ts 会导出一个stop函数，当调用stop函数，并且把runner(也就是effect的返回值传递给他时),再次触发trigger 也就是触发响应式对象值得更新得时候，当前用户传递进来得依赖不会执行(就是effect包裹得函数不会执行)
     2. 当再次调用runner 的时候effect包裹的函数执行

对应的测试代码

```typescript
  it("stop", () => {
   let dump;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dump = obj.prop;
    });
    obj.prop = 2;
    expect(dump).toBe(2);
    stop(runner);
    obj.prop = 3;
    expect(dump).toBe(2);

    //stopped effect should still be manually callable
    runner();
    expect(dump).toBe(3);
  });
```

---
老样子代码就不贴了
**先理一下思路**


- 我们要干什么(我们要停止一个函数的运行)
- 停止的函数怎么来的(我们通过effect 函数返回的)
- 我们通过effect 函数处理的函数返回的函数本质是什么(本质就是用户通过effect函数传入进来的那个改变 响应式对象值的方法)
- 我们怎么去拿到这个函数呢(我想我们effect 对象是自己创建的，那么如果传递进去了一个stop方法的话那么我们在对应的实例上也挂载一个一个stop方法，当调用stop(runner)的时候我们对应的去调用实例对象上面的stop 方法不就行了吗)
- stop 方法停止runner 函数的运行,我们需要去收集当前的effect 的deps,那么我们可以通过activeEffect.deps 去收集dep,在收集依赖的时候反向收集一波
- 然后在ReactiveEffect 类里面去实现stop 方法,当调用stop 方法的时候去把deps 里面当前的dep删除掉，那么以后的trigger 就不会执行effect了

---

## 实现effect 的onStop 功能

这个功能很简单，就是通过effect 的第二个参数传递一个onStop 函数进去，再stop 调用后如果有这个函数传递的话运行这个函数如果没有就不运行

```typescript
  //effect onStop 的测试逻辑
  it("onStop", () => {
    const obj = reactive({ foo: 1 });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { onStop }
    );
    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
```

---
***让我们来理一下现在这个effect文件的思路***

- 首先我们需要一个响应式对象,当get的时候触发track(收集依赖),当set的时候触发trigger(触发依赖)
- 然后我们通过effect函数包裹一个函数表达式，函数表达式里面有我们响应式对象的值被调用的情况,就会触发依赖收集，有因为当前函数被effect包裹那么也会走到effect函数的逻辑
- effect 函数会处理传递进来的函数通过ReactiveEffect类暴露出run,stop,等方法，然后通过effect的第二个参数，options 传递进来的属性也会被ReactiveEffect接收，进行处理
- effect 函数也会返回一个传入函数,其返回值也是和传入函数相同的一个值,并且会在其函数上挂载effect 的全部方法 runner.effect=_effect;
- 而在ReactiveEffect这边的话我们是根据传入进来的参数做了各种操作 run，stop ，scheduler，onStop 并且在调用run方法的时候把整个作用域里面的activeEffect的值改变成了当前的实例
- 那么在收集依赖的时候我们就可以拿到当前的activeEffect 做点事情了，`activeEffect.deps.push(dep);` 我们在activeEffect上面挂载了所有依赖的函数集合
- 而这个函数集合又是通过`dep.add(activeEffect);` 来收集的那么这里可以就类似于这种activeEffect.deps =[activeEffect[],activeEffect[]]
- 还有一个很牛逼的点是通过targetMap 这个Map对象存储了target key 以及key所对应的所有的effect effect 的结构层层递归，就像上面的activeEffect 一样
