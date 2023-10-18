import { effect } from '../reactivity'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text, isSameVNodeType } from './vnode'

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createText: hostCreateText,
    setElementText: hostSetElementText,
    remove: hostRemove,
  } = options

  function render(vnode: any, container: any) {
    patch(null, vnode, container, null)
  }

  function patch(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any = null,
  ) {
    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container, anchor)
        break
      default:
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor)
        }
    }
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any,
  ) {
    if (n2.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(n2.children, container, parentComponent, anchor)
    }
  }

  function processText(n1, n2: any, container: any, anchor: any) {
    const { children } = n2
    hostInsert(hostCreateText(children), container, anchor)
  }

  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any,
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function mountElement(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any,
  ) {
    // const el = (vnode.el = document.createElement(vnode.type))
    const el = (vnode.el = hostCreateElement(vnode.type))

    if (vnode.props) {
      for (const key in vnode.props) {
        const value = vnode.props[key]

        hostPatchProp(el, key, null, value)
      }
    }

    if (vnode.children) {
      if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, vnode.children)
      } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode.children, el, parentComponent, anchor)
      }
    }

    // container.appendChild(el)
    hostInsert(el, container, anchor)
  }

  function patchElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any,
  ) {
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)

    patchProps(el, oldProps, newProps)
    patchChildren(n1, n2, el, parentComponent, anchor)
  }

  function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any,
  ) {
    const { shapeFlag: f1, children: c1 } = n1
    const { shapeFlag: f2, children: c2 } = n2

    if (f2 & ShapeFlags.TEXT_CHILDREN) {
      if (f1 & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2)
      }
    } else {
      if (f1 & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren(
    c1: any,
    c2: any,
    container: any,
    parentComponent: any,
    parentAnchor: any,
  ) {
    const l2 = c2.length
    let i = 0
    let e1 = c1.length - 1
    let e2 = l2 - 1

    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      i++
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }

      e1--
      e2--
    }

    if (i > e2) {
      // remove
      while (i <= e1) {
        const n1 = c1[i]
        hostRemove(n1.el)
        i++
      }
    } else if (i > e1) {
      if (i <= e2) {
        // add
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor
        while (i <= e2) {
          const n2 = c2[i]
          patch(null, n2, container, parentComponent, anchor)
          i++
        }
      }
    } else {
      let s1 = i
      let s2 = i

      const toBePatched = e2 - i + 1
      let patched = 0
      const keyToNewIndexMap = new Map()
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
      let shouldMove = false
      let maxNewIndexSoFar = 0

      for (let i = s2; i < e2; i++) {
        const nextChild = c2[i]
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]

        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }

        let newIndex: any
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          for (let j = s2; j <= e2; j++) {
            const nextChild = c2[j]
            if (
              newIndexToOldIndexMap[j - s2] === 0 &&
              isSameVNodeType(prevChild, nextChild)
            ) {
              newIndex = j
              break
            }
          }
        }

        if (newIndex == null) {
          hostRemove(prevChild.el)
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            shouldMove = true
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(
            prevChild,
            c2[newIndex],
            container,
            parentComponent,
            parentAnchor,
          )
          patched++
        }
      }

      const longestIncreasingSequence = shouldMove
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = longestIncreasingSequence.length - 1

      for (let i = toBePatched - 1; i >= 0; i--) {
        const newIndex = i + s2
        const anchorIndex = newIndex + 1
        const newChild = c2[newIndex]
        const anchor = c2?.[anchorIndex]?.el ?? parentAnchor
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, newChild, container, parentComponent, anchor)
        } else if (shouldMove) {
          if (j < 0 || i !== longestIncreasingSequence[j]) {
            hostInsert(newChild.el, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  function unmountChildren(children: any) {
    for (const child of children) {
      hostRemove(child)
    }
  }

  function patchProps(el: any, oldProps: any, newProps: any) {
    if (oldProps === newProps) {
      return
    }

    if (oldProps !== EMPTY_OBJ) {
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, newProps[key], null)
        }
      }
    }

    for (const key in newProps) {
      const prev = oldProps[key]
      const next = newProps[key]
      if (prev !== next) {
        hostPatchProp(el, key, prev, next)
      }
    }
  }

  function mountChildren(
    children: any,
    container: any,
    parentComponent: any,
    anchor,
  ) {
    children.forEach((v: any) => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function processComponent(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor,
  ) {
    mountComponent(n2, container, parentComponent, anchor)
  }

  function mountComponent(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor,
  ) {
    const instance = createComponentInstance(vnode, parentComponent)

    setupComponent(instance)
    setupRenderEffect(instance, container, anchor)
  }

  function setupRenderEffect(instance: any, container: any, anchor) {
    effect(() => {
      const { proxy } = instance

      if (!instance.isMounted) {
        const subTree = (instance.subTree = instance.render.call(proxy))

        patch(null, subTree, container, instance, anchor)

        instance.vnode.el = subTree.el
        instance.isMounted = true
      } else {
        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree

        patch(prevSubTree, subTree, container, instance, anchor)
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}

function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
