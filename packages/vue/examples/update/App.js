import { h, ref } from "../../lib/ass-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const onClick = () => count.value++;
    const props = ref({
      foo: "foo",
      bar: "bar",
    });
    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    };
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };
    const onChangePropsDemo3 = () => {
      props.value = { foo: "foo" };
    };
    return {
      count,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      props,
    };
  },
  render() {
    return h("div", { id: "root", foo: this.props.foo, bar: this.props.bar }, [
      h("div", {}, "count:" + this.count),
      h("button", { onClick: this.onClick }, "click me to add 1"),
      h(
        "button",
        { onClick: this.onChangePropsDemo1 },
        "changePropsDemo props"
      ),
      h(
        "button",
        { onClick: this.onChangePropsDemo2 },
        "changeProps to null or undefined"
      ),
      h("button", { onClick: this.onChangePropsDemo3 }, "delete Props"),
    ]);
  },
};
