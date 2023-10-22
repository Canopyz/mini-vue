import { NodeTypes } from '../ast'
import { isText } from '../utils'

export const transformText = (node) => {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node

      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (isText(child)) {
          let j = i + 1
          let firstFlag: any = true
          while (j < children.length && isText(children[j])) {
            if (firstFlag) {
              children[i] = {
                type: NodeTypes.COMPOUND_EXPRESSION,
                children: [child],
              }
              firstFlag = false
            }
            children[i].children.push(' + ')
            children[i].children.push(children[j])
            children.splice(j, 1)
          }
        }
      }
    }
  }
}
