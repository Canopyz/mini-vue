function toDisplayString(val) {
    return String(val);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => val !== null && typeof val === 'object';
const isString = (val) => typeof val === 'string';
const hasChanged = (newValue, value) => !Object.is(newValue, value);
const isFunction = (val) => typeof val === 'function';
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const camelize = (str) => str.replace(/-(\w)/g, (_, ch) => (ch ? ch.toUpperCase() : ''));
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toHandlerKey = (str) => str ? `on${capitalize(camelize(str))}` : '';

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
        key: props === null || props === void 0 ? void 0 : props.key,
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
function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
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
        if (key === ReactiveFlags.REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.READONLY) {
            return isReadonly;
        }
        if (!isReadonly) {
            track(target, key);
        }
        const res = Reflect.get(target, key);
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
    $props: (i) => i.props,
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
        next: null,
        update: null,
    };
    component.emit = emit.bind(null, component);
    vnode.component = component;
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
    let { render } = Component;
    if (compiler && !Component.render) {
        if (Component.template) {
            render = compiler(Component.template);
        }
    }
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
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

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

const jobs = [];
let isFlushPending = false;
const resolvedPromise = Promise.resolve();
function nextTick(fn) {
    const p = resolvedPromise;
    return fn ? p.then(fn) : p;
}
function queueJob(job) {
    if (!jobs.includes(job)) {
        jobs.push(job);
        queueFlushJobs();
    }
}
function queueFlushJobs() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = jobs.shift())) {
        job && job();
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, createText: hostCreateText, setElementText: hostSetElementText, remove: hostRemove, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent, anchor = null) {
        switch (n2.type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container, anchor);
                break;
            default:
                if (n2.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (n2.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        if (n2.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(n2.children, container, parentComponent, anchor);
        }
    }
    function processText(n1, n2, container, anchor) {
        const { children } = n2;
        hostInsert(hostCreateText(children), container, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // const el = (vnode.el = document.createElement(vnode.type))
        const el = (vnode.el = hostCreateElement(vnode.type));
        if (vnode.props) {
            for (const key in vnode.props) {
                const value = vnode.props[key];
                hostPatchProp(el, key, null, value);
            }
        }
        if (vnode.children) {
            if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(el, vnode.children);
            }
            else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                mountChildren(vnode.children, el, parentComponent, anchor);
            }
        }
        // container.appendChild(el)
        hostInsert(el, container, anchor);
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: f1, children: c1 } = n1;
        const { shapeFlag: f2, children: c2 } = n2;
        if (f2 & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (f1 & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(c1);
            }
            if (c2 !== c1) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (f1 & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        var _a, _b;
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e2) {
            // remove
            while (i <= e1) {
                const n1 = c1[i];
                hostRemove(n1.el);
                i++;
            }
        }
        else if (i > e1) {
            if (i <= e2) {
                // add
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
                while (i <= e2) {
                    const n2 = c2[i];
                    patch(null, n2, container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else {
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - i + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            let shouldMove = false;
            let maxNewIndexSoFar = 0;
            for (let i = s2; i < e2; i++) {
                const nextChild = c2[i];
                if (nextChild.key != null) {
                    keyToNewIndexMap.set(nextChild.key, i);
                }
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        const nextChild = c2[j];
                        if (newIndexToOldIndexMap[j - s2] === 0 &&
                            isSameVNodeType(prevChild, nextChild)) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex == null) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        shouldMove = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, parentAnchor);
                    patched++;
                }
            }
            const longestIncreasingSequence = shouldMove
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = longestIncreasingSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const newIndex = i + s2;
                const anchorIndex = newIndex + 1;
                const newChild = c2[newIndex];
                const anchor = (_b = (_a = c2 === null || c2 === void 0 ? void 0 : c2[anchorIndex]) === null || _a === void 0 ? void 0 : _a.el) !== null && _b !== void 0 ? _b : parentAnchor;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, newChild, container, parentComponent, anchor);
                }
                else if (shouldMove) {
                    if (j < 0 || i !== longestIncreasingSequence[j]) {
                        hostInsert(newChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (const child of children) {
            hostRemove(child);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps === newProps) {
            return;
        }
        if (oldProps !== EMPTY_OBJ) {
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, newProps[key], null);
                }
            }
        }
        for (const key in newProps) {
            const prev = oldProps[key];
            const next = newProps[key];
            if (prev !== next) {
                hostPatchProp(el, key, prev, next);
            }
        }
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(vnode, container, parentComponent, anchor) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container, anchor);
    }
    function setupRenderEffect(instance, container, anchor) {
        instance.update = effect(() => {
            const { proxy } = instance;
            if (!instance.isMounted) {
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler: () => {
                queueJob(instance.update);
            },
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    return {
        createApp: createAppAPI(render),
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

const nativeOnRE = /^on[A-Z]/;
const createElement = (type) => {
    return document.createElement(type);
};
const insert = (child, parent, anchor) => {
    parent.insertBefore(child, anchor);
};
const patchProp = (el, key, prevVal, newVal) => {
    if (nativeOnRE.test(key)) {
        if (prevVal) {
            el.removeEventListener(key.slice(2).toLowerCase(), prevVal);
        }
        if (newVal) {
            el.addEventListener(key.slice(2).toLowerCase(), newVal);
        }
    }
    else {
        if (newVal == null || newVal == undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newVal);
        }
    }
};
const createText = (text) => {
    return document.createTextNode(text);
};
const setElementText = (el, text) => {
    el.textContent = text;
};
const remove = (child) => {
    const parent = child.parentNode;
    parent && parent.removeChild(child);
};
const options = {
    createElement,
    insert,
    patchProp,
    createText,
    setElementText,
    remove,
};
const renderer = createRenderer(options);
const createApp = (rootComponent) => {
    return renderer.createApp(rootComponent);
};

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    computed: computed,
    createApp: createApp,
    createAppAPI: createAppAPI,
    createElementVNode: createVNode,
    createFragment: createFragment,
    createRenderer: createRenderer,
    createTextVNode: createTextVNode,
    effect: effect,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    isProxy: isProxy,
    isReactive: isReactive,
    isReadonly: isReadonly,
    isRef: isRef,
    nextTick: nextTick,
    provide: provide,
    proxyRefs: proxyRefs,
    reactive: reactive,
    readonly: readonly,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    shallowReadonly: shallowReadonly,
    stop: stop,
    toDisplayString: toDisplayString,
    unRef: unRef
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperNameMap = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode',
};

function generate(ast) {
    const context = createGenerateContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    if (ast.helpers.length) {
        const VueBinding = 'Vue';
        const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinding}`);
        push(`\n\n`);
    }
    push(`return `);
}
function createGenerateContext() {
    const context = {
        code: ``,
        helper(key) {
            return `_${helperNameMap[key]}`;
        },
        push(source) {
            context.code += source;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 4 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 1 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 2 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, props, children } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable(tag, props, children), context);
    push(')');
}
function genNodeList(nodes, context) {
    const { push } = context;
    console.log(nodes);
    for (let i = 0; i < nodes.length; i++) {
        if (i !== 0) {
            push(', ');
        }
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
    }
}
function genNullable(...args) {
    return args.map((arg) => arg || 'null');
}
function genInterpolation(node, context) {
    const { push } = context;
    push(`${context.helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genExpression(node, context) {
    const { push } = context;
    push(node.content);
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

const baseParse = (content) => {
    const context = createParserContext(content);
    return createRootNode(parseChildren(context, []));
};
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node = parseNode(context, ancestors);
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function parseText(context) {
    const endToken = ['{{', '<'];
    let endIndex = context.source.length;
    for (const token of endToken) {
        const index = context.source.indexOf(token);
        if (index !== -1 && index < endIndex) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 4 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
function parseNode(context, ancestors) {
    const s = context.source;
    if (s.startsWith('{{')) {
        return parseInterpolation(context);
    }
    else if (s.startsWith('<')) {
        if (/[a-z]/i.test(s[1])) {
            return parseElement(context, ancestors);
        }
    }
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.START */);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.END */);
    }
    else {
        throw new Error(`missing end tag ${element.tag})}`);
    }
    return element;
}
function parseTag(context, type) {
    const match = /^<\/?([a-z]*)>/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    if (type === 0 /* TagType.START */) {
        return {
            type: 3 /* NodeTypes.ELEMENT */,
            tag,
        };
    }
}
function parseInterpolation(context) {
    const end = context.source.indexOf('}}');
    if (end !== -1) {
        const content = parseTextData(context, end + 2)
            .slice(2, -2)
            .trim();
        return {
            type: 1 /* NodeTypes.INTERPOLATION */,
            content: {
                type: 2 /* NodeTypes.SIMPLE_EXPRESSION */,
                content,
            },
        };
    }
}
function createParserContext(content) {
    return {
        source: content,
    };
}
function createRootNode(children) {
    return {
        type: 0 /* NodeTypes.ROOT */,
        children,
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function isEnd(context, ancestors) {
    if (context.source.length === 0) {
        return true;
    }
    for (let i = ancestors.length - 1; i >= 0; i--) {
        if (startsWithEndTagOpen(context.source, ancestors[i].tag)) {
            return true;
        }
    }
    return false;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith(`</`) &&
        source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
        /[\t\r\n\f />]/.test(source[2 + tag.length] || '>'));
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createCodegen(root);
    root.helpers = [...context.helpers];
}
function createCodegen(root) {
    const child = root.children[0];
    if (child.type === 3 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
function createTransformContext(root, options) {
    return {
        root,
        helpers: new Set(),
        helper(key) {
            this.helpers.add(key);
        },
        nodeTransforms: options.nodeTransforms || [],
    };
}
function traverseNode(root, context) {
    const { nodeTransforms } = context;
    const callbacks = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const fn = transform(root, context);
        if (fn) {
            callbacks.push(fn);
        }
    }
    switch (root.type) {
        case 0 /* NodeTypes.ROOT */:
        case 3 /* NodeTypes.ELEMENT */:
            traverseChildren(root, context);
            break;
        case 1 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
    }
    while (callbacks.length) {
        callbacks.pop()();
    }
}
function traverseChildren(root, context) {
    if (root.children) {
        for (let i = 0; i < root.children.length; i++) {
            traverseNode(root.children[i], context);
        }
    }
}

function createVNodeCall(tag, props, children, context) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 3 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

const transformElement = (node, context) => {
    if (node.type === 3 /* NodeTypes.ELEMENT */) {
        return () => {
            const vnodeTag = `'${node.tag}'`;
            let vnodeProps;
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(vnodeTag, vnodeProps, vnodeChildren, context);
        };
    }
};

const transformExpression = (node) => {
    if (node.type === 1 /* NodeTypes.INTERPOLATION */) {
        processExpression(node.content);
    }
};
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
}

const isText = (node) => {
    return node.type === 4 /* NodeTypes.TEXT */ || node.type === 1 /* NodeTypes.INTERPOLATION */;
};

const transformText = (node) => {
    if (node.type === 3 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    let j = i + 1;
                    let firstFlag = true;
                    while (j < children.length && isText(children[j])) {
                        if (firstFlag) {
                            children[i] = {
                                type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                children: [child],
                            };
                            firstFlag = false;
                        }
                        children[i].children.push(' + ');
                        children[i].children.push(children[j]);
                        children.splice(j, 1);
                    }
                }
            }
        };
    }
};

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    console.log(render);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { computed, createApp, createAppAPI, createVNode as createElementVNode, createFragment, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, nextTick, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlots, shallowReadonly, stop, toDisplayString, unRef };
