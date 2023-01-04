import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: (event) => {},
  };
  //这里有点东西的啊,不想传递第一个参数等到emit调用的时候在传递,先把component填充好
  //填充emit的第一个参数
  component.emit = emit.bind(null, component);
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  //初始化一个有状态的component (有状态的组件和函数组件函数组件是没有任何状态的)
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  //在最开始的时候很简单，去调用setup 拿到setup的返回值就可以了
  const Component = instance.type;
  const { setup } = Component;

  //ctx

  const proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  instance.proxy = proxy;

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  //setup => function || object
  // function => render 函数
  // object=> 注入到组件上下文中
  //TODO: function

  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  //保证组件的render是一定有值的
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  //假设是一定有render的
  instance.render = Component.render;
}
