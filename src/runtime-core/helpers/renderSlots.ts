import { createVNode, Fragment, Text } from "../vnode";

export function renderSlots(slots, key, props) {
  const slot = slots[key];
  if (slot) {
    if (typeof slot === "function") {
      return createVNode(Fragment, {}, slot(props));
    }
  }
}
