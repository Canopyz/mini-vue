import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  patch(vnode, container)
}

export function patch(vnode: any, container: any) {
  if (typeof vnode === 'string') {
    processText(vnode, container)
  } else {
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
      processElement(vnode, container)
    } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(vnode, container)
    }
  }
}

function processText(vnode: any, container: any) {
  insertText(vnode, container)
}

function insertText(vnode: any, container: any) {
  const textContainer = document.createTextNode(vnode)
  container.appendChild(textContainer)
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type))

  if (vnode.props) {
    for (const key in vnode.props) {
      const value = vnode.props[key]
      el.setAttribute(key, value)
    }
  }

  if (vnode.children) {
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      processText(vnode.children, el)
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el)
    }
  }

  container.appendChild(el)
}

function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((v: any) => {
    patch(v, container)
  })
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode)

  setupComponent(instance)
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container: any) {
  const { proxy } = instance

  const subTree = instance.render.call(proxy)

  patch(subTree, container)

  instance.vnode.el = subTree.el
}
