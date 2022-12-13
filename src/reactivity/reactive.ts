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
