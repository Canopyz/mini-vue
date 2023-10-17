import {
  h,
  renderSlots,
  createTextVNode,
  createFragment,
} from '../../lib/mini-vue.esm.js'

export const Test = {
  setup(props, { emit }) {
    const emitTest = () => {
      emit('change', 'hello')
      emit('foo-bar', 1, 2)
    }
    return { emitTest }
  },
  render() {
    return h('div', {}, [
      renderSlots(this.$slots, 'test', { message: 'scoped' }),
      h('button', { onClick: this.emitTest }, [createTextVNode('button')]),
      renderSlots(this.$slots, 'default', null),
      createFragment('test'),
    ])
  },
}
