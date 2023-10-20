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

  test('element', () => {
    const ast = baseParse('<div></div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [],
    })
  })

  test('text', () => {
    const ast = baseParse('some text')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.TEXT,
      content: 'some text',
    })
  })

  test('nested', () => {
    const ast = baseParse('<div><p>inner p</p>hi, {{ foo }}</div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'p',
          children: [
            {
              type: NodeTypes.TEXT,
              content: 'inner p',
            },
          ],
        },
        {
          type: NodeTypes.TEXT,
          content: 'hi, ',
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'foo',
          },
        },
      ],
      tag: 'div',
    })
  })

  // it('should throw errors', () => {
  //   expect(() => {
  //     baseParse('<div></p>')
  //   }).toThrow('missing end tag div')
  // })
})
