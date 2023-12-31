import { effect } from '../src/effect'
import { reactive } from '../src/reactive'
import { isRef, proxyRefs, ref, unRef } from '../src/ref'
import { vi } from 'vitest'

describe('ref', () => {
  it('should hold a value', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  })

  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    const fn = vi.fn(() => {
      dummy = a.value
    })
    effect(fn)
    a.value = 2
    expect(dummy).toBe(2)
    expect(fn).toHaveBeenCalledTimes(2)

    a.value = 2
    expect(dummy).toBe(2)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    })
    let dummy: any
    effect(() => {
      dummy = a.value.count
    })
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  test('isRef', () => {
    const a = ref(1)
    const user = reactive({
      age: 1,
    })
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
  })

  test('unRef', () => {
    const a = ref(1)
    expect(isRef(unRef(a))).toBe(false)
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
  })

  test('proxyRefs', () => {
    const user = proxyRefs({
      age: ref(10),
      name: 'xiaoming',
    })
    expect(user.age).toBe(10)
    expect(isRef(user.name)).toBe(false)

    user.age = 11
    expect(user.age).toBe(11)
    expect(isRef(user.age)).toBe(false)
  })
})
