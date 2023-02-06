import { generator } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe('codeGen', () => {
    it("string",() => { 
        const ast=baseParse("hi");

        transform(ast)

        const {code}=generator(ast)

        expect(code).toMatchSnapshot()
        
     })
});