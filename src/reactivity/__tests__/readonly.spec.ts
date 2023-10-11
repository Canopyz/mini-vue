import { isReadonly, readonly, shallowReadonly } from '../reactive'

describe('readonly', () => {
  it('should get the same result', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
  })

  it('should call console.warn when set', () => {
    console.warn = jest.fn()

    const user = readonly({
      age: 10,
    })

    user.age = 11
    expect(console.warn).toHaveBeenCalled()
  })

  test('isReadonly', () => {
    const raw = { foo: 1 }
    const wrapped = readonly(raw)

    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(raw)).toBe(false)
  })

  test('nested readonly', () => {
    const original = { foo: { bar: { a: 1 } } }
    const wrapped = readonly(original)
    expect(isReadonly(wrapped.foo)).toBe(true)
    expect(isReadonly(wrapped.foo.bar)).toBe(true)
    expect(isReadonly(wrapped.foo.bar.a)).toBe(false)
  })

  test('shallowReadonly', () => {
    const raw = { foo: { bar: 1 } }
    const wrapped = shallowReadonly(raw)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(wrapped.foo)).toBe(false)
  })
})
