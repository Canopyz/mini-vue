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
      },
      [
        h(
          Test,
          {
            message: this.msg,

            onChange: (a) => {
              console.log('onChange', a)
            },
            onFooBar: (a, b) => {
              console.log('onFooBar', a, b)
            },
          },
          {
            default: () => h('div', {}, 'default'),
            test: ({ message }) => message,
          },
        ),
      ],
    )
  },
}
