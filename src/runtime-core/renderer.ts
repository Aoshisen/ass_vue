import { createJsxJsxClosingFragment } from "typescript";
import { isObject } from "../shared";
import { shapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  //render 的时候啥也不干，就去调用patch方法
  //方便进行递归的处理
  patch(vnode, container);
}

function patch(vnode, container) {
  //处理组件
  const { shapeFlag } = vnode;
  if (shapeFlag & shapeFlags.ELEMENT) {
    console.log("element 类型");
    processElement(vnode, container);
  } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
    console.log("component 类型");
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  //TODO: updateElement
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  //vnode =>element  =>div
  const { type, children, props, shapeFlag } = vnode;
  const el = document.createElement(type);
  vnode.el = el;

  for (const key in props) {
    const attributeValue = props[key];
    const isOn=(eventName:string)=>/^on[A-Z]/.test(eventName)
    if (isOn(key)) {
      const eventName=key.slice(2).toLocaleLowerCase()
      el.addEventListener(eventName, attributeValue);
    }else{
      const _attributeValue=Array.isArray(attributeValue)?attributeValue.join(" "):attributeValue
      el.setAttribute(key, _attributeValue);
    }
  }

  if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
    console.log("text");
    el.textContent = children;
  } else if (shapeFlag & shapeFlags.ARRAY_CHILDREN) {
    console.log("array");
    mountChildren(children, el);
  }
  container.appendChild(el);
}

function mountChildren(children, container) {
  children.map((v) => {
    patch(v, container);
  });
}

function processComponent(vnode, container) {
  //处理组件
  //先去mountComponent
  mountComponent(vnode, container);
}

function mountComponent(initialVNode, container) {
  /*
1. 通过initialVNode 创建组件实例对象
2. 通过组件实例对象来初始化组件(component) 处理props 处理slot 处理当前组件调用setup返回出来的值
3. 创建renderEffect 
*/

  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);

  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  //subTree 就是虚拟节点树
  /* 
    initialVNode ->patch
    initialVNode -> element  mountElement 
    */
  patch(subTree, container);
  // element=> mount
  initialVNode.el = subTree.el;
}
