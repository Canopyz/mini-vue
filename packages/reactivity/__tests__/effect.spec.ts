import { effect, stop } from '../src/effect'
import { reactive } from '../src/reactive'
import { vi } from 'vitest'

describe('effect', () => {
  it('should be reactive', () => {
    const user = reactive({
      age: 10,
    })

    let agePlus1

    effect(() => {
      agePlus1 = user.age + 1
    })

    expect(agePlus1).toBe(11)

    user.age = 11

    expect(agePlus1).toBe(12)
  })

  it('should return runner', () => {
    let foo = 10

    const runner = effect(() => {
      foo++
      return foo
    })

    expect(foo).toBe(11)
    runner()
    expect(foo).toBe(12)
    expect(runner()).toBe(13)
  })

  it('scheduler', () => {
    let foo = 0,
      bar = 0
    const obj = reactive({
      age: 10,
    })
    const scheduler = vi.fn(() => {
      foo = obj.age
    })
    const runner = effect(
      () => {
        bar = obj.age
      },
      { scheduler },
    )
    expect(foo).toBe(0)
    expect(bar).toBe(10)

    obj.age++
    expect(foo).toBe(11)
    expect(bar).toBe(10)

    runner()
    expect(bar).toBe(11)
  })

  it('shoud support stop', () => {
    const obj = reactive({ age: 10 })

    let foo

    const runner = effect(() => {
      foo = obj.age
    })

    expect(foo).toBe(10)

    stop(runner)

    obj.age = 11
    expect(foo).toBe(10)

    obj.age++
    expect(foo).toBe(10)

    runner()
    expect(foo).toBe(12)
  })

  it('should support onStop', () => {
    const onStop = vi.fn()

    const runner = effect(() => {}, { onStop })

    stop(runner)
    expect(onStop).toBeCalledTimes(1)

    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})
