import { isFunction } from '../shared'
import { ReactiveEffect } from './effect'
import { trackRefEffects, triggerRefEffects } from './ref'

export class ComputedRefImpl {
  private _value: any
  private dirty = true
  private effect: ReactiveEffect
  public deps: Set<ReactiveEffect> = new Set()
  constructor(
    getter: any,
    private setter?: any,
  ) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this.dirty) {
        this.dirty = true
        triggerRefEffects(this)
      }
    })
  }

  get value() {
    if (this.dirty) {
      this._value = this.effect.run()
      this.dirty = false
    }
    trackRefEffects(this)
    return this._value
  }

  set value(val: any) {
    if (this.setter) {
      this.setter(val)
    } else {
      console.warn('Cannot set readonly computed value')
    }
  }
}

export function computed(getterOrOptions: any) {
  if (isFunction(getterOrOptions)) {
    return new ComputedRefImpl(getterOrOptions)
  }

  return new ComputedRefImpl(getterOrOptions.get, getterOrOptions.set)
}
