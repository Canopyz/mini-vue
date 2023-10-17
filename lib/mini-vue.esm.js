const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
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

const targetMap = new Map();
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
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
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
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

const nativeOnRE = /^on[A-Z]/;
function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    console.log(vnode.type);
    switch (vnode.type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            console.log(1);
            processText(vnode, container);
            break;
        default:
            if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                processElement(vnode, container);
            }
            else if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                processComponent(vnode, container);
            }
    }
}
function processFragment(vnode, container) {
    if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        container.append(vnode.children);
    }
    else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, container);
    }
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    if (vnode.props) {
        for (const key in vnode.props) {
            const value = vnode.props[key];
            if (nativeOnRE.test(key)) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            }
            else {
                el.setAttribute(key, value);
            }
        }
    }
    if (vnode.children) {
        if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = vnode.children;
        }
        else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode, el);
        }
    }
    container.appendChild(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    instance.vnode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent, null);
            render(vnode, rootContainer);
        },
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

export { createApp, createFragment, createTextVNode, h, renderSlots };
