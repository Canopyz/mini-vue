import { proxyRefs } from '../reactivity'
import { shallowReadonly } from '../reactivity/reactive'
import { isObject } from '../shared'
import { emit } from './componentEmits'
import { initProps } from './componentProps'
import { publicInstanceProxyHandler } from './componentPublicInstance'
import { initSlots } from './componentSlots'

export function createComponentInstance(vnode: any, parent: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    isMounted: false,
    props: {},
    emit: () => {},
    subTree: null,
    slots: {},
    provides: parent?.provides ?? {},
    next: null,
    update: null,
  }

  component.emit = emit.bind(null, component) as any

  vnode.component = component

  return component
}

export function setupComponent(instance: any) {
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type

  instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandler)

  const { setup } = Component

  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult)
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type

  let { render } = Component

  if (compiler && !Component.render) {
    if (Component.template) {
      render = compiler(Component.template)
    }
  }
  if (render) {
    instance.render = render
  }
}

let currentInstance: any = null

export function getCurrentInstance() {
  return currentInstance
}

export function setCurrentInstance(instance: any) {
  currentInstance = instance
}

let compiler

export function registerRuntimeCompiler(_compiler: any) {
  compiler = _compiler
}
