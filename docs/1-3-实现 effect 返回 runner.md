# 实现effect 返回runner

在上一章节已经实现了我们的effect 里面的触发和收集依赖的操作

> 但是在effect函数的实现里面我们并没有定义返回值，在vue3中我们调用了effect过后会返回一个runner 函数，我们调用这个runner函数的时候就会再次的触发调用传递给effect 的函数，并且这个runner 函数的返回值也是传递进去函数运行后的返回值

我们先写测试用例

```typescript
//effect.spec.ts

import { reactive } from "../reactive";
import { effect } from "../effect";
describe("effect", () => {
  it("should return runner when call effect",()=>{
    //我们调用effect（fn）之后是会返回一个function的runner ，当调用这个function(runner) 的时候，就会再执行一下这个effect 函数，并且这个时候会返回effect 函数执行的值的
    let foo =10;
    //希望effect 函数执行之后返回的是一个runner函数
    const runner=effect(()=>{
      foo++;
      return "foo";
    })
    //期待第一次的effect 函数是会调用传递进去的fn的
    expect(foo).toBe(11)
    //我们把返回函数执行一遍，期待传递进去的函数再次被调用
    const r=runner()
    expect(foo).toBe(12)
    //然后我们还期待runner函数的返回值是传递进去的函数的 返回值
    expect(r).toBe("foo")
  })
});
```

然后我们来到effect.ts 里面实现相关的逻辑

```typescript

class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
+   let res=this._fn();
+   //实现调用run方法的时候需要得到fn的返回值
+   return res;
  }
}
//map 对象就像是一个对象，但是这个对象里面的键可以是任何类型的属性
let targetMap = new Map();
export function track(target, key) {
  //取到target 上面存的key值
  let depsMap = targetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    //这里初始化的时候dep就是空
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);

  //因为依赖的项都是不重复的函数，那么可以用set这个数据结构来存储
  // let dep =new Set()
  //然后把 target key 对应起来
  //target=> key => dep
}
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}
let activeEffect;
export function effect(fn) {
  let _effect = new ReactiveEffect(fn);
  _effect.run();
  //以当前这个effect的实例作为run 方法的this的指向
+ return _effect.run.bind(_effect);
}
```
