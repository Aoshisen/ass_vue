import { h } from "../../lib/ass-vue.esm.js";
import { Foo } from "./Foo.js";
window.self = null;
export const App = {
  // .vue
  // <template></template>
  //render
  render() {
    //ui  逻辑
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red"],
        onClick() {
          console.log("this is app div onclick");
        },
        onMousedown() {
          console.log("mouseDown,app");
        },
      },
      // "hi" + this.msg,
      // [h("p", { class: "red" }, "hi red"), h("p", { class: "blue" }, "hi blue")],
      [h("p", { class: "red" }, "hi red"), h(Foo, { count: 1 })]
    );
  },
  setup() {
    return {
      msg: "ass-vue",
    };
  },
};

//处理组件，处理element
