import { ShapeFlags } from '@xuans-mini-vue/shared'

export const initSlots = (instance: any, children: any) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(children: any, slot: any) {
  for (const key in children) {
    const value = children[key]
    slot[key] = (props: any) => normalizeSlotValue(value(props))
  }
}

function normalizeSlotValue(value: any) {
  return Array.isArray(value) ? value : [value]
}
