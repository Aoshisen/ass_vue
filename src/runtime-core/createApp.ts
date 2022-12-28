import {createVNode} from './vNode'
import {render} from './renderer'

export function createApp(rootComponent){

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
