import { shapeFlags } from "@ass-vue/shared";

export function initSlots(instance, childrenObject) {
  //     instance.slots = Array.isArray(children) ? children : [children];
  const { vnode } = instance;
  if (vnode.shapeFlag & shapeFlags.SLOT_CHILDREN) {
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
