import { h } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {
    return { msg: 'Hello Vue 3!' }
  },
  render: () =>
    h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
      },
      [
        h('span', { class: 'blue' }, 'Hello World!'),
        h('div', { class: 'red' }, 'test'),
        'string',
      ],
    ),
}
