# 双端对比算法更新children -2

双端对比算法删除老children 里面存在且新children 里面不存在的节点

下面的例子
ab(cd)fg
ab(ec)fg

```typescript
      //中间对比
      let s1 = pointer;
      let s2 = pointer;

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
          hostRemove(prevChild.el);
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
          //确定新的元素存在
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

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

```

NOTE: 首先需要明确思路，我们现在只需要删除老的里面存在的元素，不需要管其他的

1. 现在我们已经定位到了需要对比的范围，我们就需要根据这个范围来优化我们的对比的算法
2. 然后我们需要优化对比的性能，如果循环的对比那么算法的时间复杂度为O(n) 如果我们需要优化我们的对比逻辑那么我们可以考虑把需要对比的数组映射成一个 map 数组，这样映射过后时间复杂度为 O(1)
3. 我们对新的children 数组进行遍历，然后对map 数组进行循环赋值

    ```typescript
        for (let i = s2; i <= nextLastChildIndex; i++) {
            const nextChild = nextChildrenArray[i];
            keyToNewIndexMap.set(nextChild.key, i);
        }
    ```

4. 然后我们对老的children(prevChildren) 进行循环的对比，如果之前的children 里面存在key，那么对比一下那么就给newIndex 赋值为当前prevChildren的key 如果用户没有指定key 的话，那么就只有循环的对比，循环范围为新的children 不同的范围

    ```typescript
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
    ```

5. 然后基于我们找到的newIndex 去删除老的节点,这时候需要需要注意，newIndex 是在新节点有并且老节点里面也有的元素，如果当前的newIndex 为undefined 那么就需要删除老节点里面对应的元素,如果查找到了newIndex 那么就需要我们循环的去调用patch 方法去看看元素还有啥不同的

    ```typescript
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          //如果查找到了
          //那么继续去patch 对比
          //确定新的元素存在
          patch(
            prevChild,
            nextChildrenArray[newIndex],
            container,
            parentComponent,
            null
          );
          patched++;
        }
    ```

6. 我们需要删除元素的时候需要传入的是实际的el 元素，*prevChild.el*

7. 如果我们新新的里面的children 里面的所有的元素都对比完了，那么就可以直接删除老的children         里面的元素我们声明总共需要patch的最大的patched数量，        然后patched 的数量初始化为0 然后在查找到对应的元素并处理完之后patched++ 

    ```typescript
      //新节点需要最多对比的数量
      //我们声明总共需要patch的最大的patched数量，然后patched 的数量初始化为0 
      //然后在查找到对应的元素并处理完之后patched++ 
      let toBePatched = nextLastChildIndex - pointer + 1;
      let patched = 0;
        if (patched >= toBePatched) {
                hostRemove(prevChild.el);
                continue;
                }

        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          //如果查找到了
          //那么继续去patch 对比
          //确定新的元素存在
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          patch(
            prevChild,
            nextChildrenArray[newIndex],
            container,
            parentComponent,
            null
          );
          patched++;
        }
    ```
