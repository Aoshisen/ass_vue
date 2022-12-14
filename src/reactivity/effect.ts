import { extend } from "./shared";
//创建activeEffect 的实例的类

class ReactiveEffect {
  private _fn: any;
  public scheduler?: any;
  public deps = [];
  public active = true;
  public onStop?: () => void;
  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    //实现调用run方法的时候需要得到fn的返回值
    return this._fn();
  }
  stop() {
    //this就是当前active 的runner
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect: any) {
  effect.deps.forEach((dep: any) => dep.delete(effect));
}

//map 对象就像是一个对象，但是这个对象里面的键可以是任何类型的属性
let targetMap = new Map();
//当前的target key 值被 get 的时候 的函数的自定义包装
let activeEffect;

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
  //添加当前活动的effect
  //只有当调用effect 的时候，才会生成activeEffect
  if (!activeEffect) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
  //因为依赖的项都是不重复的函数，那么可以用set这个数据结构来存储
  // let dep =new Set()
  //然后把 target key 对应起来
  //target=> key => dep
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  //触发所有收集起来的effect
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  let _effect = new ReactiveEffect(fn, options.scheduler);

  // _effect.onStop = options.onStop;
  // Object.assign(_effect,options)
  extend(_effect, options);
  //在run 的时候顺带绑定activeEffect 为当前活动的effect
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  //把effect 挂载到runner 上面好通过stop方法停止
  runner.effect = _effect;
  //以当前这个effect的实例作为run 方法的this的指向
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
