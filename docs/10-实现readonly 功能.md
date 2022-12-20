# readonly 功能的实现

> 首先我们需要明白的是，readonly 跟reactive 是差不多的只不过通过readonly 创建出来的对象不能被set，就如同这个名字一样（只读）

那么这个逻辑就比较简单了，就把之前写好的reactive方法拿下来改个名字删点代码就ok .

```typescript
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

## 代码重构

- 把get 和set 抽离出去，变成一个高阶函数，传入是否为readonly 返回不同的函数，然后把handler也单独抽离成一个文件，并且为了让代码更语义化，那么可以把 new proxy 这个动作也处理一下 
- 另一个需要优化的点就是可以利用缓存的技术来创建handlers，而不是每次都重新创建handlers

重构完成的代码

```typescript
//reactive.ts
import { mutableHandlers, readonlyHandlers } from "./baseHandler";

export function reactive(raw) {
  return createActionObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActionObject(raw, readonlyHandlers);
}

function createActionObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
```

```typescript
import { track, trigger } from "./effect";
const get = createGetter();
const set = createSetter();
const readonlyGet=createGetter(true)

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);
    if(!isReadonly){
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get:readonlyGet,
  set(target, key, value) {
    console.warn(
      `target ${target} is readonly, ${key.toString()} can not be set to ${value}`
    );
    return true;
  },
};
```
