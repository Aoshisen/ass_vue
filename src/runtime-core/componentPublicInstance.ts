const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    //从setupState里面获取值
    const { setupState, props } = instance;
    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    if (key in publicPropertiesMap) {
      const publicGetter = publicPropertiesMap[key];
      return publicGetter(instance);
    }
  },
};
