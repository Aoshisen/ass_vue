# 实现isRef功能和unRef功能

## 实现isRef功能

> 先说思路，在创建ref对象的时候在实例上面挂载一个__v_isRef属性，在调用isRef的时候我们返回ref.__v_isRef就行了

[isRef官方地址](https://vuejs.org/api/reactivity-utilities.html#isref)
测试用例

```typescript
  it("isRef",() => { 
    const a=ref(1)
    const user=reactive({age:1})
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
   })
```

```typescript
class RefImpl {
  private _value: any;
  public dep;
  //新加的
  public __v_isRef=true;
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
export function isRef(value){
  return !!value.__v_isRef

}

```

## 实现unRef功能

[unRef官方地址](https://vuejs.org/api/reactivity-utilities.html#unref)

> 先说思路，我们调用unRef的时候，如果是一个ref，那么我们就返回ref.value如果不是一个ref那么就返回原先传递进来的值

测试代码

```typescript
//ref.spec.ts
   it("unRef",() => { 
    const a=ref(1)
    expect(unRef(1)).toBe(1)
    })
```

实现代码

```typescript
export function unRef(ref){
  return isRef(ref)?ref.value:ref;
}
```
