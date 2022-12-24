# 实现ref功能

我们需要知道ref是什么
[ref 官网链接](https://vuejs.org/api/reactivity-core.html#ref)
接受一个内部值并返回一个响应式和可变的ref对象，该对象只有一个指向内部值的属性.value

通过这句话和官网的例子就知道了这个函数会把一个单独的值，构造成一个响应式对象类似于这种形式
{value:接受的值}

```typescript
function ref<T>(value: T): Ref<UnwrapRef<T>>

interface Ref<T> {
  value: T
}
```

再来看看我们的单元测试

```typescript
import { effect } from "../effect";
import { ref } from "../ref";

describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("should be reactive", () => {
    //创建一个对象
    const a = ref(1);
    let dummy;
    let calls = 0;
//然后去通过effect 做依赖收集
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    //改变value的值我们希望依赖被触发
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    //same value should not trigger
    //如果改变的值和原有的数据相等那么就不进行触发依赖
   a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const a = ref({ count: 1 });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });
});
```

先来说第一个单元测试吧，我们希望通过ref()函数包裹后我们通过创建出来的新的对象的value值可以得到之前的值
> 让我们简单的来实现一下这个功能

```typescript
class RefImpl {
  private _value: any;

  constructor(value) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

//   set value(newValue) {
//   }
}

export function ref(value) {
  return new RefImpl(value);
}
```

我们简单的创建了一个RefImpl的类来实现我们的get value的时候返回传递进来的value值

然后我们再来看看第二个测试，我们希望创建出来的这个对象应该是reactive的,我们通过effect去收集依赖，然后在值改变的时候们希望收集起来的依赖会被触发,
然后还有一个边缘keys的情况就是说当改变的值是一样的那么我们就不触发收集起来的依赖

> 之前我们在reactive的时候已经做了依赖收集和触发依赖的逻辑操作了，但是那时候的依赖收集是收集的对象的现在我们收集的是单个值的，所以就不用之前那么麻烦了,我们来做一下逻辑抽离

```typescript
//effect.ts
 export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function track(target, key) {
  if (!isTracking()) return;
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
 trackEffects(dep);
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
```

---
那么在ref.ts 里面我们就可以这么做

- 在初始化的时候初始化dep为一个空的set数组
- 在get操作的时候把当前的依赖收集进去
- 然后在set的时候把依赖再触发一次，在这个时候需要注意值是否发生了改变，我们需要对比的是原始的值和新值，而不是proxy和新值，所以我们需要再声明一个rawValue来存放之前没改变之前的数据

```typescript
import { trackEffects, triggerEffects, isTracking } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared";

class RefImpl {
  private _value: any;
  public dep;
  private _rawValue: any;

  constructor(value) {
    // 1.看看value是不是对象，如果不是直接返回，如果是那么就处理包裹一下
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    //这里需要收集依赖
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    //这里需要触发依赖
    //如果对比的话那么对象
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value);
}
```
