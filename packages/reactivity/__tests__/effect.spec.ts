import { reactive } from "../src/reactive";
import { effect, stop } from "../src/effect";
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

  it("should return runner when call effect", () => {
    //我们调用effect（fn）之后是会返回一个function的runner ，当调用这个function(runner) 的时候，就会再执行一下这个effect 函数，并且这个时候会返回effect 函数执行的值的
    let foo = 10;
    //希望effect 函数执行之后返回的是一个runner函数
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    //期待第一次的effect 函数是会调用传递进去的fn的
    expect(foo).toBe(11);
    //我们把返回函数执行一遍，期待传递进去的函数再次被调用
    const r = runner();
    expect(foo).toBe(12);
    //然后我们还期待runner函数的返回值是传递进去的函数的 返回值
    expect(r).toBe("foo");
  });

  it("scheduler", () => {
    //1.通过effect 的第二个参数给定的一个scheduler 的fn
    //2. effect 第一次执行的时候 还会执行fn
    //3. 当响应式对象更新的时候不会执行fn了而是执行scheduler
    //4 .如果说执行runner 的时候会再次执行fn
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );
    //scheduler 就是effect 的第二个参数，在初始化的时候不会被调用
    expect(scheduler).not.toHaveBeenCalled();
    //然后第一次的时候是会被调用的，调用后dummy 就会被赋值为1
    expect(dummy).toBe(1);
    obj.foo++;
    //当obj 改变的时候会被调用scheduler
    expect(scheduler).toHaveBeenCalledTimes(1);
    //但是这个时候不会去更新dummy的值
    expect(dummy).toBe(1);
    //当执行run的时候才会被调用dummy
    run();
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    // 1. effect.ts 会导出一个stop函数，当调用stop函数，并且把runner(也就是effect的返回值传递给他时),再次触发trigger 也就是触发响应式对象值得更新得时候，当前用户传递进来得依赖不会执行(就是effect包裹得函数不会执行)
    // 2. 当再次调用runner 的时候effect包裹的函数执行
    let dump;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dump = obj.prop;
    });
    obj.prop = 2;
    expect(dump).toBe(2);
    stop(runner);
    // obj.prop = 3;
    //这里会先去走get的操作，从而把清空的依赖重新收集了起来
    obj.prop++;
    expect(dump).toBe(2);

    //stopped effect should still be manually callable
    runner();
    expect(dump).toBe(3);
  });

  it("onStop", () => {
    const obj = reactive({ foo: 1 });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { onStop }
    );
    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
