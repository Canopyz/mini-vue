import { toHandlerKey } from '@xuans-mini-vue/shared'

export const emit = (instance, event, ...args) => {
  const { props } = instance

  const handlerName = toHandlerKey(event)
  const handler = props[handlerName]

  handler && handler(...args)
}
