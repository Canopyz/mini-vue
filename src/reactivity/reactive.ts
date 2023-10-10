import { mutableHandler, readonlyHandler } from './baseHandlers'

export function reactive(raw: any) {
  return createReactiveObject(raw, mutableHandler)
}

export function readonly(raw: any) {
  return createReactiveObject(raw, readonlyHandler)
}

function createReactiveObject(raw: any, baseHandler: ProxyHandler<any>) {
  return new Proxy(raw, baseHandler)
}
