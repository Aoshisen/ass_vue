import { h } from "../../lib/ass-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    //我们希望在foo 这里传递h 的第三个参数，能被Foo 接收到并且渲染到children里面
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => h("div", {}, "header" + age),
        footer: () => h("div", {}, "footer"),
      }
    );

    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};

//处理组件，处理element
