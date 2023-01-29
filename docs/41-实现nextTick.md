# 实现nextTick 功能

现在遇到的问题

```javascript
import { h, ref, getCurrentInstance,nextTick } from "../../lib/ass-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();
    async function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
      }
      debugger;

      //在这里因为是异步任务所以拿不到最新的instance
        console.log(instance, "instance");
      nextTick(()=>{
        //在nextTick中拿到最新的instance
        console.log(instance, "instance");
      })
      //或者使用这样使用
      await nextTick();
      console.log(instance,"instance");

    } return { onClick, count };
  },
  render() {
    {
      const button = h("button", { onClick: this.onClick }, "update");
      const p = h("p", {}, "count" + this.count);
      return h("div", {}, [button, p]);
    }
  },
};
```

我们点击按钮的时候视图是会更新，但是会更新99次，这造成了极大了性能浪费，而我们等到循环完成之后，更新一次这个组件实现的效果是一样的,我们更新逻辑是在effect 里面操作的，我们现在需要控制effect 的执行

之前实现effect 的时候我们用scheduler 配置来控制我们的effect 不执行fn 而我们 已经通过instance.update 来保存了我们的effect 返回的runner 我们就可以在需要用到的时候调用runner 就行了，所以我们改造一下我们的 instance.update 函数

```typescript
// renderer.ts
  function setupRenderEffect(instance, initialVNode, container, anchor) {
    //因为 count 改变的值是一个响应式对象，而我们需要收集到响应式对象改变所触发的依赖
    //所以我们在这里收集依赖
    //这里也是一次渲染逻辑的终点
    instance.update = effect(
      () => {
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
          //
          console.log("update");
          //更新组件的props
          //需要一个更新之后的虚拟节点

          const { next, vnode } = instance;

          if (next) {
            vnode.el = next.el;
            updateComponentPreRender(instance, next);
          }

          const { proxy } = instance;
          const subTree = instance.render.call(proxy);
          const prevSubTree = instance.subTree;
          //更新subTree
          instance.subTree = subTree;
          console.log("mounted", prevSubTree);
          patch(prevSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          //控制函数不能立即执行
          console.log("scheduler");
          queueJobs(instance.update);
        },
      }
    );
  }
```

然后我们创建一个文件专门来处理我们的scheduler 里面的操作

```typescript
//我们需要一个队列来存放我们的job 然后等到所有的宏任务执行完成之后我们再去执行我们放在我们的queue里面的微任务
const queue: any[] = [];
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  //如果传入了fn 那么就创建一个微任务来存放这个函数

//取出微任务执行 
Promise.resolve().then(()=>{
let job;
//取出头部
while((job=queue.shift())){
    job&&job()
}
}
})

```

抽离逻辑

```typescript
const queue: any[] = [];
const promiseResolve = Promise.resolve();

let isFlushPending = false;
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

function queueFlush() {
  //取出job放到微任务里面执行
  Promise.resolve().then(()=>{
let job;
//取出头部
while((job=queue.shift())){
    job&&job()
}
}
  })
}
```

优化我们的性能，使得只创建一次promise

```typescript

let isFlushPending = false;
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

function queueFlush() {
  //取出job放到微任务里面执行
  if (isFlushPending) {
    return;
  }
  isFlushPending = true;
let job;
//取出头部
while((job=queue.shift())){
    job&&job()
}
}
}
```

nextTick 函数把函数加到最后执行

```typescript
//为了优化性能我们只需要一个promise.resolve()
const promiseResolve = Promise.resolve();
export function nextTick(fn) {
  return fn ? promiseResolve.then(fn) : promiseResolve;
}
//然后改写我们的queueFlush 函数
function queueFlush() {
  //取出job放到微任务里面执行
  if (isFlushPending) {
    return;
  }
  isFlushPending = true;
  nextTick(flushJob);
}
function flushJob() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
```

>NOTE

- 我们通过effect 的scheduler 中断我们的effect,使得不去更新视图
- 然后我们通过 instance.update 拿到一个需要执行的函数，然后加入到队列里面进行处理
- 通过我们的promise.resolve.then 创建微任务，并在微任务里面去拿到我们的job进行执行
- 通过nextTick 执行我们传递进来的函数，同样的也是把这个  传递进来的函数放在我们的微任务里面去执行
