import { isProxy, isReactive, reactive, readonly } from '../src/reactive'

describe('reactive', () => {
  it('should return the same value', () => {
    const rawUser = {
      age: 10,
    }

    const reactiveUser = reactive(rawUser)

    expect(reactiveUser).not.toBe(rawUser)

    expect(reactiveUser.age).toEqual(rawUser.age)
  })

  test('isReactive', () => {
    const raw = { foo: 1 }
    const wrapped = reactive(raw)

    expect(isReactive(wrapped)).toBe(true)
    expect(isReactive(raw)).toBe(false)
  })

  test('nested reactives', () => {
    const nested = reactive({
      foo: {
        bar: {
          val: 1,
        },
      },
      arr: [{ a: 1 }],
    })
    expect(isReactive(nested.foo)).toBe(true)
    expect(isReactive(nested.foo.bar)).toBe(true)
    expect(isReactive(nested.foo.bar.val)).toBe(false)
    expect(isReactive(nested.arr)).toBe(true)
    expect(isReactive(nested.arr[0])).toBe(true)
  })

  test('isProxy', () => {
    const raw = { foo: 1 }
    const reactiveWrapper = reactive(raw)
    expect(isProxy(reactiveWrapper)).toBe(true)

    const readonlyWrapper = readonly(raw)
    expect(isProxy(readonlyWrapper)).toBe(true)
  })
})
