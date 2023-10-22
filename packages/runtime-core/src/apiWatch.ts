import { ReactiveEffect } from '../../reactivity/src/effect'
import { queuePreFlushJob } from './scheduler'

export const watchEffect = (source) => {
  const job = () => {
    effect.run()
  }

  let cleanup
  const onCleanup = (fn) => {
    cleanup = effect.onStop = fn
  }

  function getter() {
    cleanup && cleanup()

    source(onCleanup)
  }

  const effect = new ReactiveEffect(getter, () => {
    queuePreFlushJob(job)
  })

  effect.run()

  return () => {
    effect.stop()
  }
}
