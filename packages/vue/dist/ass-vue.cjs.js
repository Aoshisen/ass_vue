const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    //下面的就是初始的type
    // {
    //   render() {
    //     return h(
    //       "div",
    //       {
    //         id: "root",
    //         class: ["red"],
    //         onClick() {
    //           console.log("this is app div onclick");
    //         },
    //         onMousedown() {
    //           console.log("mouseDown,app");
    //         },
    //       },
    //       [h("p", { class: "red" }, "hi red"), h(Foo, { count: 1 })]
    //     );
    //   },
    //   setup() {
    //     return {
    //       msg: "ass-vue",
    //     };
    //   },
    // };
    const vnode = {
        type,
        props,
        children,
        component: null,
        el: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
    };
    // 处理children的flag
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* shapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* shapeFlags.ARRAY_CHILDREN */;
    }
    //现在这个vnode 可以标识element 类型也可标识 stateful_component 类型的组件
    //也可以在vnode上面直接体现children 的类型，是需要即将渲染的text_children 还是需要path继续处理的array-children
    //处理slots 的flog
    if (vnode.shapeFlag & 2 /* shapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* shapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* shapeFlags.ELEMENT */
        : 2 /* shapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, key, props) {
    const slot = slots[key];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function toDisplayString(val) {
    return String(val);
}

const extend = Object.assign;
const EMPTY_OBJECT = {};
function isObject(val) {
    return val !== null && typeof val === "object";
}
function isString(val) {
    return typeof val === "string";
}
function hasChanged(value, newValue) {
    return !Object.is(newValue, value);
}
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
//emit function
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};
//add-foo -addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};

//创建activeEffect 的实例的类
//map 对象就像是一个对象，但是这个对象里面的键可以是任何类型的属性
let targetMap = new Map();
//当前的target key 值被 get 的时候 的函数的自定义包装
let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        activeEffect = this;
        //实现调用run方法的时候需要得到fn的返回值
        //在这里的时候会收集依赖
        //用shouldTrack来做区分
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        //this就是当前active 的runner
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    //每一个dep都是一个set对象
    effect.deps.forEach((dep) => dep.delete(effect));
    effect.deps.length = 0;
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function track(target, key) {
    if (!isTracking())
        return;
    //取到target 上面存的key值
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        //这里初始化的时候dep就是空
        depsMap.set(key, dep);
    }
    //添加当前活动的effect
    //只有当调用effect 的时候，才会生成activeEffect
    trackEffects(dep);
    //得到了类似于下面这种结构
    // 1. target 通过target 存储自身
    // 2. target 通过target 拿到自身
    // 3. target key 通过target的key值存储在target 里面
    // 4. target key 通过target拿到targetMap 然后通过targetMap.get(key)来拿到自身
    // 5. target key 可以通过add 方法添加自身到指定的地方，以及对自身的属性再进行操作；
    // 6. 相当于建立了一个对应的关系，连了个线，各自的数据储存在各自的位置，现在这个map数据结构只是把内存地址相互关联了一下
    //因为依赖的项都是不重复的函数，那么可以用set这个数据结构来存储
    // let dep =new Set()
    //然后把 target key 对应起来
    //target=> key => dep
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    //触发所有收集起来的effect
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    let _effect = new ReactiveEffect(fn, options.scheduler);
    // _effect.onStop = options.onStop;
    // Object.assign(_effect,options)
    extend(_effect, options);
    //在run 的时候顺带绑定activeEffect 为当前活动的effect
    _effect.run();
    const runner = _effect.run.bind(_effect);
    //把effect 挂载到runner 上面好通过stop方法停止
    runner.effect = _effect;
    //以当前这个effect的实例作为run 方法的this的指向
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        const res = Reflect.get(target, key);
        if (key === "__v_isReadonly" /* reactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        else if (key === "__v_isReactive" /* reactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (shallow) {
            return res;
        }
        if (!isReadonly) {
            track(target, key);
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`target ${target} is readonly, ${key.toString()} can not be set to ${value}`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    else {
        return new Proxy(target, baseHandlers);
    }
}
const isReadonly = (value) => {
    return !!value["__v_isReadonly" /* reactiveFlags.IS_READONLY */];
};
const isReactive = (value) => {
    return !!value["__v_isReactive" /* reactiveFlags.IS_REACTIVE */];
};
const isProxy = (value) => {
    return isReactive(value) || isReadonly(value);
};

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 1.看看value是不是对象，如果不是直接返回，如果是那么就处理包裹一下
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        //这里需要收集依赖
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        //这里需要触发依赖
        //如果对比的话那么对象
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function isRef(value) {
    return !!value.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function ref(value) {
    return new RefImpl(value);
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            //如果是ref的话就返回ref.value,如果不是ref的话那么就返回target.key
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newValue) {
            if (isRef(target[key]) && !isRef(newValue)) {
                return (target[key].value = newValue);
            }
            else {
                return Reflect.set(target, key, newValue);
            }
        },
    });
}

