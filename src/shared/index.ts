export const extend = Object.assign

export const isObject = (val: any) => val !== null && typeof val === 'object'

export const hasChanged = (newValue: any, value: any) =>
  !Object.is(newValue, value)

export const isFunction = (val: any) => {
  return typeof val === 'function'
}

export const hasOwn = (target: any, key: any) => {
  return Object.prototype.hasOwnProperty.call(target, key)
}
