import { NodeTypes, TagType } from './ast'

export const baseParse = (content: string) => {
  const context = createParserContext(content)

  return createRootNode(parseChildren(context))
}

function parseChildren(context) {
  const nodes: any[] = []

  while (!isEnd(context)) {
    let node = parseNode(context)

    if (!node) {
      node = parseText(context)
    }

    nodes.push(node)
  }

  return nodes
}

function parseText(context) {
  const content = parseTextData(context, context.source.length)
  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function parseTextData(context, length) {
  const content = context.source.slice(0, length)
  advanceBy(context, length)
  return content
}

function parseNode(context) {
  const s = context.source
  if (s.startsWith('{{')) {
    return parseInterpolation(context)
  } else if (s.startsWith('<')) {
    if (/[a-z]/i.test(s[1])) {
      return parseElement(context)
    }
  }
}

function parseElement(context) {
  const element = parseTag(context, TagType.START)

  parseTag(context, TagType.END)

  return element
}

function parseTag(context, type) {
  const match: any = /^<\/?([a-z]*)>/i.exec(context.source)
  const tag = match[1]

  advanceBy(context, match[0].length)

  if (type === TagType.START) {
    return {
      type: NodeTypes.ELEMENT,
      tag,
    }
  }
}

function parseInterpolation(context) {
  const end = context.source.indexOf('}}')

  if (end !== -1) {
    const content = parseTextData(context, end + 2)
      .slice(2, -2)
      .trim()
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
