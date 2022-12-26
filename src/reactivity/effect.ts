import { extend } from "./shared";
//创建activeEffect 的实例的类

//map 对象就像是一个对象，但是这个对象里面的键可以是任何类型的属性
let targetMap = new Map();
//当前的target key 值被 get 的时候 的函数的自定义包装
let activeEffect;
let shouldTrack;

export class ReactiveEffect {
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
    //在这里的时候会收集依赖
    //用shouldTrack来做区分
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    const result = this._fn();
    shouldTrack = false;
    return result;
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
  //每一个dep都是一个set对象
  effect.deps.forEach((dep: any) => dep.delete(effect));
  effect.deps.length = 0;
}

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
  //添加当前活动的effect
  //只有当调用effect 的时候，才会生成activeEffect
  trackEffects(dep);

  //得到了类似于下面这种结构
  // 1. target 通过target 存储自身
  // 2. target 通过target 拿到自身
  // 3. target key 通过target的key值存储在target 里面
  // 4. target key 通过target拿到targetMap 然后通过targetMap.get(key)来拿到自身
  // 5. target key 可以通过add 方法添加自身到指定的地方，以及对自身的属性再进行操作；
  // 6. 相当于建立了一个对应的关系，连了个线，各自的数据储存在各自的位置，现在这个map数据结构只是把内存地址相互关联了一下

  //因为依赖的项都是不重复的函数，那么可以用set这个数据结构来存储
  // let dep =new Set()
  //然后把 target key 对应起来
  //target=> key => dep
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
