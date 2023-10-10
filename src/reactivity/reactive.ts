import { mutableHandler, readonlyHandler } from './baseHandlers'

export enum ReactiveFlags {
  REACTIVE = '__v_reactive',
  READONLY = '__v_readonly',
}

export function reactive(raw: any) {
  return createReactiveObject(raw, mutableHandler)
}

export function readonly(raw: any) {
  return createReactiveObject(raw, readonlyHandler)
}

function createReactiveObject(raw: any, baseHandler: ProxyHandler<any>) {
  return new Proxy(raw, baseHandler)
}

export function isReactive(value: any) {
  return !!value[ReactiveFlags.REACTIVE]
}

export function isReadonly(value: any) {
  return !!value[ReactiveFlags.READONLY]
}
