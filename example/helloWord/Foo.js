import { h } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "Foo");
    //我们需要在这里接收上面传递过来的slots 然后把他加入到h 函数渲染的函数里面去
    //其实slots 就是当前虚拟节点的children 
    return h("div", {}, [foo,this.$slots]);
  },
};
