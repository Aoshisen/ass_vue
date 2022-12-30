export function createComponentInstance(vNode: any) {
  const component = {
    vNode,
    type: vNode.type,
  };
  return component;
}

export function setupComponent(instance) {
  //TODO:initProps
  //TODO:initSlots

  //初始化一个有状态的component (有状态的组件和函数组件函数组件是没有任何状态的)
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  //在最开始的时候很简单，去调用setup 拿到setup的返回值就可以了
  const Component = instance.type;

  const { setup } = Component;

  if (setup) {
    const setupResult = setup();
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
