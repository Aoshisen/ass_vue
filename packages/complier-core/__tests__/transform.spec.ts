import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("transform", () => {
  it("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + "mini-vue";
      }
    };
    //通过插件注入的方法来动态的控制我们的代码执行 (就是我们的处理函数插件化，把写在travelNode 里面的逻辑抽离了出来)
    transform(ast, { nodeTransforms: [plugin] });
    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe("hi,mini-vue");
  });
});
