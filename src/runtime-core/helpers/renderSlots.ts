import { h } from '../h'
import { Fragment } from '../vnode'

export const renderSlots = (slots: any, name: any, props: any) => {
  const slot = slots[name]
  if (slot) {
    if (typeof slot === 'function') {
      return h(Fragment, {}, slot(props))
    }
  }
}
