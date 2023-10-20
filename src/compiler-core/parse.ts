import { NodeTypes } from './ast'

export const baseParse = (content: string) => {
  const context = createParserContext(content)

  return createRootNode(parseChildren(context))
}

function parseChildren(context) {
  const nodes: any[] = []

  while (!isEnd(context)) {
    const node = parseNode(context)

    if (node) {
      nodes.push(node)
    }
  }

  return nodes
}

function parseNode(context) {
  if (context.source.startsWith('{{')) {
    return parseInterpolation(context)
  }
}

function parseInterpolation(context) {
  const end = context.source.indexOf('}}')

  if (end !== -1) {
    const content = context.source.slice(2, end).trim()
    advanceBy(context, end + 2)
    return {
      type: NodeTypes.INTERPOLATION,
      content: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
      },
    }
  }
}

function createParserContext(content: string) {
  return {
    source: content,
  }
}

function createRootNode(children: any[]) {
  return {
    children,
  }
}

function advanceBy(context, length) {
  context.source = context.source.slice(length)
}

function isEnd(context) {
  return context.source.length === 0
}
