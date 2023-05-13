import { reactive } from "@ass-vue/reactivity";
import { nextTick } from "../src/scheduler";

import { watchEffect } from "../src/apiWatch";

describe("api: watch", () => {
  it("effect", async () => {
    const state = reactive({ count: 0 });

    let dummy;
    watchEffect(() => {
      dummy = state.count;
    });

    expect(dummy).toBe(0);
    state.count++;
    await nextTick();
    expect(dummy).toBe(1);
  });

  it("stop the watcher(effect)", async () => {
    const state = reactive({ count: 0 });
    let dummy;
    const stop: any = watchEffect(() => {
      dummy = state.count;
    });

    expect(dummy).toBe(0);

    stop();
    state.count++;
    await nextTick();

    expect(dummy).toBe(0);
  });

  it("cleanup registration (effect)",async () => { 
    const state = reactive({ count: 0 });

    const cleanup=vi.fn() 
    let dummy;
    const stop=watchEffect((onCleanup) => {
      onCleanup(cleanup)
      dummy = state.count;
    });

    expect(dummy).toBe(0);
    state.count++;
    await nextTick();
    //发生更新逻辑之后再调用
    expect(cleanup).toBeCalledTimes(1)
    expect(dummy).toBe(1);
    stop()
    //当stop 掉了之后cleanup还会被调用一次
    expect(cleanup).toBeCalledTimes(2)
   })
});
