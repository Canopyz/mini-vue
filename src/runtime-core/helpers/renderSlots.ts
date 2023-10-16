import { h } from '../h'

export const renderSlots = (slots: any, name: any, props: any) => {
  const slot = slots[name]
  if (slot) {
    if (typeof slot === 'function') {
      return h('div', {}, slot(props))
    }
  }
}
