import { h, provide, inject } from "../../dist/ass-vue.esm.js";
//验证在当前注入的值在当前h 函数不会有值 需要等到在 下一个的时候才有值

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal"), provide("bar", "barVal");
    const foo = inject("foo")/*undefined*/;
    return { foo };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `provider foo:${this.foo}`),/*undefined*/
      h(ProviderTwo),
    ]);
  },
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooTwo Val");
    //是上一个Provider 注入的
    const foo = inject("foo") /*fooVal*/;
    return { foo };
  },
  render() {
    return h("div", {}, [h("p", {}, `providerTwo-${this.foo}`), h(Consumer)]);
  },
};
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    //这种写法是 下一个 会生效
    // const baz=inject("baz","bazDefault")
    //这种写法当前就会生效
    const baz = inject("baz", () => {
      return "ass";
    });
    console.log(foo, bar, baz)
    return { foo, bar, baz };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}-${this.baz}`);
  },
};

export default {
  name: "App",
  setup() { },
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};
