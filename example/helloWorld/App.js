import { h } from '../../lib/mini-vue.esm.js'
import { Test } from './Test.js'

window.self = null
export const App = {
  setup(props) {
    return { msg: 'Hello Vue 3!' }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
        onClick: () => {
          console.log('click')
        },
      },
      [h(Test, { message: this.msg }, null)],
    )
  },
}
