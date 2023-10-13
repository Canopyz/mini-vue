import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  patch(vnode, container)
}

export function patch(vnode: any, container: any) {
  if (typeof vnode === 'string') {
    processText(vnode, container)
  } else if (typeof vnode.type === 'string') {
    processElement(vnode, container)
  } else {
    processComponent(vnode, container)
  }
}

function processText(vnode: any, container: any) {
  const textContainer = document.createTextNode(vnode)
  container.appendChild(textContainer)
}

function processElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type))

  if (vnode.props) {
    for (const key in vnode.props) {
      const value = vnode.props[key]
      el.setAttribute(key, value)
    }
  }

  if (vnode.children) {
    if (Array.isArray(vnode.children)) {
      mountChildren(vnode, el)
    } else {
      patch(vnode.children, el)
    }
  }

  container.appendChild(el)
}

function mountChildren(vnode, container: any) {
  vnode.children.forEach((v) => {
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
