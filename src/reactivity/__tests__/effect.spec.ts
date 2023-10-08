import { effect } from '../effect'
import { reactive } from '../reactive'

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
})
