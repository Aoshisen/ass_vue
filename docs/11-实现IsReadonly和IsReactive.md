# 实现IsReadonly 和 IsReactive

> 这个功能其实很简单的

**思路**
我们在读取创建出来的响应式对象的时候，读取任意一个属性都会去触发他的get操作，我们只要在get操作里面拦截相应的值，然后再把传递进去的isReadonly参数返回出去就好了

还有一种特殊情况就是说，那个值并不是我们创建的reactive对象，那么该Reactive对象就会是一个undefined 这种情况下直接返回!!undefined 即可，就取一下他的boolean值

再者，这两个全局变量的名字很重要，所以用的枚举类型

