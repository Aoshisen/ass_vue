import { h, ref, renderSlots } from "../../lib/ass-vue.esm.js";
const Child = {
  setup() {
    return {};
  },

  render() {
    return h("p", {}, "child-props-msg" + this.$props.msg);
  },
};
export default Child;
