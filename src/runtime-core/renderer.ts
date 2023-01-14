import { effect } from "../reactivity/effect";
import { EMPTY_OBJECT } from "../shared";
import { shapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRender(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  function render(vnode, container) {
    //render 的时候啥也不干，就去调用patch方法
    //方便进行递归的处理
    patch(null, vnode, container, null, null);
  }
  // n1,之前的vnode节点
  //n2，新的vnode节点
  function patch(n1, n2, container, parentComponent, anchor) {
    //处理组件
    const { shapeFlag, type } = n2;

    // 需要特殊处理我们的Fragment 类型的
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);

        break;
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & shapeFlags.ELEMENT) {
          // console.log("element 类型");
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
          // console.log("component 类型");
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      // init
      mountElement(null, n2, container, parentComponent, anchor);
    } else {
      //update
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    // console.log("patchElement");

    // console.log("n1", n1);

    // console.log("n2", n2);
    const prevProps = n1.props || EMPTY_OBJECT;
    const nextProps = n2.props || EMPTY_OBJECT;
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, prevProps, nextProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    debugger;
    //ArrayToText
    //先删除Array 然后再 添加文本
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const nextShapeFlag = n2.shapeFlag;
    const c2 = n2.children;
    if (nextShapeFlag & shapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & shapeFlags.ARRAY_CHILDREN) {
        //ArrayToText
        unMountChildren(n1.children);
      }
      if (c1 !== c2) {
        hostSetElementText(c2, container);
      }
    } else {
      //新的是一个数组类型的节点
      //所以我们需要去判断老的是否为文本节点还是数组
      if (prevShapeFlag & shapeFlags.TEXT_CHILDREN) {
        //TextToArray
        //删除之前的文本节点，mount 新的child数组
        hostSetElementText("", container);
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // ArrayToArray
        //c1 childrenArray1,c2 newChildrenArray
        console.log("ArrayToArray");

        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    prevChildrenArray,
    nextChildrenArray,
    container,
    parentComponent,
    anchor
  ) {
    //从零开始的下标
    let prevLastChildIndex = prevChildrenArray.length - 1;
    let nextLastChildIndex = nextChildrenArray.length - 1;
    let pointer = 0;

    function isSomeVNodeType(prevChild, nextChild) {
      return (
        prevChild.type === nextChild.type && prevChild.key === nextChild.key
      );
    }
    //左边
    while (pointer <= prevLastChildIndex && pointer <= nextLastChildIndex) {
      const prevChild = prevChildrenArray[pointer];
      const nextChild = nextChildrenArray[pointer];

      if (isSomeVNodeType(prevChild, nextChild)) {
        //如果相等的话那么就在执行一下patch 方法递归对比一下 其他节点
        patch(prevChild, nextChild, container, parentComponent, anchor);
      } else {
        //跳出循环
        break;
      }
      //指针后移动
      pointer++;
    }

    //右边对比
    while (pointer <= prevLastChildIndex && pointer <= nextLastChildIndex) {
      const rightPrevChild = prevChildrenArray[prevLastChildIndex];
      const rightNextChild = nextChildrenArray[nextLastChildIndex];
      if (isSomeVNodeType(rightNextChild, rightPrevChild)) {
        patch(
          rightPrevChild,
          rightNextChild,
          container,
          parentComponent,
          anchor
        );
      } else {
        break;
      }

      prevLastChildIndex--;
      nextLastChildIndex--;
    }

    if (pointer > prevLastChildIndex) {
      if (pointer <= nextLastChildIndex) {
        //如果新的比老的长
        console.log("新的比老的长");

        const nextPos = nextLastChildIndex + 1;
        const anchor =
          nextPos < nextChildrenArray.length
            ? nextChildrenArray[nextPos].el
            : null;

        while (pointer <= nextLastChildIndex) {
          patch(
            null,
            nextChildrenArray[pointer],
            container,
            parentComponent,
            anchor
          );
          pointer++;
        }
      }
    } else if (pointer > nextLastChildIndex) {
      //老的比新的多
      while (pointer <= prevLastChildIndex) {
        hostRemove(prevChildrenArray[pointer].el);
        pointer++;
      }
    } else {
      //中间对比
      let s1 = pointer;
      let s2 = pointer;

      //新节点需要最多对比的数量
      let toBePatched = nextLastChildIndex - pointer + 1;
      let patched = 0;
      //map 映射
      //如果用户给了key
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= nextLastChildIndex; i++) {
        const nextChild = nextChildrenArray[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      let newIndex;
      for (let i = s1; i <= prevLastChildIndex; i++) {
        const prevChild = prevChildrenArray[i];
        //看当前的key在不在老的节点建立的映射表里面
        //null undefined
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue;
        }
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
          //如果用户给了key
        } else {
          //如果用户没有给key
          for (let j = s2; j < nextLastChildIndex; j++) {
            if (isSomeVNodeType(prevChild, nextChildrenArray[j])) {
              newIndex = j;
              break;
            }
          }
        }

        //基于之前的节点去删除元素或者是新增元素
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          //如果查找到了
          //那么继续去patch 对比
          patch(
            prevChild,
            nextChildrenArray[newIndex],
            container,
            parentComponent,
            null
          );
          patched++;
        }
      }
    }
  }

  function unMountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      //remove
      //insert
      hostRemove(el);
    }
  }

  function patchProps(el, prevProps, nextProps) {
    //新的props 里面值改变了或者是新的props 里面的值为undefined
    if (nextProps !== prevProps) {
      for (const key in nextProps) {
        const prevProp = prevProps[key];
        const nextProp = nextProps[key];
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
      if (prevProps !== EMPTY_OBJECT) {
        for (const key in prevProps) {
          if (!(key in nextProps)) {
            hostPatchProp(el, key, prevProps[key], null);
          }
        }
      }
    }
  }

  //不依赖具体 的实现,而是依赖稳定的接口
  function mountElement(n1, n2, container, parentComponent, anchor) {
    //vnode =>element  =>div
    const { type, children, props, shapeFlag } = n2;
    //创建节点  new Element
    // const el = document.createElement(type);
    const el = hostCreateElement(type);
    //添加el属性
    n2.el = el;

    //设置节点属性   canvas el.x=10

    for (const key in props) {
      const attributeValue = props[key];
      hostPatchProp(el, key, null, attributeValue);
      // const isOn = (eventName: string) => /^on[A-Z]/.test(eventName);
      // if (isOn(key)) {
      //   const eventName = key.slice(2).toLocaleLowerCase();
      //   el.addEventListener(eventName, attributeValue);
      // } else {
      //   const _attributeValue = Array.isArray(attributeValue)
      //     ? attributeValue.join(" ")
      //     : attributeValue;
      //   el.setAttribute(key, _attributeValue);
      // }
    }

    if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
      // console.log("text");

      el.textContent = children;
    } else if (shapeFlag & shapeFlags.ARRAY_CHILDREN) {
      // console.log("array");
      mountChildren(children, el, parentComponent, anchor);
    }

    // 添加节点 canvas container.addChild(el)

    // container.appendChild(el);
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.map((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    //处理组件
    //先去mountComponent
    mountComponent(n1, n2, container, parentComponent, anchor);
  }

  function mountComponent(n1, n2, container, parentComponent, anchor) {
    /*
1. 通过initialVNode 创建组件实例对象
2. 通过组件实例对象来初始化组件(component) 处理props 处理slot 处理当前组件调用setup返回出来的值
3. 创建renderEffect 
*/

    const instance = createComponentInstance(n2, parentComponent);

    setupComponent(instance);

    setupRenderEffect(instance, n2, container, null);
  }

  function setupRenderEffect(instance, initialVNode, container, anchor) {
    //因为 count 改变的值是一个响应式对象，而我们需要收集到响应式对象改变所触发的依赖
    //所以我们在这里收集依赖
    //这里也是一次渲染逻辑的终点
    effect(() => {
      if (!instance.isMounted) {
        console.log("mount");

        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        //subTree 就是虚拟节点树
        /* 
    initialVNode ->patch
    initialVNode -> element  mountElement 
    */
        // patch(vnode,container,parent)
        patch(null, subTree, container, instance, anchor);
        // element=> mount
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        //更新subTree
        instance.subTree = subTree;
        console.log("mounted", prevSubTree);
        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }

  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1, n2, container) {
    const { children } = n2;
    //对el赋值
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  return {
    createApp: createAppAPI(render),
  };
}
