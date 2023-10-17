import {
  createTextVNode,
  h,
  getCurrentInstance,
  provide,
  inject,
} from '../../lib/mini-vue.esm.js'
import { Test } from './Test.js'

export const App = {
  setup(props) {
    console.log(getCurrentInstance())
    provide('foo', 1)
    provide('bar', 2)
    const foo = inject('foo')
    console.log('parent foo', foo)
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
            default: () => [h('div', {}, [createTextVNode('default')])],
            test: ({ message }) => createTextVNode(message),
          },
        ),
        h('div', {}, [createTextVNode('text')]),
      ],
    )
  },
}
