import { camelize, toHandlerKey } from "@ass-vue/shared";

export function emit(instance, event, ...arg) {
  const { props } = instance;
  //TPP
  // 先去写一个特定的行为然后再重构成一个通用的行为

  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...arg);
}
