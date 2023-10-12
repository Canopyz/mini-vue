export const extend = Object.assign

export const isObject = (val: any) => val !== null && typeof val === 'object'

export const hasChanged = (newValue: any, value: any) =>
  !Object.is(newValue, value)

export const isFunction = (val: any) => {
  return typeof val === 'function'
}
