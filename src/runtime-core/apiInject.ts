import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存数据
  let currentInstance: any = getCurrentInstance();
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
export function inject(key, defaultValue) {
  //取数据
  //取父级组件的instance的providers
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      } else if (typeof defaultValue === "string") {
        return defaultValue;
      }
    }
  }
}