function emit(instance, event, ...arg) {
    const { props } = instance;
    //TPP
    // 先去写一个特定的行为然后再重构成一个通用的行为
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...arg);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
    $props: (instance) => instance.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        //从setupState里面获取值
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        if (key in publicPropertiesMap) {
            const publicGetter = publicPropertiesMap[key];
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, childrenObject) {
    //     instance.slots = Array.isArray(children) ? children : [children];
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* shapeFlags.SLOT_CHILDREN */) {
        normalizeSlotObject(instance.slots, childrenObject);
    }
}
function normalizeSlotObject(slots, childrenObject) {
    for (const key in childrenObject) {
        const slot = childrenObject[key];
        slots[key] = (props) => normalizeSlotValue(slot(props));
    }
}
function normalizeSlotValue(slot) {
    return Array.isArray(slot) ? slot : [slot];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: (event) => { },
    };
    //这里有点东西的啊,不想传递第一个参数等到emit调用的时候在传递,先把component填充好
    //填充emit的第一个参数
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    //初始化一个有状态的component (有状态的组件和函数组件函数组件是没有任何状态的)
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    //在最开始的时候很简单，去调用setup 拿到setup的返回值就可以了
    const Component = instance.type;
    const { setup } = Component;
    //ctx
    const proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    instance.proxy = proxy;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    //setup => function || object
    // function => render 函数
    // object=> 注入到组件上下文中
    //TODO: function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    //保证组件的render是一定有值的
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    //假设是一定有render的
    //在这里去调用我们的render 函数
    //但是如果在这里面去引用我们的complier 模块的东西，这样会造成依赖的循环依赖；vue 是可以直接存在于运行时的，如果引入了complier 模块的话就不干净了；
    //注册了compiler 然后在这里使用
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
//注册组件，在index里面去调用注册我们的compiler；
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    // 存数据
    let currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        let parentProvides = currentInstance.parent.provides;
        //原型链对接
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        // init
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    //取数据
    //取父级组件的instance的providers
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            else if (typeof defaultValue === "string") {
                return defaultValue;
            }
        }
    }
}

// import {render} from './renderer'
function createAppAPI(render) {
    return function createApp(rootComponent) {
        // 这时候的rootComponent 还是初始的状态
        // 就是一个对象里面有render方法，和setup方法等
        return {
            //接收一个根容器，在页面上存在的元素节点
            mount(rootContainer) {
                // 现在把所有的component转化成VNode
                //先把所有的东西转化成一个虚拟节点VNode
                //之后所有的逻辑操作都会基于虚拟节点做操作
                const vNode = createVNode(rootComponent);
                render(vNode, rootContainer);
            },
        };
    };
}

