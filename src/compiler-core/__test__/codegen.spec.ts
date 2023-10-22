import { generate } from '../codegen'
import { baseParse } from '../parse'
import { transform } from '../transform'
import { transformExpression } from '../transforms/transformExpression'

describe('codegen', () => {
  test('string', () => {
    const ast = baseParse('hi')
    transform(ast)
    const { code } = generate(ast)

    expect(code).toMatchSnapshot()
  })

  test('interpolation', () => {
    const ast = baseParse('{{ foo }}')
    transform(ast, {
      nodeTransforms: [transformExpression],
    })
    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })
})
