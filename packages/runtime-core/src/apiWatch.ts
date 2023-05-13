import { ReactiveEffect } from "../../reactivity/src/effect";

import { queueFlushCb } from "./scheduler";
export function watchEffect(source) {
  // source 函数会被添加到组件渲染前调用
  let cleanup;
  function job(cleanupFn) {
    effect.run();
  }

  const onCleanup = function (cleanupFn) {
    cleanup = effect.onStop=() => { cleanupFn() }
  };

  function getter() {
    if (cleanup) {
      cleanup();
    }
    source(onCleanup);
  }
  const effect = new ReactiveEffect(getter, () => {
    queueFlushCb(job);
    // effect.run();
  });
  //一上来的时候这个source 是要被调用的
  effect.run();
  return () => {
    effect.stop();
  };
}
