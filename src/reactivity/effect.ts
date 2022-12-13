class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    let res=this._fn();
    //实现调用run方法的时候需要得到fn的返回值
    return res;
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
  return _effect.run.bind(_effect);
}