import { effect } from "../effect";
import { reactive } from "../reactive";
import { ref, isRef, unRef, proxyRefs } from "../ref";

describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("should be reactive", () => {
    //创建一个对象
    const a = ref(1);
    let dummy;
    let calls = 0;
    //然后去通过effect 做依赖收集
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    //改变value的值我们希望依赖被触发
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    //same value should not trigger
    //如果改变的值和原有的数据相等那么就不进行触发依赖
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const a = ref({ count: 1 });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it("isRef", () => {
    const a = ref(1);
    const user = reactive({ age: 1 });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRefs get", () => {
    const user = { age: ref(10), name: "xiaoming" };
    const proxyUser=proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe("xiaoming")
  });

  it("proxyRefs set", () => {
    const user = { age: ref(10), name: "xiaoming" };
    const proxyUser=proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe("xiaoming")
  });
  
});
