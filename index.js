'use strict';

function createVNode(type, props, children) {
    const vNode = { type, props, children };
    return vNode;
}

function createComponentInstance(vNode) {
    const component = {
        vNode,
        type: vNode.type,
    };
    return component;
}
function setupComponent(instance) {
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

function render(vNode, container) {
    //render 的时候啥也不干，就去调用patch方法
    //方便进行递归的处理
    patch(vNode);
}
function patch(vNode, container) {
    //处理组件
    //
    //element
    if (typeof vNode.type === "object") {
        console.log("component 类型");
        processComponent(vNode);
    }
    else {
        console.log("element 类型");
    }
}
function processComponent(vNode, container) {
    //处理组件
    //先去mountComponent
    mountComponent(vNode);
}
function mountComponent(vNode, container) {
    /*
  1. 通过vNode 创建组件实例对象
  2. 通过组件实例对象来初始化组件(component) 处理props 处理slot 处理当前组件调用setup返回出来的值
  3. 创建renderEffect
  */
    const instance = createComponentInstance(vNode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    //subTree 就是虚拟节点树
    /*
      vNode ->patch
      vNode -> element  mountElement
      */
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        //接收一个根容器，在页面上存在的元素节点
        mount(rootContainer) {
            // 现在把所有的component转化成VNode
            //先把所有的东西转化成一个虚拟节点VNode
            //之后所有的逻辑操作都会基于虚拟节点做操作
            const vNode = createVNode(rootComponent);
            render(vNode);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
