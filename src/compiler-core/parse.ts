import { NodeTypes, TagType } from './ast'

export const baseParse = (content: string) => {
  const context = createParserContext(content)

  return createRootNode(parseChildren(context, []))
}

function parseChildren(context, ancestors: any[]) {
  const nodes: any[] = []

  while (!isEnd(context, ancestors)) {
    let node = parseNode(context, ancestors)

    if (!node) {
      node = parseText(context)
    }

    nodes.push(node)
  }

  return nodes
}

function parseText(context) {
  const endToken = ['{{', '<']
  let endIndex = context.source.length

  for (const token of endToken) {
    const index = context.source.indexOf(token)
    if (index !== -1 && index < endIndex) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)
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

function parseNode(context, ancestors: any[]) {
  const s = context.source
  if (s.startsWith('{{')) {
    return parseInterpolation(context)
  } else if (s.startsWith('<')) {
    if (/[a-z]/i.test(s[1])) {
      return parseElement(context, ancestors)
    }
  }
}

function parseElement(context, ancestors: any[]) {
  const element: any = parseTag(context, TagType.START)
  ancestors.push(element)

  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.END)
  } else {
    throw new Error(`missing end tag ${element.tag})}`)
  }

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
    type: NodeTypes.ROOT,
    children,
  }
}

function advanceBy(context, length) {
  context.source = context.source.slice(length)
}

function isEnd(context, ancestors: any[]) {
  if (context.source.length === 0) {
    return true
  }

  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (startsWithEndTagOpen(context.source, ancestors[i].tag)) {
      return true
    }
  }

  return false
}

function startsWithEndTagOpen(source: any, tag: any) {
  return (
    source.startsWith(`</`) &&
    source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}
