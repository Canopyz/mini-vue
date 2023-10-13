import { h } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {
    return { msg: 'Hello Vue 3!' }
  },
  render: () => h('div', 'hello'),
}
