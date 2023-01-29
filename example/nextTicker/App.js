import { h, ref, getCurrentInstance,nextTick } from "../../lib/ass-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();
    async function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
      }
      debugger;

      //在这里因为是异步任务所以拿不到最新的instance
        console.log(instance, "instance");
      nextTick(()=>{
        //在nextTick中拿到最新的instance
        console.log(instance, "instance");
      })
      //或者使用这样使用
      await nextTick();
      console.log(instance,"instance");

    } return { onClick, count };
  },
  render() {
    {
      const button = h("button", { onClick: this.onClick }, "update");
      const p = h("p", {}, "count" + this.count);
      return h("div", {}, [button, p]);
    }
  },
};
