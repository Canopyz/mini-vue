import { shallowReadonly } from '../reactivity/reactive'
import { isObject } from '../shared'
import { emit } from './componentEmits'
import { initProps } from './componentProps'
import { publicInstanceProxyHandler } from './componentPublicInstance'

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  }

  component.emit = emit.bind(null, component) as any

  return component
}

export function setupComponent(instance: any) {
  initProps(instance, instance.vnode.props)
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type

  instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandler)

  const { setup } = Component

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
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
