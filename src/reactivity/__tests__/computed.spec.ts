import { computed } from '../computed'
import { effect } from '../effect'
import { reactive } from '../reactive'

describe('computed', () => {
  test('getter', () => {
    const value = computed(() => 1)
    expect(value.value).toBe(1)
  })

  it('should compute lazily', () => {
    const wrapper = reactive({ age: 10 })
    const fn = jest.fn(() => wrapper.age)
    const value = computed(fn)
    expect(fn).not.toHaveBeenCalled()
    expect(value.value).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)

    value.value
    expect(fn).toHaveBeenCalledTimes(1)

    wrapper.age = 20
    expect(value.value).toBe(20)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should trigger effect', () => {
    const wrapper = reactive({ age: 10 })
    const value = computed({
      get: () => wrapper.age,
      set: (val) => {
        wrapper.age = val
      },
    })
    let foo

    effect(() => {
      foo = value.value
    })

    expect(foo).toBe(10)
    value.value = 20
    expect(wrapper.age).toBe(20)
    expect(foo).toBe(20)
  })
})
