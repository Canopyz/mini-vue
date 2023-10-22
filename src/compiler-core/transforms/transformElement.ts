import { NodeTypes, createVNodeCall } from '../ast'

export const transformElement = (node, context) => {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const vnodeTag = `'${node.tag}'`

      let vnodeProps

      const children = node.children
      let vnodeChildren = children[0]

      node.codegenNode = createVNodeCall(
        vnodeTag,
        vnodeProps,
        vnodeChildren,
        context,
      )
    }
  }
}
