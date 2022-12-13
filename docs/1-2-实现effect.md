# 实现effect

## effect 依赖于reactive 的实现

> 我们希望当一个值调用reactive 方法的时候会创建另外一个对象，而这个对象可以访问原始对象里面的值

所以我们在test 文件夹下面创建一个reactive.spec.ts 来测试我们的reactive 的逻辑

```ts
import {reactive} from "../reactive"
describe("reactive",()=>{
    it("happy path",()=>{
        const original={foo:10};
        const observer=reactive(original)
        //创建响应式对象，希望响应式对象能读取到之前的值
        expect(observer.foo).toBe(10)
        //希望响应式对象和原来的值是两个不同的引用
        expect(observer).not.toBe(original)
    })
})
```

然后我们去到reactive.ts 里面去实现相应的逻辑

```typescript
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
     const res = Reflect.get(target, key);
      //TODO: 依赖收集
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
    //   TODO: 触发依赖
      return res;
    },
  });
}
```

> Proxy 对象有点陌生 ，补上对应的mdn文档以及Reflect的 用法,proxy 就是对数据进行了一次拦截，在读取和设置值的时候我们可以为所欲为，嘿嘿

[Proxy 的用法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)


我们通过Proxy创建了一个对象，然后我们就可以在值set和get 的时候进行相应的操作，在值读取的时候，我们去把依赖收集起来(依赖收集的过程，就是找到谁引用了我们这个响应对象的值，引用了就会触发响应式对象的get操作这个时候们就可以知道，并把函数存储起来)，然后在值改变的时候，我们去触发依赖(触发依赖的过程就是把收集起来的函数一个个执行一遍)

---

## 实现reactive之后 effect 的实现

> 然后基础的reactive函数实现得差不多了我们去瞅瞅effect 该怎么实现

NOTE: 简单介绍一下这个测试 我们首先需要去创建一个响应式对象，然后通过effect 包裹一个函数，在里面去对nextAge 赋值，这个操作是测试 我们创建得reactive 对象能不能get 的，当然也是依赖收集的过程，进行了依赖收集过后那么下一步就是触发依赖，我们是在原始数据更改的时候去触发依赖的，所以这时候我们让原始的数据++ ，然后去看一下通过effect 函数包裹的值的情况，这个时候应该effect 函数由于原始数据改变也会随着触发依赖而更改

```typescript
import { reactive } from "../reactive";
import { effect } from "../effect";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);
    user.age++;
    expect(nextAge).toBe(12);
  });
});
```

我们转到effect.ts 实现我们上面的逻辑

```typescript
// 抽离函数的执行逻辑
class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}
export function effect(fn) {
  //最开始进来的时候就执行一下fn这个函数，我们把这个逻辑抽离出去，把函数的执行封装成一个run方法 然后 通过实例的方式来调用
  let _effect = new ReactiveEffect(fn);

  _effect.run();
    //期望响应式对象的值为11
    expect(nextAge).toBe(11);
 }
```

> 到这一步我们的测试应该成功一大半了，然后就是我们重要的逻辑，如何收集依赖和触发依赖了，让我们把之前 在reactive 里面漏掉的东西在effect函数里面给补上

```typescript
//reactive.ts
import { track,trigger } from "./effect";
//导出一个函数，传入的参数是一个没有处理过的对象
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // return target.key
      //通过Reflect.get 拿到当前target的值
      const res = Reflect.get(target, key);
      // 依赖收集
      track(target,key)
      return res;
    },
    set(target, key, value) {
      // return target.key=value
      const res = Reflect.set(target, key, value);
      // 触发依赖
      trigger(target,key)
      return res;
    },
  });
}
```

然后我们去effect 里面实现相应的track(依赖收集),和trigger(触发依赖) 的逻辑

>Note： 思考一下应该怎么去组织我们的数据结构，我们现在 有target key 以及依赖effect 一个target 里面包含很多个key 然后每个key可以对应收集很多个effect。虽然说这样说有点牵强，我也是看了视频之后才知道用map 这个数据结构来存储target 的关系的，为了之后的不迷路，参考下面的链接

[Map 对象的用法详解](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

> Note: 我们存储key 对应的effect 的时候也会用到一个不怎么常用的数据结构set ，set 的特性是 set 数据结构里面存储的东西不重复,用来存储effect 再合适不过了

[Set 对象的用法详情](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---
那就让我们开始吧

```typescript
//effect.ts
class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}
const targetMap = new Map();
export function track(target, key) {
  //取到target 上面存的key值
  let depsMap = targetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    depsMap.set(target, depsMap);
  }
  let dep = targetMap.get(key);

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
let activeEffect;
export function effect(fn) {
  let _effect = new ReactiveEffect(fn);
  _effect.run();
}
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}
```

---
总结一下:

- Map 是一组键值对的结构，具有极快的查找速度，有点类似于对象，但是对象的key值可以为任何类型，就像是小时候做的连线题，把两个东西绑在一起,然后Map 还可以更方便的操作自身的属性，里面自带了clear，delete，get，set等方法，让操作对象变得得心应手
- Set 的话就是创建一个数组里面的值都是不重复的，如果重复了那么就会去除掉
- Proxy 对象的话就是对一个值进行代理，在读取值和改变值属性的时候，做一些嘿嘿嘿的事
