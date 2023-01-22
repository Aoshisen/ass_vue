# 双端对比算法更新children

双端对比算法锁定中间乱序的部分的。

- 处理左侧
- 处理右侧
- 左侧一样（新的比老的长）把新创建的添加到尾部
- 右侧一样 (新的比老的长) 把新创建的添加到头部
- 左侧 老的比新的长 （删除）
- 右侧 老的比新的长 （删除）
- 中间对比
  - 创建新的 (在老的里面不存在，新的里面存在)
  - 删除老的 (在老的里面存在,新的里面不存在)
  - 移动 (在老的里面存在，新的里面也存在)

![alt 左侧对比](./static/left.png)

(ab)c
(ab)de
我们现在只需要确定左边位置不相等的元素的位置

如果是上面的情况的话，我们可以声明一个指针来记录当前两个children 从第几位开始前后不一样的

```typescript
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
```

如果是右边对比的情况的话

ca( de )
b( de )

我们可以从两个children 的长度来入手，这种作法也是很高端的，就是在循环的时候去改变两个children 的最后元素的下标，这样的话，我们判断的时候就不需要引入其他的变量。

```typescript
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

```

然后我们就可以确定两个children前后不一样的地方的范围了
之前的不一样children 的范围为 pointer -> preLastChildIndex
改变后不以样的children 的范围为 pointer -> nextLastChildIndex

那上面的例子就是
之前不一样的就是 0-1
新的不一样的 0-0

```typescript
//如果新的比老的长那么就循环创建新的
//这个判断是结合了左侧的对比以及右侧的对比的，新的比老的长的情况
// 比如 左侧的 prev:(ab) next:(ab)c
//比如右侧的 prev: (ab) next: c(ab)
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
          //循环创建新的元素,然后添加到指定的锚点的位置
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
    }
```

```typescript
//如果新的比老的少，那么就删除
//这种情况 也考虑了左侧以及右侧两种情况
// 比如左侧  prev:(ab)c next:(ab)
// 比如右侧  prev:c(ab) next:(ab)
 else if (pointer > nextLastChildIndex) {
      //老的比新的多
      while (pointer <= prevLastChildIndex) {
        hostRemove(prevChildrenArray[pointer].el);
        pointer++;
      }
    } 
```

```typescript
else {
  // 中间乱序部分的逻辑
}
```

NOTE: 注意在完成这个更新算法的时候，有几个值得注意的点

1. 我们申明了一个从左边查找元素不同的指针pointer 
2. 我们通过改变 前后两个children 的最后一个元素的下标的方式来确定了右边的元素的不一样的范围(起始范围)
3. 我们通过锚点的来解决了，新增加的元素的位置错位的问题，实际的api 调整是，dom 操作的 增加元素的方法是从parent.insert(el) 变成了parent.insertBefore(el,anchor)
