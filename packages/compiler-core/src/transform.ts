import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export function transform(root, options = {}) {
  const context = createTransformContext(root, options)

  traverseNode(root, context)

  createCodegen(root)
  root.helpers = [...context.helpers]
}

function createCodegen(root) {
  const child = root.children[0]
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = child
  }
}

function createTransformContext(root, options) {
  return {
    root,
    helpers: new Set(),
    helper(key) {
      this.helpers.add(key)
    },
    nodeTransforms: options.nodeTransforms || [],
  }
}

function traverseNode(root, context) {
  const { nodeTransforms } = context

  const callbacks: any[] = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const fn = transform(root, context)
    if (fn) {
      callbacks.push(fn)
    }
  }

  switch (root.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(root, context)
      break

    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)

    default:
      break
  }

  while (callbacks.length) {
    callbacks.pop()()
  }
}

function traverseChildren(root: any, context: any) {
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      traverseNode(root.children[i], context)
    }
  }
}
