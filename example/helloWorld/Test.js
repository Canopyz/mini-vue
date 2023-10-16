import { h } from '../../lib/mini-vue.esm.js'

export const Test = {
  setup(props, { emit }) {
    const emitTest = () => {
      emit('change', 'hello')
      emit('foo-bar', 1, 2)
    }
    return { emitTest }
  },
  render() {
    return h('button', { onClick: this.emitTest }, 'button')
  },
}
