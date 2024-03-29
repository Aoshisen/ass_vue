import { shallowReadonly, proxyRefs } from "@ass-vue/reactivity";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode: any, parent) {
  const component = {
    vnode,
    type: vnode.type,
    next: null,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
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
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  //setup => function || object
  // function => render 函数
  // object=> 注入到组件上下文中
  //TODO: function

  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }
  //保证组件的render是一定有值的
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  //假设是一定有render的
  //在这里去调用我们的render 函数
  //但是如果在这里面去引用我们的complier 模块的东西，这样会造成依赖的循环依赖；vue 是可以直接存在于运行时的，如果引入了complier 模块的话就不干净了；
  //注册了compiler 然后在这里使用
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }

  instance.render = Component.render;
}

let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}

//注册组件，在index里面去调用注册我们的compiler；
let compiler;
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
