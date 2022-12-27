# 实现computed 计算属性

> 我们来实现一下computed 的主要逻辑

[computed 官方文档](https://vuejs.org/guide/essentials/computed.html)

```typescript
import { computed } from "../computed";

import { reactive } from "../reactive";

describe("computed", () => {
  it("happy path", () => {
   const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });

    expect(age.value).toBe(1);
  });
});
```

在测试用例里面可以看出来我们通过computed函数传递了一个函数，而我们希望函数age读取value属性的时候返回user.age的值

```typescript
class ComputedRefImpl {
  private _getter: any;
  constructor(getter) {
    this._getter = getter;
  }
  get value(){
    return this._getter()
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
```

在沿用刚才的逻辑新增一下测试

```typescript
  it("should compute lazily", () => {
    const value = reactive({ foo: 1 });
    const getter = jest.fn(() => {
      return value.foo;
    });

    const cValue=computed(getter)

    //lazy
    expect(getter).not.toHaveBeenCalled()
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    //should not computed again 
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    //should not compute until needed
    value.foo=2
    expect(getter).toHaveBeenCalledTimes(1)

    // //now it should compute
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    // //should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  });
```

> 我们发现在进行到should not computed again 之前我们的逻辑都是可以走通的，那么我们来让这个逻辑走通

- 我们需要在第二次get的时候不去调用传入的getter 
- 我们可以通过一个状态来管理这个getter 的调用，相当于给getter的调用上一个锁
- 通过_dirty 这个变量来管理getter的调用问题

```typescript
class ComputedRefImpl {
  private _getter: any;
  private _dirty: boolean = true;
  private _value: any;
  constructor(getter) {
    this._getter = getter;
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._getter();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
```

> 进行到这一步我们打开 should not compute until needed

然后发现我们的测试代码报错，进行调用栈的查找，我们发现我们在触发value.foo=2 的时候其实需要去触发依赖但是我们并没有去收集依赖，那我们可以在ComputedRefImpl 初始化的时候去收集一下依赖
注意，这个时候的targetMap是一个size为0的map对象所以在触发trigger的时候会报错

```typescript

import { ReactiveEffect } from "./effect";
class ComputedRefImpl {
  private _getter: any;
  private _dirty: boolean = true;
  private _value: any;
  private _effect:any;
  constructor(getter) {
    this._getter = getter;
    this._effect =new ReactiveEffect(getter)
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      //通过调用run方法把依赖收集起来，并且绑定reactiveEffect为当前的effect
      this._value =this._effect.run()
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
```

但是这样的话我们去调用value.foo getter 函数又会被执行一次,getter 是在reactiveEffect里面调用的，我们可以指定scheduler来避免getter的执行

```typescript
import { ReactiveEffect } from "./effect";
class ComputedRefImpl {
  private _getter: any;
  private _dirty: boolean = true;
  private _value: any;
  private _effect: any;
  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter,()=>{
      console.log("ass");
    });
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      //在run 的时候会去收集依赖
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}


```

> 我们希望computed的值跟着value的值的改变发生改变，所以我们在scheduler里面应该把之前的锁给打开

```typescript
import { ReactiveEffect } from "./effect";
class ComputedRefImpl {
  private _getter: any;
  private _dirty: boolean = true;
  private _value: any;
  private _effect: any;
  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      //在run 的时候会去收集依赖
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}

```
