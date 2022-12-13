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
    user.age++;
    // //期望effect包裹的函数能够在user的set操作完成之后触发
    expect(nextAge).toBe(12);
  });

  it.skip("should return runner when call effect",()=>{
    //我们调用effect（fn）之后是会返回一个function的runner ，当调用这个function(runner) 的时候，就会再执行一下这个effect 函数，并且这个时候会返回effect 函数执行的值的
    let foo =10;
    //希望effect 函数执行之后返回的是一个runner函数
    const runner=effect(()=>{
      foo++;
      return "foo";
    })
    //期待第一次的effect 函数是会调用传递进去的fn的
    expect(foo).toBe(11)
    //我们把返回函数执行一遍，期待传递进去的函数再次被调用
    const r=runner()
    expect(foo).toBe(12)
    //然后我们还期待runner函数的返回值是传递进去的函数的 返回值
    expect(r).toBe("foo")
  })
});
