import { isReactive, reactive } from '../reactive'

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
})