function shouldUpdateComponent(n1, n2) {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    for (let key in nextProps) {
        if (prevProps[key] !== nextProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
const promiseResolve = Promise.resolve();
let isFlushPending = false;
function queueJobs(job) {
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
    nextTick(flushJob);
}
function flushJob() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}
function nextTick(fn) {
    return fn ? promiseResolve.then(fn) : promiseResolve;
}

function createRender(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
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
                if (shapeFlag & 1 /* shapeFlags.ELEMENT */) {
                    // console.log("element 类型");
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* shapeFlags.STATEFUL_COMPONENT */) {
                    // console.log("component 类型");
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // init
            mountElement(null, n2, container, parentComponent, anchor);
        }
        else {
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
        //ArrayToText
        //先删除Array 然后再 添加文本
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const nextShapeFlag = n2.shapeFlag;
        const c2 = n2.children;
        if (nextShapeFlag & 4 /* shapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* shapeFlags.ARRAY_CHILDREN */) {
                //ArrayToText
                unMountChildren(n1.children);
            }
            if (c1 !== c2) {
                hostSetElementText(c2, container);
            }
        }
        else {
            //新的是一个数组类型的节点
            //所以我们需要去判断老的是否为文本节点还是数组
            if (prevShapeFlag & 4 /* shapeFlags.TEXT_CHILDREN */) {
                //TextToArray
                //删除之前的文本节点，mount 新的child数组
                hostSetElementText("", container);
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // ArrayToArray
                //c1 childrenArray1,c2 newChildrenArray
                console.log("ArrayToArray");
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(prevChildrenArray, nextChildrenArray, container, parentComponent, anchor) {
        //从零开始的下标
        let prevLastChildIndex = prevChildrenArray.length - 1;
        let nextLastChildIndex = nextChildrenArray.length - 1;
        let pointer = 0;
        function isSomeVNodeType(prevChild, nextChild) {
            return (prevChild.type === nextChild.type && prevChild.key === nextChild.key);
        }
        //左边
        while (pointer <= prevLastChildIndex && pointer <= nextLastChildIndex) {
            const prevChild = prevChildrenArray[pointer];
            const nextChild = nextChildrenArray[pointer];
            if (isSomeVNodeType(prevChild, nextChild)) {
                //如果相等的话那么就在执行一下patch 方法递归对比一下 其他节点
                patch(prevChild, nextChild, container, parentComponent, anchor);
            }
            else {
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
                patch(rightPrevChild, rightNextChild, container, parentComponent, anchor);
            }
            else {
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
                const anchor = nextPos < nextChildrenArray.length
                    ? nextChildrenArray[nextPos].el
                    : null;
                while (pointer <= nextLastChildIndex) {
                    patch(null, nextChildrenArray[pointer], container, parentComponent, anchor);
                    pointer++;
                }
            }
        }
        else if (pointer > nextLastChildIndex) {
            //老的比新的多
            while (pointer <= prevLastChildIndex) {
                hostRemove(prevChildrenArray[pointer].el);
                pointer++;
            }
        }
        else {
            //中间对比
            let s1 = pointer;
            let s2 = pointer;
            //新节点需要最多对比的数量
            let toBePatched = nextLastChildIndex - pointer + 1;
            let patched = 0;
            //map 映射
            //如果用户给了key
            const keyToNewIndexMap = new Map();
            //创建一个定长的数组这样性能是最好的
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            //0代表是没有赋值
            for (let i = 0; i < toBePatched; i++) {
                //初始化映射表
                newIndexToOldIndexMap[i] = 0;
            }
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
                }
                else {
                    //如果用户没有给key
                    for (let j = s2; j <= nextLastChildIndex; j++) {
                        if (isSomeVNodeType(prevChild, nextChildrenArray[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                //基于之前的节点去删除元素或者是新增元素
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    //如果查找到了
                    //那么继续去patch 对比
                    //确定新的元素存在
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, nextChildrenArray[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            //最长递增子序列
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                //在确定新的children 里面有对应的节点的时候给 newIndexToOldIndexMap 的对应位置赋值
                const nexIndex = i + s2;
                const nextChild = nextChildrenArray[nexIndex];
                const anchor = nexIndex + 1 < nextChildrenArray.length
                    ? nextChildrenArray[nexIndex + 1].el
                    : null;
                //创建新的元素
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        //调用insert 方法 ，但是insert 方法需要基于后面一个元素插入，所以我们需要先把后面的元素先确定好然后再插入前面的元素
                        // 所以这边的循环就要换一下
                        console.log("移动位置");
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
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
        if (shapeFlag & 4 /* shapeFlags.TEXT_CHILDREN */) {
            // console.log("text");
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* shapeFlags.ARRAY_CHILDREN */) {
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
        if (!n1) {
            //如果n1不存在那么就是第一次创建 ，那么就先去挂载组件
            mountComponent(n2, container, parentComponent);
        }
        else {
            //如果n1存在那么就去更新组件
            updateComponent(n1, n2);
        }
        //todo:updateComponent
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        /*
    1. 通过initialVNode 创建组件实例对象
    2. 通过组件实例对象来初始化组件(component) 处理props 处理slot 处理当前组件调用setup返回出来的值
    3. 创建renderEffect
    */
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, null);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        //因为 count 改变的值是一个响应式对象，而我们需要收集到响应式对象改变所触发的依赖
        //所以我们在这里收集依赖
        //这里也是一次渲染逻辑的终点
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log("mount");
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
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
            }
            else {
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
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                //更新subTree
                instance.subTree = subTree;
                console.log("mounted", prevSubTree);
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                //控制函数不能立即执行
                console.log("scheduler");
                queueJobs(instance.update);
            },
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
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
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (eventName) => /^on[A-Z]/.test(eventName);
    if (isOn(key)) {
        const eventName = key.slice(2).toLocaleLowerCase();
        el.addEventListener(eventName, nextVal);
    }
    else {
        const _val = Array.isArray(nextVal) ? nextVal.join(" ") : nextVal;
        if (nextVal === undefined || nextVal === null) {
            console.log("undefined or null");
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, _val);
        }
    }
}
function insert(el, container, anchor) {
    return container.insertBefore(el, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(text, container) {
    container.textContent = text;
}
const renderer = createRender({
    insert,
    patchProp,
    createElement,
    remove,
    setElementText,
});
//通过createApp 把dom 创建元素的方法默认传递给createApp
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRender: createRender,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs,
    isRef: isRef,
    unRef: unRef,
    shallowReadonly: shallowReadonly,
    isProxy: isProxy,
    isReactive: isReactive,
    isReadonly: isReadonly,
    reactive: reactive,
    readonly: readonly,
    effect: effect
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

function generator(ast) {
    const context = createCodegenContext();
    const { push } = context;
    const args = ["_ctx", "_cache"];
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}) {`);
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length) {
        push(`const {${ast.helpers.map(aliasHelper).join(", ")}}=${VueBinging}`);
    }
    push("\n");
    push("return ");
}
function genNode(node, context) {
    // console.log("genNode>>>>>>", node);
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpress(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // genNode(children, context);
    const nodeList = genNullable([tag, props, children]);
    genNodeList(nodeList, context);
    push(")");
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function genNodeList(nodes, context) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            context.push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            context.push(",");
        }
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genExpress(node, context) {
    context.push(`${node.content}`);
}
function genCompoundExpression(node, context) {
    const { push } = context;
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

function baseParse(content) {
    const context = createContext(content);
    return createRoot(parseChildren(context, []));
}
function createRoot(children) {
    return { children, type: 4 /* NodeTypes.ROOT */ };
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s.startsWith("<")) {
            //解析<div></div>
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        else {
            //解析text类型
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    //当遇到借宿标签的时候就是end
    //当context.source 没有值的时候就是end
    const s = context.source;
    if (s.startsWith("</")) {
        //遇到结束标记的时候我们需要拿到我们的已经处理了的tag列表来判断一下
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    return !s;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.Start */);
    //收集我们的element
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    //弹出我们的处理完的element
    ancestors.pop();
    //判断结束标签是否和开始标签一样；如果一样就销毁掉，如果不一样就抛出错误
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
//parseTag 有两个作用，如果是以< 开始的，那么就返回我们的tag 以及type,然后推进我们的context
//如果是以结尾，那么就推进context就行了，不用返回什么东西
function parseTag(context, type) {
    //Implement
    // 1.解析tag
    // 2.删除处理完成的代码
    // 正则匹配
    const reg = new RegExp(/^<\/?([a-z]*)/i);
    const match = reg.exec(context.source);
    const tag = match[1];
    // console.log(match,"match<<");
    //推进我们解析后的代码
    advanceBy(context, match[0].length);
    //删除我们的左边的右边的闭合尖括号
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
function parseInterpolation(context) {
    //{{message}}
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    //从{{ 开始找}}
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    //剔除掉{{
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length;
    //得到message  截取得到
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    //推进 提出掉 message}}
    // console.log("context", context);
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createContext(content) {
    return {
        source: content,
    };
}
function parseText(context) {
    //1.获取当前的内容
    //推进字符串
    //判断结束符,遇到结束符号就停止
    let endIndex = context.source.length;
    const endTokens = ["{{", "<"];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, content.length);
    return content;
}

//传入nodeTransform 属性到options 里面，就会执行transform 然后改造我们的node
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    travelNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
//rootCodegen Node for codegen
function createRootCodegen(root, context) {
    const { children } = root;
    const child = children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */ && child.codegenNode) {
        const codegenNode = child.codegenNode;
        root.codegenNode = codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function travelNode(node, context) {
    // console.log("travelNode>>>>>>>>>>>",node);
    //因为调用的时候会去改变我们的text 类型的结构，变成我们的复合类型，所以我们设计一下，先把我们的 复合类型函数收集起来，然后等我们的text 节点类型处理完成之后然后再去处理复合类型的函数
    const exitFn = [];
    const nodeTransforms = context.nodeTransforms;
    for (let i = 0; i < nodeTransforms.length; i++) {
        const nodeTransform = nodeTransforms[i];
        const onExit = nodeTransform(node, context);
        if (onExit) {
            exitFn.push(onExit);
        }
    }
    // console.log("travelNode>>>>end",node)
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 2 /* NodeTypes.ELEMENT */:
        case 4 /* NodeTypes.ROOT */:
            travelChildren(node, context);
            break;
    }
    //这里的设计非常巧妙，刚开始的时候我们的i是length ，然后循环一次i减少1，然后我们如果到0的时候也不会越界；
    let i = exitFn.length;
    while (i--) {
        exitFn[i]();
    }
}
function travelChildren(parent, context) {
    parent.children.forEach((node) => {
        travelNode(node, context);
    });
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // context.helper(CREATE_ELEMENT_VNODE);
            //tag
            const vnodeTag = `'${node.tag}'`;
            //props
            let vnodeProps;
            //children
            const children = node.children;
            const vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    //复合类型节点不会进来
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 0 /* NodeTypes.INTERPOLATION */ || node.type === 3 /* NodeTypes.TEXT */;
}

//因为需要延后执行，所以我们返回一个函数
function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
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
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            //数组删除了数组结构发生了变化，保证指向正确
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generator(ast);
}

// ass-vue 的出口文件
function compileToFunction(template) {
    const { code } = baseCompile(template);
    //这里的code 就是我们代码compile 生成的代码；第一个参数是我们的函数参数
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRender, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, nextTick, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlots, shallowReadonly, toDisplayString, unRef };
