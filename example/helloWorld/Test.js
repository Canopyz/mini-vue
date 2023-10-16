import { h } from '../../lib/mini-vue.esm.js'

export const Test = {
  setup(props) {
    console.log(props.message)
    return { msg: props.message }
  },
  render() {
    return h('div', null, this.message + ' ' + this.msg)
  },
}
