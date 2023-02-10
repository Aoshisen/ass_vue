import { generator } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import transformElement from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

describe("codeGen", () => {
  it("string", () => {
    const ast = baseParse("hi");

    transform(ast);

    const { code } = generator(ast);

    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");

    transform(ast, { nodeTransforms: [transformExpression] });

    const { code } = generator(ast);

    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast = baseParse("<div></div>");
    transform(ast, { nodeTransforms: [transformElement] });
    const { code } = generator(ast);
    expect(code).toMatchSnapshot();
  });

  it("all type element", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    transform(ast, {
      nodeTransforms: [transformText],
    });
    const { code } = generator(ast);
    expect(code).toMatchSnapshot();
  });
});
