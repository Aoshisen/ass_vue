import { createComponentInstance, setupComponent } from "./component";

export function render(vNode, container) {
  //render 的时候啥也不干，就去调用patch方法
  //方便进行递归的处理
  patch(vNode, container);
}

function patch(vNode, container) {
  //处理组件
  //
  //element
  if (typeof vNode.type === "object") {
    console.log("component 类型");
    processComponent(vNode, container);
  } else {
    console.log("element 类型");
  }
}

function processComponent(vNode, container) {
  //处理组件
  //先去mountComponent
  mountComponent(vNode, container);
}

function mountComponent(vNode, container) {
  /*
1. 通过vNode 创建组件实例对象
2. 通过组件实例对象来初始化组件(component) 处理props 处理slot 处理当前组件调用setup返回出来的值
3. 创建renderEffect 
*/

  const instance = createComponentInstance(vNode);

  setupComponent(instance);

  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();
  //subTree 就是虚拟节点树
  /* 
    vNode ->patch
    vNode -> element  mountElement 
    */
  patch(subTree, container);
}