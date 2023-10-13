import { isObject } from '../shared'

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
  }

  return component
}

export function setupComponent(instance: any) {
  // initProps()
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type

  const { setup } = Component

  if (setup) {
    const setupResult = setup()
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
