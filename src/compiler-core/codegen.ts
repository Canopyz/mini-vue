export function generate(ast) {
  const context = createGenerateContext()
  const { push } = context

  push(`return `)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}){`)
  push('return ')
  genNode(ast.codegenNode, context)
  push('}')

  return {
    code: context.code,
  }
}

function createGenerateContext() {
  const context = {
    code: ``,
    push(source: string) {
      context.code += source
    },
  }
  return context
}

function genNode(node, context) {
  const { push } = context
  push(`'${node.content}'`)
}
