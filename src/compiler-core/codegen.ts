import { isString } from '../shared'
import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  TO_DISPLAY_STRING,
  helperNameMap,
} from './runtimeHelpers'

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
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinding}`)
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
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break

    case NodeTypes.TEXT:
      genText(node, context)
      break

    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break

    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break

    default:
      break
  }
}

function genElement(node, context) {
  const { push, helper } = context
  const { tag, props, children } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullable(tag, props, children), context)
  push(')')
}

function genNodeList(nodes, context) {
  const { push } = context
  console.log(nodes)

  for (let i = 0; i < nodes.length; i++) {
    if (i !== 0) {
      push(', ')
    }

    const node = nodes[i]
    if (isString(node)) {
      push(node)
    } else {
      genNode(node, context)
    }
  }
}

function genNullable(...args) {
  return args.map((arg) => arg || 'null')
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

function genCompoundExpression(node: any, context: any) {
  const { push } = context
  const { children } = node
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isString(child)) {
      push(child)
    } else {
      genNode(child, context)
    }
  }
}
