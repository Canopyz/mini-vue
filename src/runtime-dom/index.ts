import { createRenderer } from '../runtime-core/renderer'

const nativeOnRE = /^on[A-Z]/

const createElement = (type: any) => {
  return document.createElement(type)
}

const insert = (child: any, parent: any) => {
  parent.appendChild(child)
}

const patchProp = (el: any, key: any, value: any) => {
  if (nativeOnRE.test(key)) {
    el.addEventListener(key.slice(2).toLowerCase(), value)
  } else {
    el.setAttribute(key, value)
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
