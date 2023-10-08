export let activeEffect: ReactiveEffect | null

export class ReactiveEffect {
  constructor(private fn: Function) {}

  run() {
    activeEffect = this
    this.fn()
  }
}

export function effect(fn: Function) {
  const effect = new ReactiveEffect(fn)

  effect.run()
}

const targetMap = new Map()

export function track(target, key) {
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

  if (activeEffect) {
    deps.add(activeEffect)
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

  for (const effect of deps) {
    effect.run()
  }
}
