# 双端对比算法更新element的children 移动逻辑

在前一小节中我们通过对比删除了新element 的children 中的老的里面存在新的里面不存在的元素
剩下的元素不出意外就是老的里面有新的里面也有的元素了（只是位置不一样而已）

举个例子 
ab(cde)fg
ab(ecd)fg

首先我们可以想到的是我们可以给所有的元素重新的排列一下位置（暴力的解法）
这样的解法就是我们先找到e,然后看看他在老的节点里面存不存在，如果存在的话就把他插入到b的后面，以此类推我们需要把c插入到e的后面，然后把d插入到c的后面

但是这样的话我们就会发现造成了很大的性能上面的浪费，我们通过分析可以知道我们的cd 是并没有移动位置的只是我们的e 的位置变化了而已，所以这一块需要通过其他的方式来实现，我们移动次数最少。这个时候就需要用到最长递增子序列了

```typescript
      //创建一个定长的数组这样性能是最好的
      const newIndexToOldIndexMap = new Array(toBePatched);
      //然后在确定了新数组里面有老节点里面的值的时候去给newIndexToOldIndexMap 赋值 上面的例子就应该是 234 =》342  
    //   但是我们首先还是需要给这个数组赋初值
    //0代表是没有赋值
        for (let i = 0; i < toBePatched; i++) {
            //初始化映射表
            newIndexToOldIndexMap[i] = 0;
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
        //在确定新的children 里面有对应的节点的时候给 newIndexToOldIndexMap 的对应位置赋值
        //但是赋值的值必须是不为0 的数，之前创建newIndexToOldIndexMap的时候规定的0 是未赋值的情况所以在这里为了不混淆就让 i+1
```

通过newIndexToOldIndexMap 的到最长递增子序列
然后插入元素，但是我们是基于insertBefore 这个api来进行元素的精准添加的，所以我们是基于后面一个元素来对前面一个元素进行固定
但是这样有一个问题，我们并不能确定我们后面一个元素的位置是否已经固定好了， 所以我们需要先 处理后面的元素，就是所谓的倒插法

```typescript

const increasingNewIndexSequence=getSequence(newIndexToOldIndexMap)
//我们通过两个指针循环新的children 以及increasingNewIndexSequence 来确定那些元素是需要移动的
      //最长递增子序列
      let j = increasingNewIndexSequence.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        //在确定新的children 里面有对应的节点的时候给 newIndexToOldIndexMap 的对应位置赋值
        const nexIndex = i + s2;
        const nextChild = nextChildrenArray[nexIndex];
        const anchor =
          nexIndex + 1 < nextChildrenArray.length
            ? nextChildrenArray[nexIndex + 1].el
            : null;

          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            //调用insert 方法 ，但是insert 方法需要基于后面一个元素插入，所以我们需要先把后面的元素先确定好然后再插入前面的元素
            // 所以这边的循环就要换一下
            console.log("移动位置");
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
        }
      }
```

优化我们的代码逻辑

- 因为我们的求最长递增子序列的算法的复杂度也是有的，所以我们需要判断一下当前的元素是否移动了，如果真的移动了的话我们才去运用最长递增子序列去移动
- 

```typescript
//基于之前的节点去删除元素或者是新增元素
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          //如果查找到了
          //那么继续去patch 对比
          //确定新的元素存在
          //如果当前的newIndex比maxNewIndexSoFar大 那么就证明没移动,如果有一个是小于前一个的，那么就移动了
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
        //对increasingNewIndexIndexSequence 的初值进行改变

      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
    
    
    //对 移动位置的函数进行二次条件判断
         if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            //调用insert 方法 ，但是insert 方法需要基于后面一个元素插入，所以我们需要先把后面的元素先确定好然后再插入前面的元素
            // 所以这边的循环就要换一下
            console.log("移动位置");
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
```

创建新的元素

```typescript
        //创建新的元素
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            //调用insert 方法 ，但是insert 方法需要基于后面一个元素插入，所以我们需要先把后面的元素先确定好然后再插入前面的元素
            // 所以这边的循环就要换一下
            console.log("移动位置");
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
```

> NOTE:

1. 使用最长递增子序列的先决条件是需要先建立一个新老的数组映射
2. 我们为了性能考虑，都选择创建定长的数组，数组最长的为新children 里面中间所有的元素的个数那么多，然后我们给这个数组所有都赋值成0
3. 我们在确定了新数组里面有老数组里面的特定元素之后，给newIndexToOldIndexMap的对应 位置赋值(值得注意的是我们的i 可能为0 ，而0 代表了初始未赋值的状态所以我们加了个1 来防止这种混淆产生)
*newIndexToOldIndexMap[newIndex - s3] = i + 1;*
4. 我们在得到了最长递增子序列之后需要和新的数组进行对比，为此我们需要两个锚点，来记录当前，如果当前元素不在最长递增子序列里面那么该元素就要移动，如果在最长递增子序列里面那么最长递增子序列的指针就移动
5. 我们插入元素的方法基于当前元素的后一个元素，如果从左到右的进行循环的话我们确定了当前元素的位置，但是后面一个元素的位置是没处理的，这样必定会导致问题，所以我们使用了倒叙遍历数组来先确定后面的元素然后基于后面已经处理好位置的元素插入之前的元素 
6. 优化是这个更新函数里面最重要的一个环节，所以我们需要判断当前的新的节点是否真正的需要移动这个操作，很容易的就可以知道如果不需要移动操作的话 序列 是 【1，2，3】 这种递增的序列，如果需要移动的话我们的序列 是像这种的 [2,3,1] 所以我们定义了两个变量 moved 和 maxNewIndexSoFar 来判断是否移动了

    ```typescript
            if (newIndex >= maxNewIndexSoFar) {
                maxNewIndexSoFar = newIndex;
            } else {
                moved = true;
            }
    ```

