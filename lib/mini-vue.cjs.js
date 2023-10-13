'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

const isObject = (val) => val !== null && typeof val === 'object';

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
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

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    if (typeof vnode === 'string') {
        processText(vnode, container);
    }
    else if (typeof vnode.type === 'string') {
        processElement(vnode, container);
    }
    else {
        processComponent(vnode, container);
    }
}
function processText(vnode, container) {
    const textContainer = document.createTextNode(vnode);
    container.appendChild(textContainer);
}
function processElement(vnode, container) {
    const el = document.createElement(vnode.type);
    if (vnode.props) {
        for (const key in vnode.props) {
            const value = vnode.props[key];
            el.setAttribute(key, value);
        }
    }
    if (vnode.children) {
        if (Array.isArray(vnode.children)) {
            mountChildren(vnode, el);
        }
        else {
            patch(vnode.children, el);
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
    const subTree = instance.render();
    patch(subTree, container);
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

exports.createApp = createApp;
exports.h = h;
