import { isObject } from '../shared'
import {
  mutableHandler,
  readonlyHandler,
  shallowReadonlyHandler,
} from './baseHandlers'

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

export function shallowReadonly(raw: any) {
  return createReactiveObject(raw, shallowReadonlyHandler)
}

function createReactiveObject(raw: any, baseHandler: ProxyHandler<any>) {
  return new Proxy(raw, baseHandler)
}

export function toReactive<T = any>(value: T): T {
  return isObject(value) ? reactive(value) : value
}

export function isReactive(value: any) {
  return !!value[ReactiveFlags.REACTIVE]
}

export function isReadonly(value: any) {
  return !!value[ReactiveFlags.READONLY]
}

export function isProxy(value: any) {
  return isReactive(value) || isReadonly(value)
}
