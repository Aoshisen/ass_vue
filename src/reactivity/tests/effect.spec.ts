import { reactive } from "../reactive";
import { effect } from "../effect";
describe("effect", () => {
  it("happy path", () => {
    //创建一个响应式对象

    const user = reactive({
      age: 10,
    });

    let nextAge;

    //init
    effect(() => {
      //在effect函数里面去改变响应式对象的值,期望响应式对象的值能够通过user这个之前创建的变量拿到
      nextAge = user.age + 1;
    });
    //期望响应式对象的值为11
    expect(nextAge).toBe(11);
    //update
    // user.age++;
    // //期望effect包裹的函数能够在user的set操作完成之后触发
    // expect(nextAge).toBe(12);
  });
});
