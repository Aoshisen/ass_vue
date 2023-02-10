import { NodeTypes } from "../ast";

//因为需要延后执行，所以我们返回一个函数
export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      let currentContainer;
      const { children } = node;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        //判断当前的child 是不是普通的 hi 或者是插值类型
        if (isText(child)) {
          //找到下一个
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                //初始化
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push(" + ");
              currentContainer.children.push(next);
              children.splice(j, 1);
              //数组删除了数组结构发生了变化，保证指向正确
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}

function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}
