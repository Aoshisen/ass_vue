import { generator } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import transformElement from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

// import { describe, it, expect } from "vitest";
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
    const ast: any = baseParse("<div>hi,{{message}}</div>");
    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    });
    console.log("ast", ast.codegenNode.children);
    const { code } = generator(ast);
    expect(code).toMatchSnapshot();
  });
});
