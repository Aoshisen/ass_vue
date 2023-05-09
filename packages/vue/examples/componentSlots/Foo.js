import { h, renderSlots } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    console.log(this.$slots);
    // 1.获取到要渲染的节点
    // 2.获取到要渲染的位置
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age: 10000 }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
