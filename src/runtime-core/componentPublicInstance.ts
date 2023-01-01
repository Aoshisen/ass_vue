const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    //从setupState里面获取值
    const { setupState } = instance;
    if (key in setupState) {
      return setupState[key];
    }

    if (key in publicPropertiesMap) {
      const publicGetter = publicPropertiesMap[key];
      return publicGetter(instance);
    }
  },
};
