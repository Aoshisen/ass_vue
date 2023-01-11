import { h } from "../../lib/ass-vue.esm.js";

import ArrayToText from "./ArrayToText.js";
import TextToText from './TextToText.js'
import TextToArray from "./TextToArray.js";
export const App = {
  name: "App",
  setup() {},
  render() {
    return h("div", { tId: 1 }, [
      h("p", {}, "主页"),
      //老的是Array，新的是text
      // h(ArrayToText),
      //老的是Text 新的是不同的text
      // h(TextToText),
      //老的是text 新的是Array
      h(TextToArray),
      //老的是Array 新的也是Array
      // h(ArrayToArray),
    ]);
  },
};
