import { h, ref } from "../../lib/ass-vue.esm.js";

const prevChildren = "oldChildren";
const nextChildren = [h("div", {}, "New"), h("div", {}, "Children")];
export default {
  name: "ArrayToText",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return { isChange };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
