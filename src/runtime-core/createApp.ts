import {createVNode} from './vnode'
import {render} from './renderer'

// 接收一个rootComponent 然后返回一个对象 里面有mount方法
//具体用法就像下面
//const rootContainer=document.getElementById("app")
//createApp(App).mount(rootContainer)
export function createApp(rootComponent){
    // 这时候的rootComponent 还是初始的状态
    // 就是一个对象里面有render方法，和setup方法等
    return {
        //接收一个根容器，在页面上存在的元素节点
        mount(rootContainer){
            // 现在把所有的component转化成VNode
            //先把所有的东西转化成一个虚拟节点VNode
            //之后所有的逻辑操作都会基于虚拟节点做操作
            const vNode=createVNode(rootComponent)
            render(vNode,rootContainer)
        }
    }
}
