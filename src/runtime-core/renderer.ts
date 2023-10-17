import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { Fragment, Text } from './vnode'

const nativeOnRE = /^on[A-Z]/

export function render(vnode: any, container: any) {
  patch(vnode, container, null)
}

export function patch(vnode: any, container: any, parentComponent: any) {
  switch (vnode.type) {
    case Fragment:
      processFragment(vnode, container, parentComponent)
      break
    case Text:
      processText(vnode, container)
      break
    default:
      if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent)
      } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parentComponent)
      }
  }
}

function processFragment(vnode: any, container: any, parentComponent: any) {
  if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    container.append(vnode.children)
  } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, container, parentComponent)
  }
}

function processText(vnode: any, container: any) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
}

function processElement(vnode: any, container: any, parentComponent: any) {
  mountElement(vnode, container, parentComponent)
}

function mountElement(vnode: any, container: any, parentComponent: any) {
  const el = (vnode.el = document.createElement(vnode.type))

  if (vnode.props) {
    for (const key in vnode.props) {
      const value = vnode.props[key]

      if (nativeOnRE.test(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), value)
      } else {
        el.setAttribute(key, value)
      }
    }
  }

  if (vnode.children) {
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = vnode.children
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent)
    }
  }

  container.appendChild(el)
}

function mountChildren(vnode: any, container: any, parentComponent: any) {
  vnode.children.forEach((v: any) => {
    patch(v, container, parentComponent)
  })
}

function processComponent(vnode: any, container: any, parentComponent: any) {
  mountComponent(vnode, container, parentComponent)
}

function mountComponent(vnode: any, container: any, parentComponent: any) {
  const instance = createComponentInstance(vnode, parentComponent)

  setupComponent(instance)
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container: any) {
  const { proxy } = instance

  const subTree = instance.render.call(proxy)

  patch(subTree, container, instance)

  instance.vnode.el = subTree.el
}
