import { shapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  //render 的时候啥也不干，就去调用patch方法
  //方便进行递归的处理
  patch(vnode, container,null);
}

function patch(vnode, container, parentComponent) {
  //处理组件
  const { shapeFlag, type } = vnode;

  // 需要特殊处理我们的Fragment 类型的
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);

      break;
    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & shapeFlags.ELEMENT) {
        // console.log("element 类型");
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
        // console.log("component 类型");
        processComponent(vnode, container, parentComponent);
      }
      break;
  }
}

function processElement(vnode, container, parentComponent) {
  //TODO: updateElement
  mountElement(vnode, container, parentComponent);
}

function mountElement(vnode, container, parentComponent) {
  //vnode =>element  =>div
  const { type, children, props, shapeFlag } = vnode;
  const el = document.createElement(type);
  vnode.el = el;

  for (const key in props) {
    const attributeValue = props[key];
    const isOn = (eventName: string) => /^on[A-Z]/.test(eventName);
    if (isOn(key)) {
      const eventName = key.slice(2).toLocaleLowerCase();
      el.addEventListener(eventName, attributeValue);
    } else {
      const _attributeValue = Array.isArray(attributeValue)
        ? attributeValue.join(" ")
        : attributeValue;
      el.setAttribute(key, _attributeValue);
    }
  }

  if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
    // console.log("text");

    el.textContent = children;
  } else if (shapeFlag & shapeFlags.ARRAY_CHILDREN) {
    // console.log("array");
    mountChildren(children, el, parentComponent);
  }
  container.appendChild(el);
}

function mountChildren(children, container, parentComponent) {
  children.map((v) => {
    patch(v, container, parentComponent);
  });
}

function processComponent(vnode, container, parentComponent) {
  //处理组件
  //先去mountComponent
  mountComponent(vnode, container, parentComponent);
}

function mountComponent(initialVNode, container, parentComponent) {
  /*
1. 通过initialVNode 创建组件实例对象
2. 通过组件实例对象来初始化组件(component) 处理props 处理slot 处理当前组件调用setup返回出来的值
3. 创建renderEffect 
*/

  const instance = createComponentInstance(initialVNode, parentComponent);

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
  patch(subTree, container, instance);
  // element=> mount
  initialVNode.el = subTree.el;
}

function processFragment(vnode, container, parentComponent) {
  mountChildren(vnode.children, container, parentComponent);
}

function processText(vnode, container) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}
