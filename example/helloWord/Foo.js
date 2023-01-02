import { h } from "../../lib/ass-vue.esm.js";
export const Foo = {
  render() {
    //1.通过setup 传递过来
    //2. 通过setup传递过来的参数能在render里面通过this 拿到，
    //3. 通过props 传递过来的参数不可被修改
    return h("div", {}, "some text in fool" + this.count);
  },
  setup(props) {
    console.log(props);
  },
};
