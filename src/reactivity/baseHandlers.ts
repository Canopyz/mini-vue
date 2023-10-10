import { track, trigger } from './effect'
import { ReactiveFlags } from './reactive'

const getter = createGetter()
const readonlyGetter = createGetter(true)
const setter = createSetter()

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key)

    if (key === ReactiveFlags.REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.READONLY) {
      return isReadonly
    }

    if (!isReadonly) {
      track(target, key)
    }

    return res
  }
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value)

    trigger(target, key)

    return res
  }
}

export const mutableHandler = {
  get: getter,
  set: setter,
}

export const readonlyHandler = {
  get: readonlyGetter,
  set: (_, key) => {
    console.warn(`key: ${String(key)} set failed, because it is readonly`)
    return true
  },
}
