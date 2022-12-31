import { h } from "../../lib/ass-vue.esm.js";
export const App = {
  // .vue
  // <template></template>
  //render
  render() {
    //ui  逻辑
    return h(
      "div",
      { id: "root", class: ["red", "blue"] },
      // "hi" + "ass-vue",
      [h("p", { class: "red" }, "hi red"), h("p", { class: "blue" }, "hi blue")]
    );
  },
  setup() {
    return {
      msg: "ass-vue",
    };
  },
};

//处理组件，处理element
