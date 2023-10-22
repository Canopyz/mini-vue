import { generate } from '../codegen'
import { baseParse } from '../parse'
import { transform } from '../transform'

describe('codegen', () => {
  test('string', () => {
    const ast = baseParse('hi')
    transform(ast)
    const { code } = generate(ast)

    expect(code).toMatchSnapshot()
  })
})
