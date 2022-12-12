import {reactive} from "../reactive"
describe("reactive",()=>{
    it("happy path",()=>{
        const original={foo:10};
        const observer=reactive(original)
        //创建响应式对象，希望响应式对象能读取到之前的值
        expect(observer.foo).toBe(10)
        //希望响应式对象和原来的值是两个不同的引用
        expect(observer).not.toBe(original)
    })
})