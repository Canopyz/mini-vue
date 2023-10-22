import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING, helperNameMap } from './runtimeHelpers'

export function generate(ast) {
  const context = createGenerateContext()
  const { push } = context

  genFunctionPreamble(ast, context)

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

function genFunctionPreamble(ast: any, context: any) {
  const { push } = context

  if (ast.helpers.length) {
    const VueBinding = 'Vue'
    const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`
    push(
      `import { ${ast.helpers
        .map(aliasHelper)
        .join(', ')} } from '${VueBinding}'`,
    )
    push(`\n\n`)
  }

  push(`return `)
}

function createGenerateContext() {
  const context = {
    code: ``,
    helper(key: string) {
      return `_${helperNameMap[key]}`
    },
    push(source: string) {
      context.code += source
    },
  }
  return context
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break

    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break

    default:
      break
  }
}

function genInterpolation(node: any, context: any) {
  const { push } = context
  push(`${context.helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

function genText(node: any, context: any) {
  const { push } = context
  push(`'${node.content}'`)
}

function genExpression(node: any, context: any) {
  const { push } = context
  push(node.content)
}
