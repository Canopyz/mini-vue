import { hasChanged } from '../shared'
import {
  ReactiveEffect,
  isTracking,
  trackEffects,
  triggerEffects,
} from './effect'
import { isReactive, toReactive } from './reactive'

export interface Ref<T = any> {
  value: T
}

export type MaybeRef<T = any> = Ref<T> | T

export class RefImpl<T> {
  private _value: T
  private _rawValue: T
  private deps: Set<ReactiveEffect> = new Set()
  public readonly __v_isRef = true
  constructor(value: T) {
    this._value = toReactive(value)
    this._rawValue = value
  }

  get value() {
    if (isTracking()) {
      trackEffects(this.deps)
    }
    return this._value
  }

  set value(newValue: T) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
      this._value = toReactive(newValue)
      triggerEffects(this.deps)
    }
  }
}

export function ref<T = any>(value: T): Ref<T> {
  return new RefImpl<T>(value)
}

export function isRef(ref: any): ref is Ref {
  return !!(ref && ref.__v_isRef)
}

export function unRef<T>(ref: MaybeRef<T>): T {
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs<T extends object>(objectWithRefs: T): any {
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, {
        get(target, key) {
          return unRef(Reflect.get(target, key))
        },
        set(target, key, value) {
          if (isRef(target[key] && !isRef(value))) {
            target[key].value = value
            return true
          }
          return Reflect.set(target, key, value)
        },
      })
}
