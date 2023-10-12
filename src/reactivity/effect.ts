import { extend } from '../shared/index'

export let activeEffect: ReactiveEffect | null = null
export let shouldTrack = true

export function isTracking() {
  return activeEffect !== null && shouldTrack
}

export class ReactiveEffect {
  deps: Set<ReactiveEffect>[] = []
  private active = true
  private onStop?: () => void

  constructor(
    private fn: Function,
    public scheduler?: Function | undefined,
  ) {}

  run() {
    if (!this.active) {
      return this.fn()
    }

    let parent = activeEffect
    activeEffect = this
    const lastShouldTrack = shouldTrack
    shouldTrack = true
    const res = this.fn()
    shouldTrack = lastShouldTrack
    activeEffect = parent

    return res
  }

  stop() {
    if (this.active) {
      cleanUpEffects(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanUpEffects(effect: ReactiveEffect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect)
  })

  effect.deps.length = 0
}

interface EffectOption {
  scheduler?: Function
  onStop?: () => void
}

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export function effect(fn: Function, options?: EffectOption) {
  const effect = new ReactiveEffect(fn, options?.scheduler)
  extend(effect, options)

  effect.run()

  const runner = effect.run.bind(effect) as ReactiveEffectRunner
  runner.effect = effect

  return runner
}

const targetMap = new Map()

export function trackEffects(deps: Set<ReactiveEffect>) {
  activeEffect = activeEffect!
  if (!deps.has(activeEffect)) {
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
  }
}

export function track(target, key) {
  if (!isTracking()) {
    return
  }

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let deps: Set<ReactiveEffect> = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }

  trackEffects(deps)
}

export function triggerEffects(deps: Set<ReactiveEffect>) {
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)

  if (!depsMap) {
    return
  }

  const deps = depsMap.get(key)

  if (!deps) {
    return
  }

  triggerEffects(deps)
}

export function stop(runner: ReactiveEffectRunner) {
  runner.effect?.stop()
}
