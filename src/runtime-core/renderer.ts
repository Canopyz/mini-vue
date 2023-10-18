import { effect } from '../reactivity'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createText: hostCreateText,
    setElementText: hostSetElementText,
  } = options

  function render(vnode: any, container: any) {
    patch(null, vnode, container, null)
  }

  function patch(n1: any, n2: any, container: any, parentComponent: any) {
    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent)
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent)
        }
    }
  }

  function processFragment(n1, n2: any, container: any, parentComponent: any) {
    if (n2.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(n2, container, parentComponent)
    }
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2
    hostInsert(hostCreateText(children), container)
  }

  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent)
    } else {
      patchElement(n1, n2, container)
    }
  }

  function mountElement(vnode: any, container: any, parentComponent: any) {
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
        mountChildren(vnode, el, parentComponent)
      }
    }

    // container.appendChild(el)
    hostInsert(el, container)
  }

  function patchElement(n1: any, n2: any, container: any) {
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)
    patchProps(el, oldProps, newProps)
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

  function mountChildren(vnode: any, container: any, parentComponent: any) {
    vnode.children.forEach((v: any) => {
      patch(null, v, container, parentComponent)
    })
  }

  function processComponent(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
  ) {
    mountComponent(n2, container, parentComponent)
  }

  function mountComponent(vnode: any, container: any, parentComponent: any) {
    const instance = createComponentInstance(vnode, parentComponent)

    setupComponent(instance)
    setupRenderEffect(instance, container)
  }

  function setupRenderEffect(instance: any, container: any) {
    effect(() => {
      const { proxy } = instance

      if (!instance.isMounted) {
        const subTree = (instance.subTree = instance.render.call(proxy))

        patch(null, subTree, container, instance)

        instance.vnode.el = subTree.el
        instance.isMounted = true
      } else {
        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree

        patch(prevSubTree, subTree, container, instance)
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
