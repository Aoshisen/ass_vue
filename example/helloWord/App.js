import { h } from "../../lib/ass-vue.es.js";
export const App = {
  // .vue
  // <template></template>
  //render
  render() {
    //ui  逻辑
    return h("div", "hi" + this.msg);
  },
  setup() {
    return {
      msg: "ass-vue",
    };
  },
};

//处理组件，处理element
