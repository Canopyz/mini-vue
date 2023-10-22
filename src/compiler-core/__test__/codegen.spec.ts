import { generate } from '../codegen'
import { baseParse } from '../parse'
import { transform } from '../transform'
import { transformElement } from '../transforms/transformElement'
import { transformExpression } from '../transforms/transformExpression'
import { transformText } from '../transforms/transformText'

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

  it('element', () => {
    const ast: any = baseParse('<div>hi,{{message}}</div>')
    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    })

    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })
})
