import { createRenderer } from '../runtime-core/renderer'

const nativeOnRE = /^on[A-Z]/

const createElement = (type: any) => {
  return document.createElement(type)
}

const insert = (child: any, parent: any) => {
  parent.appendChild(child)
}

const patchProp = (el: any, key: any, prevVal: any, newVal: any) => {
  if (nativeOnRE.test(key)) {
    if (prevVal) {
      el.removeEventListener(key.slice(2).toLowerCase(), prevVal)
    }
    if (newVal) {
      el.addEventListener(key.slice(2).toLowerCase(), newVal)
    }
  } else {
    if (newVal == null || newVal == undefined) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, newVal)
    }
  }
}

const createText = (text: any) => {
  return document.createTextNode(text)
}

const setElementText = (el: any, text: any) => {
  el.textContent = text
}

const options = {
  createElement,
  insert,
  patchProp,
  createText,
  setElementText,
}

const renderer = createRenderer(options)

export const createApp = (rootComponent: any) => {
  return renderer.createApp(rootComponent)
}

export * from '../runtime-core'
