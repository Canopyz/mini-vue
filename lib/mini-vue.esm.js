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
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
const hasOwn = (target, key) => {
    return Object.prototype.hasOwnProperty.call(target, key);
};

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

function initProps(instance, rawProps) {
    console.log(rawProps);
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandler);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props));
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
    if (typeof vnode === 'string') {
        processText(vnode, container);
    }
    else {
        if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
            processElement(vnode, container);
        }
        else if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
            processComponent(vnode, container);
        }
    }
}
function processText(vnode, container) {
    insertText(vnode, container);
}
function insertText(vnode, container) {
    const textContainer = document.createTextNode(vnode);
    container.appendChild(textContainer);
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
            processText(vnode.children, el);
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
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
