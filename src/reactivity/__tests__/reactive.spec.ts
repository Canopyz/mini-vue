import { reactive } from '../reactive'

describe('reactive', () => {
  it('should return the same value', () => {
    const rawUser = {
      age: 10,
    }

    const reactiveUser = reactive(rawUser)

    expect(reactiveUser).not.toBe(rawUser)

    expect(reactiveUser.age).toEqual(rawUser.age)
  })
})
