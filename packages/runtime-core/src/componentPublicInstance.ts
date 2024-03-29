import { hasOwn } from "@ass-vue/shared";

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance) => instance.slots,
  $props: (instance) => instance.props,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    //从setupState里面获取值
    const { setupState, props } = instance;
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
