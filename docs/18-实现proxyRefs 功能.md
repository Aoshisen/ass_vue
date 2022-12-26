# 实现proxyRefs功能

> proxyRefs 这个函数也是一个工具函数，通过这个函数包裹的包含ref的对象，可以通过object.key 这样的方式直接访问

## get

请看测试代码

```typescript
it("proxyRefs get", () => {
    const user = { age: ref(10), name: "xiaoming" };
    const proxyUser=proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe("xiaoming")
  });
```

来看ref.ts 的具体实现

```typescript
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      //如果是ref的话就返回ref.value,如果不是ref的话那么就返回target.key
      return unRef(Reflect.get(target, key));
    },
    // set(target,key,newValue){

    // }
  });
}
```

## set

> 然后我们来分析一下set的时候的逻辑，当原来的值是ref 的时候，并且新值不是ref的时候，那么需要改变原先ref的value值为newValue

测试代码

```typescript
//ref.spec.ts
it("proxyRefs set", () => {
    const user = { age: ref(10), name: "xiaoming" };
    const proxyUser=proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe("xiaoming")
  });
  

```

具体实现

```typescript
//ref.ts
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      //如果是ref的话就返回ref.value,如果不是ref的话那么就返回target.key
      return unRef(Reflect.get(target, key));
    },
    // ref&&newValue 不是ref ref.value=newValue
    set(target,key,newValue){
        if(isRef(target[key])&&!isRef(newValue)){
            return (target[key]=newValue)
        }
        else{
            return Reflect.set(target,key,newValue)
        }
    }
  });
}
```
