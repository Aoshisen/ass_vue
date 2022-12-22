import { isProxy, isReactive, reactive } from "../reactive";
describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 10 };
    const observer = reactive(original);
    //创建响应式对象，希望响应式对象能读取到之前的值
    expect(observer.foo).toBe(10);
    //希望响应式对象和原来的值是两个不同的引用
    expect(observer).not.toBe(original);
    //IsReactive
    expect(isReactive(original)).toBe(false);

    expect(isReactive(observer)).toBe(true);
    
    expect(isProxy(observer)).toBe(true)
  });
  it("nested reactive",()=>{
    const original={
      nested:{
        foo:1
      },array:[{bar:2}]
    }
    const observer=reactive(original)
    expect(isReactive(observer.nested)).toBe(true)
    expect(isReactive(observer.array)).toBe(true)
    expect(isReactive(observer.array[0])).toBe(true)
  })
});
