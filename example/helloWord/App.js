import { h } from "../../lib/ass-vue.esm.js";
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
      { id: "root", class: ["red", "blue"] },
      "hi" + this.msg
      // [h("p", { class: "red" }, "hi red"), h("p", { class: "blue" }, "hi blue")]
    );
  },
  setup() {
    return {
      msg: "ass-vue",
    };
  },
};

//处理组件，处理element
