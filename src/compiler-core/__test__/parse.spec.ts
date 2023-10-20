import { NodeTypes } from '../ast'
import { baseParse } from '../parse'

describe('parse', () => {
  test('interpolation', () => {
    const ast = baseParse('{{ foo }}')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.INTERPOLATION,
      content: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'foo',
      },
    })
  })
})
