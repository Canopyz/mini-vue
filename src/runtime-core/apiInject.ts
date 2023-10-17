import { getCurrentInstance } from './component'

export const provide = (key: any, value: any) => {
  const currentInstance = getCurrentInstance()
  let { provides } = currentInstance

  if (provides === currentInstance.parent?.provides) {
    provides = currentInstance.provides = Object.create(
      currentInstance.parent.provides,
    )
  }

  provides[key] = value
}

export const inject = (key: any, defaultValue: any) => {
  const currentInstance = getCurrentInstance()
  const { provides } = currentInstance

  return key in provides
    ? provides[key]
    : typeof defaultValue === 'function'
    ? defaultValue()
    : defaultValue
}
