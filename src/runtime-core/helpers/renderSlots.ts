import { createVNode } from "../vnode";

export function renderSlots(slots, key, props) {
  const slot = slots[key];
  if (slot) {
    if (typeof slot == "function") {
      return createVNode("div", {}, slot(props));
    }
  }
}
