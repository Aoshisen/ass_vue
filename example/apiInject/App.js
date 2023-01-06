import { h, provide, inject } from "../../lib/ass-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal"), provide("bar", "barVal");
    const foo = inject("foo");
    return { foo };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `provider foo:${this.foo}`),
      h(ProviderTwo),
    ]);
  },
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooTwo Val");
    const foo = inject("foo");
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
    // const baz=inject("baz","bazDefault")
    const baz = inject("baz", () => {
      return "ass";
    });
    return { foo, bar, baz };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}-${this.baz}`);
  },
};

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};
