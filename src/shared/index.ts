export * from './toDisplayString'

export const extend = Object.assign

export const EMPTY_OBJ = {}

export const isObject = (val: any) => val !== null && typeof val === 'object'

export const isString = (val) => typeof val === 'string'

export const hasChanged = (newValue: any, value: any) =>
  !Object.is(newValue, value)

export const isFunction = (val: any) => typeof val === 'function'

export const hasOwn = (target: any, key: any) =>
  Object.prototype.hasOwnProperty.call(target, key)

export const camelize = (str: string) =>
  str.replace(/-(\w)/g, (_, ch: string) => (ch ? ch.toUpperCase() : ''))

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const toHandlerKey = (str: string) =>
  str ? `on${capitalize(camelize(str))}` : ''
