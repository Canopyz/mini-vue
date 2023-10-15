import { h } from '../../lib/mini-vue.esm.js'

window.self = null
export const App = {
  setup() {
    return { msg: 'Hello Vue 3!' }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
      },
      [h('h1', null, this.msg), h('p', null, 'Hello World')],
    )
  },
}
