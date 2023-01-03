import { h } from "../../lib/ass-vue.esm.js";
export const Foo = {
  setup(props,{emit}) {
    //通过 setup 的第二个参数 处理emit

    const emitAdd = () => {
      emit("add",1,2)
      emit("add-foo")
      console.log("emit add");
    };
    return { emitAdd };
  },
  render() {
    //1.通过setup 传递过来
    //2. 通过setup传递过来的参数能在render里面通过this 拿到，
    //3. 通过props 传递过来的参数不可被修改
    const btn = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "emitAdd"
    );
    const foo = h("p", {}, "some text in fool" + this.count);
    return h("div", {}, [btn, foo]);
  },
};
