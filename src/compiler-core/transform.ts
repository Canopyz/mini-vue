export function transform(root, options = {}) {
  const context = createTransformContext(root, options)

  traverseNode(root, context)

  createCodegen(root)
}

function createCodegen(root) {
  root.codegenNode = root.children[0]
}

function createTransformContext(root, options) {
  return {
    root,
    nodeTransforms: options.nodeTransforms || [],
  }
}

function traverseNode(root, context) {
  const { nodeTransforms } = context
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(root, context)
  }

  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      traverseNode(root.children[i], context)
    }
  }
}
