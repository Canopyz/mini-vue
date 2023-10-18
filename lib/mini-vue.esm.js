const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
const hasChanged = (newValue, value) => !Object.is(newValue, value);
const isFunction = (val) => typeof val === 'function';
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const camelize = (str) => str.replace(/-(\w)/g, (_, ch) => (ch ? ch.toUpperCase() : ''));
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toHandlerKey = (str) => str ? `on${capitalize(camelize(str))}` : '';

let activeEffect = null;
let shouldTrack = true;
function isTracking() {
    return activeEffect !== null && shouldTrack;
}
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
    }
    run() {
        if (!this.active) {
            return this.fn();
        }
        let parent = activeEffect;
        activeEffect = this;
        const lastShouldTrack = shouldTrack;
        shouldTrack = true;
        const res = this.fn();
        shouldTrack = lastShouldTrack;
        activeEffect = parent;
        return res;
    }
    stop() {
        if (this.active) {
            cleanUpEffects(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanUpEffects(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function effect(fn, options) {
    const effect = new ReactiveEffect(fn, options === null || options === void 0 ? void 0 : options.scheduler);
    extend(effect, options);
    effect.run();
    const runner = effect.run.bind(effect);
    runner.effect = effect;
    return runner;
}
const targetMap = new Map();
function trackEffects(deps) {
    activeEffect = activeEffect;
    if (!deps.has(activeEffect)) {
        deps.add(activeEffect);
        activeEffect.deps.push(deps);
    }
}
function track(target, key) {
    if (!isTracking()) {
        return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    trackEffects(deps);
}
function triggerEffects(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const deps = depsMap.get(key);
    if (!deps) {
        return;
    }
    triggerEffects(deps);
}
function stop(runner) {
    var _a;
    (_a = runner.effect) === null || _a === void 0 ? void 0 : _a.stop();
}

const getter = createGetter();
const readonlyGetter = createGetter(true);
const shalowReadonlyGetter = createGetter(true, true);
const setter = createSetter();
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        const res = Reflect.get(target, key);
        if (key === ReactiveFlags.REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.READONLY) {
            return isReadonly;
        }
        if (!isReadonly) {
            track(target, key);
        }
        if (!isShallow && isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandler = {
    get: getter,
    set: setter,
};
const readonlyHandler = {
    get: readonlyGetter,
    set: (_, key) => {
        console.warn(`key: ${String(key)} set failed, because it is readonly`);
        return true;
    },
};
const shallowReadonlyHandler = extend({}, readonlyHandler, {
    get: shalowReadonlyGetter,
});

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["REACTIVE"] = "__v_reactive";
    ReactiveFlags["READONLY"] = "__v_readonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(raw) {
    return createReactiveObject(raw, mutableHandler);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandler);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandler);
}
function createReactiveObject(raw, baseHandler) {
    if (!isObject(raw)) {
        console.warn(`value cannot be made reactive: ${String(raw)}`);
        return raw;
    }
    return new Proxy(raw, baseHandler);
}
function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
}
function isReactive(value) {
    return !!value[ReactiveFlags.REACTIVE];
}
function isReadonly(value) {
    return !!value[ReactiveFlags.READONLY];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}

class RefImpl {
    constructor(value) {
        this.deps = new Set();
        this.__v_isRef = true;
        this._value = toReactive(value);
        this._rawValue = value;
    }
    get value() {
        trackRefEffects(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = toReactive(newValue);
            triggerRefEffects(this);
        }
    }
}
function trackRefEffects(ref) {
    if (isTracking()) {
        trackEffects(ref.deps);
    }
}
function triggerRefEffects(ref) {
    triggerEffects(ref.deps);
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!(ref && ref.__v_isRef);
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return isReactive(objectWithRefs)
        ? objectWithRefs
        : new Proxy(objectWithRefs, {
            get(target, key) {
                return unRef(Reflect.get(target, key));
            },
            set(target, key, value) {
                if (isRef(target[key] && !isRef(value))) {
                    target[key].value = value;
                    return true;
                }
                return Reflect.set(target, key, value);
            },
        });
}

class ComputedRefImpl {
    constructor(getter, setter) {
        this.setter = setter;
        this.dirty = true;
        this.deps = new Set();
        this.effect = new ReactiveEffect(getter, () => {
            if (!this.dirty) {
                this.dirty = true;
                triggerRefEffects(this);
            }
        });
    }
    get value() {
        if (this.dirty) {
            this._value = this.effect.run();
            this.dirty = false;
        }
        trackRefEffects(this);
        return this._value;
    }
    set value(val) {
        if (this.setter) {
            this.setter(val);
        }
        else {
            console.warn('Cannot set readonly computed value');
        }
    }
}
function computed(getterOrOptions) {
    if (isFunction(getterOrOptions)) {
        return new ComputedRefImpl(getterOrOptions);
    }
    return new ComputedRefImpl(getterOrOptions.get, getterOrOptions.set);
}

const emit = (instance, event, ...args) => {
    const { props } = instance;
    const handlerName = toHandlerKey(event);
    const handler = props[handlerName];
    handler && handler(...args);
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const publicInstanceProxyHandler = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

const initSlots = (instance, children) => {
    if (instance.vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
};
function normalizeObjectSlots(children, slot) {
    for (const key in children) {
        const value = children[key];
        slot[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    var _a;
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        isMounted: false,
        props: {},
        emit: () => { },
        subTree: null,
        slots: {},
        provides: (_a = parent === null || parent === void 0 ? void 0 : parent.provides) !== null && _a !== void 0 ? _a : {},
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandler);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    const { render } = Component;
    if (render) {
        instance.render = render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof vnode.children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(vnode.children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function createFragment(children) {
    return createVNode(Fragment, {}, children);
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent, null);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, createText: hostCreateText, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        switch (n2.type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (n2.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (n2.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        if (n2.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(n2, container, parentComponent);
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        hostInsert(hostCreateText(children), container);
    }
    function processElement(n1, n2, container, parentComponent) {
        console.log(n1, n2);
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container);
        }
    }
    function mountElement(vnode, container, parentComponent) {
        // const el = (vnode.el = document.createElement(vnode.type))
        const el = (vnode.el = hostCreateElement(vnode.type));
        if (vnode.props) {
            for (const key in vnode.props) {
                const value = vnode.props[key];
                hostPatchProp(el, key, value);
            }
        }
        if (vnode.children) {
            if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(el, vnode.children);
            }
            else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                mountChildren(vnode, el, parentComponent);
            }
        }
        // container.appendChild(el)
        hostInsert(el, container);
    }
    function patchElement(n1, n2, container) {
        console.log('patchElement');
        console.log(n1, n2, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        effect(() => {
            const { proxy } = instance;
            if (!instance.isMounted) {
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

const renderSlots = (slots, name, props) => {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return h(Fragment, {}, slot(props));
        }
    }
};

const provide = (key, value) => {
    var _a;
    const currentInstance = getCurrentInstance();
    let { provides } = currentInstance;
    if (provides === ((_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides)) {
        provides = currentInstance.provides = Object.create(currentInstance.parent.provides);
    }
    provides[key] = value;
};
const inject = (key, defaultValue) => {
    const currentInstance = getCurrentInstance();
    const { provides } = currentInstance;
    return key in provides
        ? provides[key]
        : typeof defaultValue === 'function'
            ? defaultValue()
            : defaultValue;
};

const nativeOnRE = /^on[A-Z]/;
const createElement = (type) => {
    return document.createElement(type);
};
const insert = (child, parent) => {
    parent.appendChild(child);
};
const patchProp = (el, key, value) => {
    if (nativeOnRE.test(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
    }
    else {
        el.setAttribute(key, value);
    }
};
const createText = (text) => {
    return document.createTextNode(text);
};
const setElementText = (el, text) => {
    el.textContent = text;
};
const options = {
    createElement,
    insert,
    patchProp,
    createText,
    setElementText,
};
const renderer = createRenderer(options);
const createApp = (rootComponent) => {
    return renderer.createApp(rootComponent);
};

export { ComputedRefImpl, ReactiveEffect, ReactiveFlags, RefImpl, activeEffect, computed, createApp, createAppAPI, createFragment, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, isTracking, provide, proxyRefs, reactive, readonly, ref, renderSlots, shallowReadonly, shouldTrack, stop, toReactive, track, trackEffects, trackRefEffects, trigger, triggerEffects, triggerRefEffects, unRef };
