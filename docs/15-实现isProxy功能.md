# 实现isProxy功能

> 实现isProxy 功能其实很简单的,之前就封装了isReactive 和isReadonly方法，那么在isProxy里面再调用这连个方法不就得了

```typescript
export const isProxy = (value: any) => {
  return isReactive(value) || isReadonly(value);
};
```

[isProxy官方文档](https://vuejs.org/api/reactivity-utilities.html#isproxy)
