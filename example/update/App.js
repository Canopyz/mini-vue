import {
  createTextVNode,
  h,
  getCurrentInstance,
  provide,
  inject,
  ref,
} from '../../lib/mini-vue.esm.js'

export const App = {
  setup(props) {
    const count = ref(0)

    const onClick = () => {
      count.value++
    }

    return { count, onClick }
  },
  render() {
    return h(
      'button',
      {
        onClick: this.onClick,
      },
      this.count + '',
    )
  },
}
