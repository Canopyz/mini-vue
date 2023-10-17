import { shallowReadonly } from '../reactivity/reactive'
import { isObject } from '../shared'
import { emit } from './componentEmits'
import { initProps } from './componentProps'
import { publicInstanceProxyHandler } from './componentPublicInstance'
import { initSlots } from './componentSlots'

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
  }

  component.emit = emit.bind(null, component) as any

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
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type

  const { render } = Component

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
