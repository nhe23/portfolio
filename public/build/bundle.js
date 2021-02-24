
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        const z_index = (parseInt(computed_style.zIndex) || 0) - 1;
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            `overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: ${z_index};`);
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function bounceOut(t) {
        const a = 4.0 / 11.0;
        const b = 8.0 / 11.0;
        const c = 9.0 / 10.0;
        const ca = 4356.0 / 361.0;
        const cb = 35442.0 / 1805.0;
        const cc = 16061.0 / 1805.0;
        const t2 = t * t;
        return t < a
            ? 7.5625 * t2
            : t < b
                ? 9.075 * t2 - 9.9 * t + 3.4
                : t < c
                    ? ca * t2 - cb * t + cc
                    : 10.8 * t * t - 20.52 * t + 10.72;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }

    const presets = [
        {
            name: "light",
            colors: {
                primary: "#1e77fd",
                secondary: "#ff6584",
                background: "#ffffff",
                textColorPrimary: "#ffffff",
                light: "#e8eef3"
            }
        },
        {
            name: "dark",
            colors: {
                text: "#f1f1f1",
                background: "#27323a"
            }
        }
    ];

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src/Theming/ThemeContext.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ThemeContext", slots, ['default']);
    	
    	let { themes = [...presets] } = $$props;

    	// set state of current theme's name
    	let _current = themes[0].name;

    	// utility to get current theme from name
    	const getCurrentTheme = name => themes.find(h => h.name === name);

    	// set up Theme store, holding current theme object
    	const Theme = writable(getCurrentTheme(_current));

    	setContext("theme", {
    		// providing Theme store through context makes store readonly
    		theme: Theme,
    		toggle: () => {
    			// update internal state
    			let _currentIndex = themes.findIndex(h => h.name === _current);

    			_current = themes[_currentIndex === themes.length - 1
    			? 0
    			: _currentIndex += 1].name;

    			// update Theme store
    			Theme.update(t => Object.assign(Object.assign({}, t), getCurrentTheme(_current)));

    			setRootColors(getCurrentTheme(_current));
    		}
    	});

    	onMount(() => {
    		// set CSS vars on mount
    		setRootColors(getCurrentTheme(_current));
    	});

    	// sets CSS vars for easy use in components
    	// ex: var(--theme-background)
    	const setRootColors = theme => {
    		for (let [prop, color] of Object.entries(theme.colors)) {
    			let varString = `--theme-${prop}`;
    			document.documentElement.style.setProperty(varString, color);
    		}

    		document.documentElement.style.setProperty("--theme-name", theme.name);
    	};

    	const writable_props = ["themes"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ThemeContext> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("themes" in $$props) $$invalidate(0, themes = $$props.themes);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		onMount,
    		presets,
    		writable,
    		themes,
    		_current,
    		getCurrentTheme,
    		Theme,
    		setRootColors
    	});

    	$$self.$inject_state = $$props => {
    		if ("themes" in $$props) $$invalidate(0, themes = $$props.themes);
    		if ("_current" in $$props) _current = $$props._current;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [themes, $$scope, slots];
    }

    class ThemeContext extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { themes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemeContext",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get themes() {
    		throw new Error("<ThemeContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set themes(value) {
    		throw new Error("<ThemeContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Nav/Burger.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file = "src/Nav/Burger.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let span2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			span0 = element("span");
    			t1 = space();
    			span1 = element("span");
    			t2 = space();
    			span2 = element("span");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "hamburg");
    			attr_dev(input, "class", "svelte-vx12qw");
    			add_location(input, file, 63, 2, 1143);
    			attr_dev(span0, "class", "line svelte-vx12qw");
    			add_location(span0, file, 65, 4, 1251);
    			attr_dev(span1, "class", "line svelte-vx12qw");
    			add_location(span1, file, 66, 4, 1277);
    			attr_dev(span2, "class", "line svelte-vx12qw");
    			add_location(span2, file, 67, 4, 1303);
    			attr_dev(label, "for", "hamburg");
    			attr_dev(label, "class", "hamburg svelte-vx12qw");
    			add_location(label, file, 64, 2, 1209);
    			attr_dev(div, "class", "row");
    			add_location(div, file, 62, 0, 1123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, span0);
    			append_dev(label, t1);
    			append_dev(label, span1);
    			append_dev(label, t2);
    			append_dev(label, span2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*toggleBurger*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Burger", slots, []);
    	let { openened = false } = $$props;

    	const toggleBurger = () => {
    		$$invalidate(1, openened = !openened);
    		console.log(openened);
    	};

    	onDestroy(() => {
    		$$invalidate(1, openened = false);
    	});

    	const writable_props = ["openened"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Burger> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("openened" in $$props) $$invalidate(1, openened = $$props.openened);
    	};

    	$$self.$capture_state = () => ({ onDestroy, openened, toggleBurger });

    	$$self.$inject_state = $$props => {
    		if ("openened" in $$props) $$invalidate(1, openened = $$props.openened);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toggleBurger, openened];
    }

    class Burger extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { openened: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Burger",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get openened() {
    		throw new Error("<Burger>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set openened(value) {
    		throw new Error("<Burger>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/Nav/Links.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/Nav/Links.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "About";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Projects";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Contact";
    			attr_dev(a0, "href", "#about");
    			attr_dev(a0, "class", "svelte-18zkxir");
    			add_location(a0, file$1, 35, 2, 626);
    			attr_dev(a1, "href", "#projects");
    			attr_dev(a1, "class", "svelte-18zkxir");
    			add_location(a1, file$1, 36, 2, 655);
    			attr_dev(a2, "href", "#contact");
    			attr_dev(a2, "class", "svelte-18zkxir");
    			add_location(a2, file$1, 37, 2, 690);
    			attr_dev(div, "class", "svelte-18zkxir");
    			toggle_class(div, "links", !/*showMobile*/ ctx[0]);
    			toggle_class(div, "mobile", /*showMobile*/ ctx[0]);
    			add_location(div, file$1, 34, 0, 519);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*showMobile*/ 1) {
    				toggle_class(div, "links", !/*showMobile*/ ctx[0]);
    			}

    			if (dirty & /*showMobile*/ 1) {
    				toggle_class(div, "mobile", /*showMobile*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					slide,
    					{
    						duration: /*showMobile*/ ctx[0] ? 750 : 0
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				slide,
    				{
    					duration: /*showMobile*/ ctx[0] ? 750 : 0
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Links", slots, []);
    	let { showMobile = false } = $$props;
    	const writable_props = ["showMobile"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Links> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("showMobile" in $$props) $$invalidate(0, showMobile = $$props.showMobile);
    	};

    	$$self.$capture_state = () => ({ slide, showMobile });

    	$$self.$inject_state = $$props => {
    		if ("showMobile" in $$props) $$invalidate(0, showMobile = $$props.showMobile);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showMobile];
    }

    class Links extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { showMobile: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Links",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get showMobile() {
    		throw new Error("<Links>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showMobile(value) {
    		throw new Error("<Links>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Nav/Nav.svelte generated by Svelte v3.31.0 */
    const file$2 = "src/Nav/Nav.svelte";

    // (39:4) {:else}
    function create_else_block(ctx) {
    	let links;
    	let current;
    	links = new Links({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(links.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(links, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(links.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(links.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(links, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if w < 600}
    function create_if_block_1(ctx) {
    	let burger;
    	let updating_openened;
    	let current;

    	function burger_openened_binding(value) {
    		/*burger_openened_binding*/ ctx[2].call(null, value);
    	}

    	let burger_props = {};

    	if (/*burgerOpen*/ ctx[1] !== void 0) {
    		burger_props.openened = /*burgerOpen*/ ctx[1];
    	}

    	burger = new Burger({ props: burger_props, $$inline: true });
    	binding_callbacks.push(() => bind(burger, "openened", burger_openened_binding));

    	const block = {
    		c: function create() {
    			create_component(burger.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(burger, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const burger_changes = {};

    			if (!updating_openened && dirty & /*burgerOpen*/ 2) {
    				updating_openened = true;
    				burger_changes.openened = /*burgerOpen*/ ctx[1];
    				add_flush_callback(() => updating_openened = false);
    			}

    			burger.$set(burger_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(burger.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(burger.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(burger, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(37:4) {#if w < 600}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {#if w < 600 && burgerOpen}
    function create_if_block(ctx) {
    	let links;
    	let current;

    	links = new Links({
    			props: { showMobile: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(links.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(links, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(links.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(links.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(links, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(43:2) {#if w < 600 && burgerOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div1;
    	let nav;
    	let div0;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let current_block_type_index;
    	let if_block0;
    	let nav_resize_listener;
    	let t1;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*w*/ ctx[0] < 600) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*w*/ ctx[0] < 600 && /*burgerOpen*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			nav = element("nav");
    			div0 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if (img.src !== (img_src_value = "/NHLogo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "svelte-16ama1c");
    			add_location(img, file$2, 35, 34, 585);
    			attr_dev(a, "href", "/");
    			add_location(a, file$2, 35, 22, 573);
    			attr_dev(div0, "class", "logo svelte-16ama1c");
    			add_location(div0, file$2, 35, 4, 555);
    			attr_dev(nav, "class", "svelte-16ama1c");
    			add_render_callback(() => /*nav_elementresize_handler*/ ctx[3].call(nav));
    			add_location(nav, file$2, 34, 2, 524);
    			attr_dev(div1, "class", "navigation svelte-16ama1c");
    			add_location(div1, file$2, 33, 0, 497);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, nav);
    			append_dev(nav, div0);
    			append_dev(div0, a);
    			append_dev(a, img);
    			append_dev(nav, t0);
    			if_blocks[current_block_type_index].m(nav, null);
    			nav_resize_listener = add_resize_listener(nav, /*nav_elementresize_handler*/ ctx[3].bind(nav));
    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(nav, null);
    			}

    			if (/*w*/ ctx[0] < 600 && /*burgerOpen*/ ctx[1]) {
    				if (if_block1) {
    					if (dirty & /*w, burgerOpen*/ 3) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			nav_resize_listener();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nav", slots, []);
    	let w;
    	let burgerOpen;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	function burger_openened_binding(value) {
    		burgerOpen = value;
    		$$invalidate(1, burgerOpen);
    	}

    	function nav_elementresize_handler() {
    		w = this.clientWidth;
    		$$invalidate(0, w);
    	}

    	$$self.$capture_state = () => ({ Burger, Links, w, burgerOpen });

    	$$self.$inject_state = $$props => {
    		if ("w" in $$props) $$invalidate(0, w = $$props.w);
    		if ("burgerOpen" in $$props) $$invalidate(1, burgerOpen = $$props.burgerOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [w, burgerOpen, burger_openened_binding, nav_elementresize_handler];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/IllustrationComponents/Nature.svelte generated by Svelte v3.31.0 */

    const file$3 = "src/IllustrationComponents/Nature.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let g2;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let g0;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let g1;
    	let path19;
    	let path20;
    	let path21;
    	let path22;
    	let path23;
    	let path24;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g2 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			g0 = svg_element("g");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			g1 = svg_element("g");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			path24 = svg_element("path");
    			attr_dev(path0, "id", "Sun");
    			attr_dev(path0, "d", "M181.511 107.718C197.076 107.718 209.694 96.6322 209.694 82.9567C209.694 69.2812 197.076 58.1951 181.511 58.1951C165.946 58.1951 153.328 69.2812 153.328 82.9567C153.328 96.6322 165.946 107.718 181.511 107.718Z");
    			attr_dev(path0, "fill", "#FF6584");
    			add_location(path0, file$3, 99, 4, 2209);
    			attr_dev(path1, "id", "Vector");
    			attr_dev(path1, "d", "M258.819 101.419C258.881 101.409 258.928 101.371 259 101.38C258.968 101.273 258.927 101.168 258.877 101.067C258.787 101.174 258.695 101.284 258.615 101.38L258.819 101.419Z");
    			attr_dev(path1, "fill", "white");
    			add_location(path1, file$3, 103, 4, 2478);
    			attr_dev(path2, "id", "Vector_2");
    			attr_dev(path2, "d", "M69.7914 141.563C69.956 146.965 70.9859 152.32 72.8508 157.47C72.8935 157.59 72.9381 157.707 72.9828 157.827H84.4005C84.3883 157.72 84.3762 157.6 84.364 157.47C83.6027 149.78 79.2134 102.979 84.4614 94.9755C84.0026 95.6247 68.9062 117.129 69.7914 141.563Z");
    			attr_dev(path2, "fill", "#E6E6E6");
    			add_location(path2, file$3, 107, 4, 2710);
    			attr_dev(path3, "id", "Vector_3");
    			attr_dev(path3, "d", "M70.6481 157.47C70.7435 157.59 70.843 157.709 70.9445 157.827H79.5098C79.4448 157.725 79.3697 157.606 79.2824 157.47C77.8674 155.226 73.6791 148.518 69.7913 141.563C65.6132 134.089 61.7803 126.332 62.1031 123.524C62.0036 124.157 59.1126 143.461 70.6481 157.47Z");
    			attr_dev(path3, "fill", "#E6E6E6");
    			add_location(path3, file$3, 111, 4, 3030);
    			attr_dev(path4, "id", "Vector_4");
    			attr_dev(path4, "d", "M159.654 158.756C159.51 163.466 158.612 168.135 156.987 172.625C156.949 172.729 156.91 172.831 156.872 172.936H146.917C146.928 172.842 146.939 172.738 146.949 172.625C147.613 165.921 151.44 125.119 146.864 118.141C147.264 118.707 160.426 137.455 159.654 158.756Z");
    			attr_dev(path4, "fill", "#E6E6E6");
    			add_location(path4, file$3, 115, 4, 3355);
    			attr_dev(path5, "id", "Vector_5");
    			attr_dev(path5, "d", "M158.907 172.625C158.824 172.729 158.737 172.833 158.649 172.936H151.181C151.238 172.847 151.303 172.743 151.379 172.625C152.613 170.668 156.264 164.82 159.654 158.756C163.296 152.241 166.638 145.478 166.357 143.03C166.443 143.582 168.964 160.411 158.907 172.625Z");
    			attr_dev(path5, "fill", "#E6E6E6");
    			add_location(path5, file$3, 119, 4, 3682);
    			attr_dev(path6, "id", "Bird1");
    			attr_dev(path6, "d", "M45.8401 20.0986L50.4821 16.8366C46.876 16.487 45.3942 18.215 44.7878 19.5827C41.9705 18.5549 38.9036 19.9019 38.9036 19.9019L48.1914 22.8644C47.7228 21.7648 46.9072 20.8054 45.8401 20.0986V20.0986Z");
    			attr_dev(path6, "fill", "#3F3D56");
    			attr_dev(path6, "class", "svelte-birvnm");
    			add_location(path6, file$3, 123, 4, 4010);
    			attr_dev(path7, "id", "Bird2");
    			attr_dev(path7, "d", "M185.654 3.30772L190.296 0.0456834C186.69 -0.303879 185.208 1.42411 184.602 2.79182C181.785 1.76399 178.718 3.11101 178.718 3.11101L188.006 6.07351C187.537 4.97393 186.721 4.0145 185.654 3.30772V3.30772Z");
    			attr_dev(path7, "fill", "#3F3D56");
    			attr_dev(path7, "class", "svelte-birvnm");
    			add_location(path7, file$3, 127, 4, 4270);
    			attr_dev(path8, "id", "Vector_6");
    			attr_dev(path8, "d", "M253.953 132.306C253.953 135.009 253.846 137.689 253.632 140.348C251.978 161.324 243.7 181.478 229.728 198.548C227.902 200.787 225.985 202.964 223.976 205.077C218.772 210.561 212.994 215.604 206.717 220.14L179.205 205.956L162.756 172.224C162.756 172.224 187.299 128.564 253.91 129.355C253.937 130.335 253.952 131.319 253.953 132.306Z");
    			attr_dev(path8, "fill", "#3F3D56");
    			add_location(path8, file$3, 131, 4, 4535);
    			attr_dev(path9, "id", "Vector_7");
    			attr_dev(path9, "d", "M253.632 140.348C252.366 156.022 247.417 171.296 239.095 185.205C230.774 199.115 219.261 211.358 205.284 221.162L179.725 207.986L165.138 178.069C165.138 178.069 188.776 136.02 253.632 140.348Z");
    			attr_dev(path9, "fill", "#1E77FD");
    			add_location(path9, file$3, 135, 4, 4933);
    			attr_dev(path10, "id", "Vector_8");
    			attr_dev(path10, "d", "M229.728 198.548C227.902 200.787 225.985 202.964 223.976 205.077C210.518 219.284 193.321 230.395 173.874 237.449C169.937 238.875 165.906 240.133 161.783 241.222C132.013 248.178 100.473 246.419 71.9434 236.21C43.7275 225.146 20.9262 205.604 7.6348 181.097C5.84856 177.797 4.24227 174.414 2.81592 170.948C27.6923 154.936 76.7107 132.009 130.135 154.288C144.913 160.45 158.109 166.068 169.722 171.14C199.191 183.974 218.804 193.226 229.728 198.548Z");
    			attr_dev(path10, "fill", "#3F3D56");
    			add_location(path10, file$3, 139, 4, 5190);
    			attr_dev(path11, "id", "Vector_9");
    			attr_dev(path11, "d", "M223.976 205.077C210.064 219.726 192.182 231.067 171.975 238.054C151.769 245.042 129.887 247.452 108.342 245.064C86.7974 242.676 66.2823 235.566 48.6842 224.388C31.086 213.21 16.97 198.323 7.63477 181.097C28.4107 166.662 76.3296 140.721 128.916 162.647C142.44 168.287 154.514 173.427 165.137 178.069C196.107 191.556 215.184 200.721 223.976 205.077Z");
    			attr_dev(path11, "fill", "#1E77FD");
    			add_location(path11, file$3, 143, 4, 5700);
    			attr_dev(path12, "id", "Vector_10");
    			attr_dev(path12, "d", "M187.307 231.76C182.956 233.879 178.471 235.779 173.874 237.448C158.23 243.113 141.471 246.018 124.55 246C104.528 245.993 84.7807 241.908 66.8585 234.066C48.9363 226.223 33.3275 214.837 21.2578 200.801C52.1637 197.938 137.594 194.077 187.307 231.76Z");
    			attr_dev(path12, "fill", "#3F3D56");
    			add_location(path12, file$3, 147, 4, 6113);
    			attr_dev(path13, "id", "Vector_11");
    			attr_dev(path13, "d", "M173.874 237.449C149.616 246.212 122.901 248.3 97.2632 243.435C71.6252 238.57 48.2721 226.982 30.2922 210.204C41.5336 208.753 129.79 198.789 173.874 237.449Z");
    			attr_dev(path13, "fill", "#1E77FD");
    			add_location(path13, file$3, 151, 4, 6428);
    			attr_dev(path14, "id", "Vector_12");
    			attr_dev(path14, "d", "M232.249 69.2576V69.2611C139.848 9.23674 33.984 51.485 33.1663 51.8094V51.8059C45.1655 41.2646 59.4136 32.9065 75.0947 27.2105C90.7759 21.5144 107.582 18.5923 124.55 18.6113C169.472 18.6113 209.047 38.724 232.249 69.2576Z");
    			attr_dev(path14, "fill", "#E6E6E6");
    			add_location(path14, file$3, 155, 4, 6651);
    			attr_dev(path15, "id", "Vector_13");
    			attr_dev(path15, "d", "M40.5772 134.51C56.2084 132.034 64.2183 107.31 58.4679 79.2878C52.7175 51.2657 35.3844 30.5567 19.7533 33.0328C4.12221 35.509 -3.88772 60.2326 1.86265 88.2547C7.61301 116.277 24.9461 136.986 40.5772 134.51Z");
    			attr_dev(path15, "fill", "#3F3D56");
    			add_location(path15, file$3, 160, 6, 6959);
    			attr_dev(path16, "id", "Vector_14");
    			attr_dev(path16, "d", "M44.5943 167.236C43.6677 105.686 20.2284 47.9243 19.9919 47.3485L17.8542 48.0259C18.0897 48.5989 41.4003 106.058 42.3221 167.263L44.5943 167.236Z");
    			attr_dev(path16, "fill", "#1E77FD");
    			add_location(path16, file$3, 164, 6, 7239);
    			attr_dev(path17, "id", "Vector_15");
    			attr_dev(path17, "d", "M3.00845 76.8082L2.30908 78.7082L30.3705 86.6816L31.0698 84.7815L3.00845 76.8082Z");
    			attr_dev(path17, "fill", "#1E77FD");
    			add_location(path17, file$3, 168, 6, 7458);
    			attr_dev(path18, "id", "Vector_16");
    			attr_dev(path18, "d", "M55.7943 74.6679L32.6736 90.756L34.0847 92.3214L57.2054 76.2333L55.7943 74.6679Z");
    			attr_dev(path18, "fill", "#1E77FD");
    			add_location(path18, file$3, 172, 6, 7613);
    			attr_dev(g0, "id", "Tree1");
    			add_location(g0, file$3, 159, 4, 6938);
    			attr_dev(path19, "id", "Vector_17");
    			attr_dev(path19, "d", "M115.737 125.636C132.924 125.636 146.857 100.659 146.857 69.8472C146.857 39.0358 132.924 14.0582 115.737 14.0582C98.5503 14.0582 84.6174 39.0358 84.6174 69.8472C84.6174 100.659 98.5503 125.636 115.737 125.636Z");
    			attr_dev(path19, "fill", "#3F3D56");
    			add_location(path19, file$3, 178, 6, 7795);
    			attr_dev(path20, "id", "Vector_18");
    			attr_dev(path20, "d", "M112.864 161.165C125.327 95.462 112.989 29.9967 112.863 29.3436L110.439 29.7044C110.564 30.3543 122.832 95.4757 110.438 160.81L112.864 161.165Z");
    			attr_dev(path20, "fill", "#1E77FD");
    			add_location(path20, file$3, 182, 6, 8078);
    			attr_dev(path21, "id", "Vector_19");
    			attr_dev(path21, "d", "M88.3389 57.8508L87.179 59.7563L115.32 72.9811L116.48 71.0757L88.3389 57.8508Z");
    			attr_dev(path21, "fill", "#1E77FD");
    			add_location(path21, file$3, 186, 6, 8295);
    			attr_dev(path22, "id", "Vector_20");
    			attr_dev(path22, "d", "M145.02 64.4755L116.882 77.7079L118.043 79.613L146.18 66.3806L145.02 64.4755Z");
    			attr_dev(path22, "fill", "#1E77FD");
    			add_location(path22, file$3, 190, 6, 8447);
    			attr_dev(g1, "id", "Tree2");
    			add_location(g1, file$3, 177, 4, 7774);
    			attr_dev(path23, "id", "Vector_21");
    			attr_dev(path23, "d", "M250.913 107.69C239.495 102.058 227.566 97.2662 215.248 93.3636C147.136 71.7093 79.5965 80.0551 53.1602 111.045C73.7337 73.0799 147.144 61.142 221.225 84.6935C229.848 87.4322 238.286 90.5994 246.499 94.1797C248.288 98.5983 249.762 103.111 250.913 107.69V107.69Z");
    			attr_dev(path23, "fill", "#E6E6E6");
    			add_location(path23, file$3, 195, 4, 8605);
    			attr_dev(path24, "id", "Bird3");
    			attr_dev(path24, "d", "M158.924 46.5965L163.566 43.3345C159.96 42.9849 158.478 44.7129 157.872 46.0806C155.054 45.0528 151.987 46.3998 151.987 46.3998L161.275 49.3623C160.807 48.2628 159.991 47.3033 158.924 46.5965Z");
    			attr_dev(path24, "fill", "#3F3D56");
    			attr_dev(path24, "class", "svelte-birvnm");
    			add_location(path24, file$3, 199, 4, 8932);
    			attr_dev(g2, "id", "undraw_nature_m5ll 1");
    			add_location(g2, file$3, 98, 2, 2175);
    			attr_dev(svg, "width", /*height*/ ctx[0]);
    			attr_dev(svg, "height", /*width*/ ctx[1]);
    			attr_dev(svg, "viewBox", "0 0 259 246");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$3, 92, 0, 2058);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g2);
    			append_dev(g2, path0);
    			append_dev(g2, path1);
    			append_dev(g2, path2);
    			append_dev(g2, path3);
    			append_dev(g2, path4);
    			append_dev(g2, path5);
    			append_dev(g2, path6);
    			append_dev(g2, path7);
    			append_dev(g2, path8);
    			append_dev(g2, path9);
    			append_dev(g2, path10);
    			append_dev(g2, path11);
    			append_dev(g2, path12);
    			append_dev(g2, path13);
    			append_dev(g2, path14);
    			append_dev(g2, g0);
    			append_dev(g0, path15);
    			append_dev(g0, path16);
    			append_dev(g0, path17);
    			append_dev(g0, path18);
    			append_dev(g2, g1);
    			append_dev(g1, path19);
    			append_dev(g1, path20);
    			append_dev(g1, path21);
    			append_dev(g1, path22);
    			append_dev(g2, path23);
    			append_dev(g2, path24);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nature", slots, []);
    	let { sizeFactor = 1 } = $$props;
    	const height = 246 * sizeFactor;
    	const width = 259 * sizeFactor;
    	const writable_props = ["sizeFactor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nature> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("sizeFactor" in $$props) $$invalidate(2, sizeFactor = $$props.sizeFactor);
    	};

    	$$self.$capture_state = () => ({ sizeFactor, height, width });

    	$$self.$inject_state = $$props => {
    		if ("sizeFactor" in $$props) $$invalidate(2, sizeFactor = $$props.sizeFactor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [height, width, sizeFactor];
    }

    class Nature extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { sizeFactor: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nature",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get sizeFactor() {
    		throw new Error("<Nature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sizeFactor(value) {
    		throw new Error("<Nature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Home.svelte generated by Svelte v3.31.0 */
    const file$4 = "src/Home.svelte";

    function create_fragment$5(ctx) {
    	let div3;
    	let div1;
    	let svg;
    	let path;
    	let path_d_value;
    	let svg_viewBox_value;
    	let t0;
    	let div0;
    	let nature;
    	let t1;
    	let section;
    	let div2;
    	let h10;
    	let t3;
    	let h11;
    	let t5;
    	let h2;
    	let t7;
    	let a;
    	let button;
    	let div2_intro;
    	let div3_resize_listener;
    	let current;

    	nature = new Nature({
    			props: { sizeFactor: 0.75 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			div0 = element("div");
    			create_component(nature.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div2 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Build";
    			t3 = space();
    			h11 = element("h1");
    			h11.textContent = "outstanding";
    			t5 = space();
    			h2 = element("h2");
    			h2.textContent = "Web Applications";
    			t7 = space();
    			a = element("a");
    			button = element("button");
    			button.textContent = "Let's create";
    			attr_dev(path, "d", path_d_value = "M0 0L" + /*triangleWidth*/ ctx[2] + " " + /*triangleHeight*/ ctx[3] + "H0V0Z");
    			attr_dev(path, "fill", "#1A64D4");
    			add_location(path, file$4, 119, 6, 2645);
    			attr_dev(svg, "id", "triangle");
    			attr_dev(svg, "width", /*triangleWidth*/ ctx[2]);
    			attr_dev(svg, "height", /*triangleHeight*/ ctx[3]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + /*triangleWidth*/ ctx[2] + " " + /*triangleHeight*/ ctx[3]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-12c3qyv");
    			add_location(svg, file$4, 112, 4, 2443);
    			attr_dev(div0, "class", "illustrationContainer svelte-12c3qyv");
    			add_location(div0, file$4, 121, 4, 2731);
    			attr_dev(div1, "class", "illustration svelte-12c3qyv");
    			add_location(div1, file$4, 111, 2, 2412);
    			attr_dev(h10, "class", "svelte-12c3qyv");
    			add_location(h10, file$4, 128, 6, 2879);
    			attr_dev(h11, "class", "outstanding svelte-12c3qyv");
    			add_location(h11, file$4, 129, 6, 2900);
    			attr_dev(h2, "class", "svelte-12c3qyv");
    			add_location(h2, file$4, 130, 6, 2947);
    			attr_dev(button, "class", "primaryButton svelte-12c3qyv");
    			add_location(button, file$4, 131, 25, 2998);
    			attr_dev(a, "href", "#contact");
    			attr_dev(a, "class", "svelte-12c3qyv");
    			add_location(a, file$4, 131, 6, 2979);
    			attr_dev(div2, "class", "description svelte-12c3qyv");
    			add_location(div2, file$4, 127, 4, 2839);
    			attr_dev(section, "class", "svelte-12c3qyv");
    			add_location(section, file$4, 126, 2, 2825);
    			attr_dev(div3, "class", "sectionContainer svelte-12c3qyv");
    			add_render_callback(() => /*div3_elementresize_handler*/ ctx[4].call(div3));
    			add_location(div3, file$4, 110, 0, 2336);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, svg);
    			append_dev(svg, path);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(nature, div0, null);
    			append_dev(div3, t1);
    			append_dev(div3, section);
    			append_dev(section, div2);
    			append_dev(div2, h10);
    			append_dev(div2, t3);
    			append_dev(div2, h11);
    			append_dev(div2, t5);
    			append_dev(div2, h2);
    			append_dev(div2, t7);
    			append_dev(div2, a);
    			append_dev(a, button);
    			div3_resize_listener = add_resize_listener(div3, /*div3_elementresize_handler*/ ctx[4].bind(div3));
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*triangleWidth, triangleHeight*/ 12 && path_d_value !== (path_d_value = "M0 0L" + /*triangleWidth*/ ctx[2] + " " + /*triangleHeight*/ ctx[3] + "H0V0Z")) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (!current || dirty & /*triangleWidth*/ 4) {
    				attr_dev(svg, "width", /*triangleWidth*/ ctx[2]);
    			}

    			if (!current || dirty & /*triangleHeight*/ 8) {
    				attr_dev(svg, "height", /*triangleHeight*/ ctx[3]);
    			}

    			if (!current || dirty & /*triangleWidth, triangleHeight*/ 12 && svg_viewBox_value !== (svg_viewBox_value = "0 0 " + /*triangleWidth*/ ctx[2] + " " + /*triangleHeight*/ ctx[3])) {
    				attr_dev(svg, "viewBox", svg_viewBox_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nature.$$.fragment, local);

    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, fade, {});
    					div2_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nature.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(nature);
    			div3_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let h = 0;
    	let w = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	function div3_elementresize_handler() {
    		w = this.clientWidth;
    		h = this.clientHeight;
    		$$invalidate(1, w);
    		$$invalidate(0, h);
    	}

    	$$self.$capture_state = () => ({
    		fade,
    		Nature,
    		h,
    		w,
    		triangleWidth,
    		triangleHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("h" in $$props) $$invalidate(0, h = $$props.h);
    		if ("w" in $$props) $$invalidate(1, w = $$props.w);
    		if ("triangleWidth" in $$props) $$invalidate(2, triangleWidth = $$props.triangleWidth);
    		if ("triangleHeight" in $$props) $$invalidate(3, triangleHeight = $$props.triangleHeight);
    	};

    	let triangleWidth;
    	let triangleHeight;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*w*/ 2) {
    			 $$invalidate(2, triangleWidth = w / 2);
    		}

    		if ($$self.$$.dirty & /*h*/ 1) {
    			 $$invalidate(3, triangleHeight = h);
    		}
    	};

    	return [h, w, triangleWidth, triangleHeight, div3_elementresize_handler];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Sections/About/FrontendIllustration.svelte generated by Svelte v3.31.0 */

    const file$5 = "src/Sections/About/FrontendIllustration.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let g1;
    	let g0;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			attr_dev(path0, "id", "Vector");
    			attr_dev(path0, "d", "M130.453 180.178C199.998 180.178 256.375 176.642 256.375 172.279C256.375 167.916 199.998 164.38 130.453 164.38C60.9077 164.38 4.5304 167.916 4.5304 172.279C4.5304 176.642 60.9077 180.178 130.453 180.178Z");
    			attr_dev(path0, "fill", "#3F3D56");
    			add_location(path0, file$5, 8, 6, 157);
    			attr_dev(path1, "id", "Vector_2");
    			attr_dev(path1, "d", "M9.67278 164.535C12.5603 169.89 18.6885 172.189 18.6885 172.189C18.6885 172.189 20.1353 165.805 17.2478 160.45C14.3603 155.095 8.23203 152.796 8.23203 152.796C8.23203 152.796 6.7853 159.18 9.67278 164.535Z");
    			attr_dev(path1, "fill", "#3F3D56");
    			add_location(path1, file$5, 12, 6, 431);
    			attr_dev(path2, "id", "Vector_3");
    			attr_dev(path2, "d", "M11.6574 162.773C16.8705 165.909 18.8783 172.139 18.8783 172.139C18.8783 172.139 12.4339 173.283 7.22083 170.147C2.00773 167.011 0 160.781 0 160.781C0 160.781 6.44437 159.636 11.6574 162.773Z");
    			attr_dev(path2, "fill", "#1E77FD");
    			add_location(path2, file$5, 16, 6, 709);
    			attr_dev(path3, "id", "Vector_4");
    			attr_dev(path3, "d", "M231.759 22.0857H25.4293V28.6499H231.759V22.0857Z");
    			attr_dev(path3, "fill", "#F2F2F2");
    			add_location(path3, file$5, 20, 6, 973);
    			attr_dev(path4, "id", "Vector_5");
    			attr_dev(path4, "d", "M231.759 170.312H25.4293V126.031L48.2078 106.448L231.759 92.5305V170.312Z");
    			attr_dev(path4, "fill", "#1E77FD");
    			add_location(path4, file$5, 24, 6, 1095);
    			attr_dev(path5, "id", "Vector_6");
    			attr_dev(path5, "d", "M30.9508 26.97C31.889 26.97 32.6495 26.2095 32.6495 25.2712C32.6495 24.3329 31.889 23.5723 30.9508 23.5723C30.0125 23.5723 29.2518 24.3329 29.2518 25.2712C29.2518 26.2095 30.0125 26.97 30.9508 26.97Z");
    			attr_dev(path5, "fill", "#1E77FD");
    			add_location(path5, file$5, 28, 6, 1241);
    			attr_dev(path6, "id", "Vector_7");
    			attr_dev(path6, "d", "M36.472 26.97C37.4103 26.97 38.1708 26.2095 38.1708 25.2712C38.1708 24.3329 37.4103 23.5723 36.472 23.5723C35.5338 23.5723 34.773 24.3329 34.773 25.2712C34.773 26.2095 35.5338 26.97 36.472 26.97Z");
    			attr_dev(path6, "fill", "#1E77FD");
    			add_location(path6, file$5, 32, 6, 1513);
    			attr_dev(path7, "id", "Vector_8");
    			attr_dev(path7, "d", "M41.9933 26.97C42.9315 26.97 43.6923 26.2095 43.6923 25.2712C43.6923 24.3329 42.9315 23.5723 41.9933 23.5723C41.055 23.5723 40.2945 24.3329 40.2945 25.2712C40.2945 26.2095 41.055 26.97 41.9933 26.97Z");
    			attr_dev(path7, "fill", "#1E77FD");
    			add_location(path7, file$5, 36, 6, 1781);
    			attr_dev(path8, "id", "Vector_9");
    			attr_dev(path8, "d", "M231.634 92.2103L25.5543 125.782V28.775H231.634V92.2103Z");
    			attr_dev(path8, "fill", "white");
    			attr_dev(path8, "stroke", "#F2F2F2");
    			add_location(path8, file$5, 40, 6, 2053);
    			attr_dev(path9, "id", "Vector_10");
    			attr_dev(path9, "d", "M208.66 140.07C203.09 139.126 197.733 138.316 192.589 137.639L194.623 133.696C193.937 133.458 190.925 135.716 190.925 135.716L193.593 124.272C190.145 124.688 188.392 136.373 188.392 136.373L184.539 132.422L186.404 136.864C170.662 135.01 157.067 134.322 145.632 134.298L147.372 130.923C146.686 130.685 143.674 132.943 143.674 132.943L146.342 121.499C142.894 121.915 141.141 133.6 141.141 133.6L137.288 129.649L139.264 134.353C131.429 134.483 123.606 135.014 115.825 135.945C117.585 130.689 123.565 125.69 123.565 125.69C118.998 127.048 116.603 129.324 115.352 131.446C115.24 120.6 117.043 109.819 120.679 99.6007C120.679 99.6007 111.24 120.141 112.444 133.929L112.588 136.377C104.586 137.523 100.562 138.715 100.562 138.715L208.66 140.07Z");
    			attr_dev(path9, "fill", "#3F3D56");
    			add_location(path9, file$5, 45, 6, 2205);
    			attr_dev(path10, "id", "Vector_11");
    			attr_dev(path10, "d", "M97.9373 65.996H40.3198V68.3192H97.9373V65.996Z");
    			attr_dev(path10, "fill", "#3F3D56");
    			add_location(path10, file$5, 49, 6, 3016);
    			attr_dev(path11, "id", "Vector_12");
    			attr_dev(path11, "d", "M97.9373 71.1072H40.3198V73.4304H97.9373V71.1072Z");
    			attr_dev(path11, "fill", "#3F3D56");
    			add_location(path11, file$5, 53, 6, 3137);
    			attr_dev(path12, "id", "Vector_13");
    			attr_dev(path12, "d", "M59.8353 76.2185H40.3198V78.5418H59.8353V76.2185Z");
    			attr_dev(path12, "fill", "#3F3D56");
    			add_location(path12, file$5, 57, 6, 3260);
    			attr_dev(path13, "id", "Vector_14");
    			attr_dev(path13, "d", "M193.329 54.3054C204.924 54.3054 214.323 44.9057 214.323 33.3107C214.323 21.7156 204.924 12.3159 193.329 12.3159C181.733 12.3159 172.334 21.7156 172.334 33.3107C172.334 44.9057 181.733 54.3054 193.329 54.3054Z");
    			attr_dev(path13, "fill", "#FF6584");
    			add_location(path13, file$5, 61, 6, 3383);
    			attr_dev(path14, "id", "Vector_15");
    			attr_dev(path14, "d", "M207.942 58.6007C212.076 86.8085 196.749 99.1137 176.065 102.144C175.585 102.215 175.106 102.28 174.628 102.339C173.667 102.458 172.712 102.554 171.763 102.625C152.902 104.038 136.88 95.8102 133.036 69.577C129.058 42.429 158.734 3.0842 160.965 0.169678C160.968 0.169345 160.967 0.169345 160.969 0.166708C161.054 0.055678 161.098 0 161.098 0C161.098 0 203.809 30.3952 207.942 58.6007Z");
    			attr_dev(path14, "fill", "#1E77FD");
    			add_location(path14, file$5, 65, 6, 3666);
    			attr_dev(path15, "id", "Vector_16");
    			attr_dev(path15, "d", "M174.07 98.0294L184.964 76.8829L174.343 100.136L174.629 102.339C173.667 102.458 172.712 102.554 171.764 102.625L169.104 74.1889L169.061 73.9722L169.08 73.9272L168.83 71.2402L151.942 51.9642L168.578 69.2364L168.696 69.7969L166.686 48.3127L151.676 28.0362L166.282 44.5444L160.965 0.16963L160.948 0.0218506L160.97 0.16666L165.885 35.0554L175.59 19.5164L166.274 38.0649L168.761 57.2014L177.035 37.2747L169.129 60.0147L170.512 70.6554L182.678 42.8229L170.993 74.3679L174.07 98.0294Z");
    			attr_dev(path15, "fill", "#3F3D56");
    			add_location(path15, file$5, 69, 6, 4123);
    			attr_dev(g0, "id", "Group");
    			add_location(g0, file$5, 7, 4, 136);
    			attr_dev(g1, "id", "Frontend 1");
    			add_location(g1, file$5, 6, 2, 112);
    			attr_dev(svg, "width", "171");
    			attr_dev(svg, "height", "121");
    			attr_dev(svg, "viewBox", "0 0 257 181");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			append_dev(g0, path0);
    			append_dev(g0, path1);
    			append_dev(g0, path2);
    			append_dev(g0, path3);
    			append_dev(g0, path4);
    			append_dev(g0, path5);
    			append_dev(g0, path6);
    			append_dev(g0, path7);
    			append_dev(g0, path8);
    			append_dev(g0, path9);
    			append_dev(g0, path10);
    			append_dev(g0, path11);
    			append_dev(g0, path12);
    			append_dev(g0, path13);
    			append_dev(g0, path14);
    			append_dev(g0, path15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FrontendIllustration", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FrontendIllustration> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class FrontendIllustration extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FrontendIllustration",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Sections/About/BackendIllustration.svelte generated by Svelte v3.31.0 */

    const file$6 = "src/Sections/About/BackendIllustration.svelte";

    function create_fragment$7(ctx) {
    	let svg;
    	let g20;
    	let path0;
    	let path1;
    	let path2;
    	let g0;
    	let path3;
    	let g1;
    	let path4;
    	let g2;
    	let path5;
    	let g3;
    	let path6;
    	let g4;
    	let path7;
    	let g5;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let g6;
    	let path12;
    	let g7;
    	let path13;
    	let g8;
    	let path14;
    	let g9;
    	let path15;
    	let g10;
    	let path16;
    	let g11;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let g12;
    	let path21;
    	let g13;
    	let path22;
    	let g14;
    	let path23;
    	let g15;
    	let path24;
    	let g16;
    	let path25;
    	let g17;
    	let path26;
    	let path27;
    	let path28;
    	let path29;
    	let path30;
    	let g18;
    	let path31;
    	let path32;
    	let path33;
    	let path34;
    	let path35;
    	let g19;
    	let path36;
    	let path37;
    	let path38;
    	let path39;
    	let path40;
    	let path41;
    	let path42;
    	let path43;
    	let path44;
    	let path45;
    	let path46;
    	let path47;
    	let path48;
    	let defs;
    	let linearGradient0;
    	let stop0;
    	let stop1;
    	let stop2;
    	let linearGradient1;
    	let stop3;
    	let stop4;
    	let stop5;
    	let linearGradient2;
    	let stop6;
    	let stop7;
    	let stop8;
    	let linearGradient3;
    	let stop9;
    	let stop10;
    	let stop11;
    	let linearGradient4;
    	let stop12;
    	let stop13;
    	let stop14;
    	let linearGradient5;
    	let stop15;
    	let stop16;
    	let stop17;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g20 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			g0 = svg_element("g");
    			path3 = svg_element("path");
    			g1 = svg_element("g");
    			path4 = svg_element("path");
    			g2 = svg_element("g");
    			path5 = svg_element("path");
    			g3 = svg_element("g");
    			path6 = svg_element("path");
    			g4 = svg_element("g");
    			path7 = svg_element("path");
    			g5 = svg_element("g");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			g6 = svg_element("g");
    			path12 = svg_element("path");
    			g7 = svg_element("g");
    			path13 = svg_element("path");
    			g8 = svg_element("g");
    			path14 = svg_element("path");
    			g9 = svg_element("g");
    			path15 = svg_element("path");
    			g10 = svg_element("g");
    			path16 = svg_element("path");
    			g11 = svg_element("g");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			g12 = svg_element("g");
    			path21 = svg_element("path");
    			g13 = svg_element("g");
    			path22 = svg_element("path");
    			g14 = svg_element("g");
    			path23 = svg_element("path");
    			g15 = svg_element("g");
    			path24 = svg_element("path");
    			g16 = svg_element("g");
    			path25 = svg_element("path");
    			g17 = svg_element("g");
    			path26 = svg_element("path");
    			path27 = svg_element("path");
    			path28 = svg_element("path");
    			path29 = svg_element("path");
    			path30 = svg_element("path");
    			g18 = svg_element("g");
    			path31 = svg_element("path");
    			path32 = svg_element("path");
    			path33 = svg_element("path");
    			path34 = svg_element("path");
    			path35 = svg_element("path");
    			g19 = svg_element("g");
    			path36 = svg_element("path");
    			path37 = svg_element("path");
    			path38 = svg_element("path");
    			path39 = svg_element("path");
    			path40 = svg_element("path");
    			path41 = svg_element("path");
    			path42 = svg_element("path");
    			path43 = svg_element("path");
    			path44 = svg_element("path");
    			path45 = svg_element("path");
    			path46 = svg_element("path");
    			path47 = svg_element("path");
    			path48 = svg_element("path");
    			defs = svg_element("defs");
    			linearGradient0 = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			stop2 = svg_element("stop");
    			linearGradient1 = svg_element("linearGradient");
    			stop3 = svg_element("stop");
    			stop4 = svg_element("stop");
    			stop5 = svg_element("stop");
    			linearGradient2 = svg_element("linearGradient");
    			stop6 = svg_element("stop");
    			stop7 = svg_element("stop");
    			stop8 = svg_element("stop");
    			linearGradient3 = svg_element("linearGradient");
    			stop9 = svg_element("stop");
    			stop10 = svg_element("stop");
    			stop11 = svg_element("stop");
    			linearGradient4 = svg_element("linearGradient");
    			stop12 = svg_element("stop");
    			stop13 = svg_element("stop");
    			stop14 = svg_element("stop");
    			linearGradient5 = svg_element("linearGradient");
    			stop15 = svg_element("stop");
    			stop16 = svg_element("stop");
    			stop17 = svg_element("stop");
    			attr_dev(path0, "id", "Vector");
    			attr_dev(path0, "d", "M116.617 0H0V131.046H116.617V0Z");
    			attr_dev(path0, "fill", "url(#paint0_linear)");
    			add_location(path0, file$6, 7, 4, 133);
    			attr_dev(path1, "id", "Vector_2");
    			attr_dev(path1, "d", "M114.687 87.4941H1.92657V128.192H114.687V87.4941Z");
    			attr_dev(path1, "fill", "white");
    			add_location(path1, file$6, 11, 4, 239);
    			attr_dev(path2, "id", "Vector_3");
    			attr_dev(path2, "d", "M15.5518 97.1471H11.1822V118.001H15.5518V97.1471Z");
    			attr_dev(path2, "fill", "#64FFDA");
    			add_location(path2, file$6, 15, 4, 351);
    			attr_dev(path3, "id", "Vector_4");
    			attr_dev(path3, "opacity", "0.7");
    			attr_dev(path3, "d", "M24.1774 97.1471H19.8078V118.001H24.1774V97.1471Z");
    			attr_dev(path3, "fill", "#64FFDA");
    			add_location(path3, file$6, 20, 6, 500);
    			attr_dev(g0, "id", "Group");
    			attr_dev(g0, "opacity", "0.7");
    			add_location(g0, file$6, 19, 4, 465);
    			attr_dev(path4, "id", "Vector_5");
    			attr_dev(path4, "opacity", "0.6");
    			attr_dev(path4, "d", "M32.8059 97.1471H28.4363V118.001H32.8059V97.1471Z");
    			attr_dev(path4, "fill", "#64FFDA");
    			add_location(path4, file$6, 27, 6, 688);
    			attr_dev(g1, "id", "Group_2");
    			attr_dev(g1, "opacity", "0.6");
    			add_location(g1, file$6, 26, 4, 651);
    			attr_dev(path5, "id", "Vector_6");
    			attr_dev(path5, "opacity", "0.5");
    			attr_dev(path5, "d", "M41.4316 97.1471H37.062V118.001H41.4316V97.1471Z");
    			attr_dev(path5, "fill", "#64FFDA");
    			add_location(path5, file$6, 34, 6, 876);
    			attr_dev(g2, "id", "Group_3");
    			attr_dev(g2, "opacity", "0.5");
    			add_location(g2, file$6, 33, 4, 839);
    			attr_dev(path6, "id", "Vector_7");
    			attr_dev(path6, "opacity", "0.5");
    			attr_dev(path6, "d", "M50.0572 97.1471H45.6876V118.001H50.0572V97.1471Z");
    			attr_dev(path6, "fill", "#64FFDA");
    			add_location(path6, file$6, 41, 6, 1063);
    			attr_dev(g3, "id", "Group_4");
    			attr_dev(g3, "opacity", "0.5");
    			add_location(g3, file$6, 40, 4, 1026);
    			attr_dev(path7, "id", "Vector_8");
    			attr_dev(path7, "opacity", "0.4");
    			attr_dev(path7, "d", "M58.6829 97.1471H54.3133V118.001H58.6829V97.1471Z");
    			attr_dev(path7, "fill", "#64FFDA");
    			add_location(path7, file$6, 48, 6, 1251);
    			attr_dev(g4, "id", "Group_5");
    			attr_dev(g4, "opacity", "0.4");
    			add_location(g4, file$6, 47, 4, 1214);
    			attr_dev(path8, "id", "Vector_9");
    			attr_dev(path8, "opacity", "0.3");
    			attr_dev(path8, "d", "M67.3113 97.1471H62.9418V118.001H67.3113V97.1471Z");
    			attr_dev(path8, "fill", "#64FFDA");
    			add_location(path8, file$6, 55, 6, 1439);
    			attr_dev(g5, "id", "Group_6");
    			attr_dev(g5, "opacity", "0.3");
    			add_location(g5, file$6, 54, 4, 1402);
    			attr_dev(path9, "id", "Vector_10");
    			attr_dev(path9, "d", "M98.7241 118.056C104.547 118.056 109.268 113.303 109.268 107.44C109.268 101.577 104.547 96.8243 98.7241 96.8243C92.901 96.8243 88.1804 101.577 88.1804 107.44C88.1804 113.303 92.901 118.056 98.7241 118.056Z");
    			attr_dev(path9, "fill", "#1E77FD");
    			add_location(path9, file$6, 61, 4, 1590);
    			attr_dev(path10, "id", "Vector_11");
    			attr_dev(path10, "d", "M114.687 45.2112H1.92657V85.9086H114.687V45.2112Z");
    			attr_dev(path10, "fill", "white");
    			add_location(path10, file$6, 65, 4, 1861);
    			attr_dev(path11, "id", "Vector_12");
    			attr_dev(path11, "d", "M15.5518 54.8641H11.1822V75.7185H15.5518V54.8641Z");
    			attr_dev(path11, "fill", "#64FFDA");
    			add_location(path11, file$6, 69, 4, 1974);
    			attr_dev(path12, "id", "Vector_13");
    			attr_dev(path12, "opacity", "0.7");
    			attr_dev(path12, "d", "M24.1774 54.8641H19.8078V75.7185H24.1774V54.8641Z");
    			attr_dev(path12, "fill", "#64FFDA");
    			add_location(path12, file$6, 74, 6, 2126);
    			attr_dev(g6, "id", "Group_7");
    			attr_dev(g6, "opacity", "0.7");
    			add_location(g6, file$6, 73, 4, 2089);
    			attr_dev(path13, "id", "Vector_14");
    			attr_dev(path13, "opacity", "0.6");
    			attr_dev(path13, "d", "M32.8059 54.8641H28.4363V75.7185H32.8059V54.8641Z");
    			attr_dev(path13, "fill", "#64FFDA");
    			add_location(path13, file$6, 81, 6, 2315);
    			attr_dev(g7, "id", "Group_8");
    			attr_dev(g7, "opacity", "0.6");
    			add_location(g7, file$6, 80, 4, 2278);
    			attr_dev(path14, "id", "Vector_15");
    			attr_dev(path14, "opacity", "0.5");
    			attr_dev(path14, "d", "M41.4316 54.8641H37.062V75.7185H41.4316V54.8641Z");
    			attr_dev(path14, "fill", "#64FFDA");
    			add_location(path14, file$6, 88, 6, 2504);
    			attr_dev(g8, "id", "Group_9");
    			attr_dev(g8, "opacity", "0.5");
    			add_location(g8, file$6, 87, 4, 2467);
    			attr_dev(path15, "id", "Vector_16");
    			attr_dev(path15, "opacity", "0.5");
    			attr_dev(path15, "d", "M50.0572 54.8641H45.6876V75.7185H50.0572V54.8641Z");
    			attr_dev(path15, "fill", "#64FFDA");
    			add_location(path15, file$6, 95, 6, 2693);
    			attr_dev(g9, "id", "Group_10");
    			attr_dev(g9, "opacity", "0.5");
    			add_location(g9, file$6, 94, 4, 2655);
    			attr_dev(path16, "id", "Vector_17");
    			attr_dev(path16, "opacity", "0.4");
    			attr_dev(path16, "d", "M58.6829 54.8641H54.3133V75.7185H58.6829V54.8641Z");
    			attr_dev(path16, "fill", "#64FFDA");
    			add_location(path16, file$6, 102, 6, 2883);
    			attr_dev(g10, "id", "Group_11");
    			attr_dev(g10, "opacity", "0.4");
    			add_location(g10, file$6, 101, 4, 2845);
    			attr_dev(path17, "id", "Vector_18");
    			attr_dev(path17, "opacity", "0.3");
    			attr_dev(path17, "d", "M67.3113 54.8641H62.9418V75.7185H67.3113V54.8641Z");
    			attr_dev(path17, "fill", "#64FFDA");
    			add_location(path17, file$6, 109, 6, 3073);
    			attr_dev(g11, "id", "Group_12");
    			attr_dev(g11, "opacity", "0.3");
    			add_location(g11, file$6, 108, 4, 3035);
    			attr_dev(path18, "id", "Vector_19");
    			attr_dev(path18, "d", "M98.7241 75.7757C104.547 75.7757 109.268 71.0228 109.268 65.1599C109.268 59.297 104.547 54.5442 98.7241 54.5442C92.901 54.5442 88.1804 59.297 88.1804 65.1599C88.1804 71.0228 92.901 75.7757 98.7241 75.7757Z");
    			attr_dev(path18, "fill", "#1E77FD");
    			add_location(path18, file$6, 115, 4, 3225);
    			attr_dev(path19, "id", "Vector_20");
    			attr_dev(path19, "d", "M114.687 2.92822H1.92657V43.6257H114.687V2.92822Z");
    			attr_dev(path19, "fill", "white");
    			add_location(path19, file$6, 119, 4, 3496);
    			attr_dev(path20, "id", "Vector_21");
    			attr_dev(path20, "d", "M15.5518 12.584H11.1822V33.4384H15.5518V12.584Z");
    			attr_dev(path20, "fill", "#64FFDA");
    			add_location(path20, file$6, 123, 4, 3609);
    			attr_dev(path21, "id", "Vector_22");
    			attr_dev(path21, "opacity", "0.7");
    			attr_dev(path21, "d", "M24.1774 12.584H19.8078V33.4384H24.1774V12.584Z");
    			attr_dev(path21, "fill", "#64FFDA");
    			add_location(path21, file$6, 128, 6, 3760);
    			attr_dev(g12, "id", "Group_13");
    			attr_dev(g12, "opacity", "0.7");
    			add_location(g12, file$6, 127, 4, 3722);
    			attr_dev(path22, "id", "Vector_23");
    			attr_dev(path22, "opacity", "0.6");
    			attr_dev(path22, "d", "M32.8059 12.584H28.4363V33.4384H32.8059V12.584Z");
    			attr_dev(path22, "fill", "#64FFDA");
    			add_location(path22, file$6, 135, 6, 3948);
    			attr_dev(g13, "id", "Group_14");
    			attr_dev(g13, "opacity", "0.6");
    			add_location(g13, file$6, 134, 4, 3910);
    			attr_dev(path23, "id", "Vector_24");
    			attr_dev(path23, "opacity", "0.5");
    			attr_dev(path23, "d", "M41.4316 12.584H37.062V33.4384H41.4316V12.584Z");
    			attr_dev(path23, "fill", "#64FFDA");
    			add_location(path23, file$6, 142, 6, 4136);
    			attr_dev(g14, "id", "Group_15");
    			attr_dev(g14, "opacity", "0.5");
    			add_location(g14, file$6, 141, 4, 4098);
    			attr_dev(path24, "id", "Vector_25");
    			attr_dev(path24, "opacity", "0.5");
    			attr_dev(path24, "d", "M50.0572 12.584H45.6876V33.4384H50.0572V12.584Z");
    			attr_dev(path24, "fill", "#64FFDA");
    			add_location(path24, file$6, 149, 6, 4323);
    			attr_dev(g15, "id", "Group_16");
    			attr_dev(g15, "opacity", "0.5");
    			add_location(g15, file$6, 148, 4, 4285);
    			attr_dev(path25, "id", "Vector_26");
    			attr_dev(path25, "opacity", "0.4");
    			attr_dev(path25, "d", "M58.6829 12.584H54.3133V33.4384H58.6829V12.584Z");
    			attr_dev(path25, "fill", "#64FFDA");
    			add_location(path25, file$6, 156, 6, 4511);
    			attr_dev(g16, "id", "Group_17");
    			attr_dev(g16, "opacity", "0.4");
    			add_location(g16, file$6, 155, 4, 4473);
    			attr_dev(path26, "id", "Vector_27");
    			attr_dev(path26, "opacity", "0.3");
    			attr_dev(path26, "d", "M67.3113 12.584H62.9418V33.4384H67.3113V12.584Z");
    			attr_dev(path26, "fill", "#64FFDA");
    			add_location(path26, file$6, 163, 6, 4699);
    			attr_dev(g17, "id", "Group_18");
    			attr_dev(g17, "opacity", "0.3");
    			add_location(g17, file$6, 162, 4, 4661);
    			attr_dev(path27, "id", "Vector_28");
    			attr_dev(path27, "d", "M98.7241 34.3211C105.002 34.3211 110.091 29.1974 110.091 22.8769C110.091 16.5565 105.002 11.4327 98.7241 11.4327C92.4465 11.4327 87.3575 16.5565 87.3575 22.8769C87.3575 29.1974 92.4465 34.3211 98.7241 34.3211Z");
    			attr_dev(path27, "fill", "url(#paint1_linear)");
    			add_location(path27, file$6, 169, 4, 4849);
    			attr_dev(path28, "id", "Vector_29");
    			attr_dev(path28, "d", "M98.7241 76.8869C105.002 76.8869 110.091 71.7632 110.091 65.4427C110.091 59.1223 105.002 53.9985 98.7241 53.9985C92.4465 53.9985 87.3575 59.1223 87.3575 65.4427C87.3575 71.7632 92.4465 76.8869 98.7241 76.8869Z");
    			attr_dev(path28, "fill", "url(#paint2_linear)");
    			add_location(path28, file$6, 173, 4, 5136);
    			attr_dev(path29, "id", "Vector_30");
    			attr_dev(path29, "d", "M98.7241 119.167C105.002 119.167 110.091 114.043 110.091 107.723C110.091 101.402 105.002 96.2787 98.7241 96.2787C92.4465 96.2787 87.3575 101.402 87.3575 107.723C87.3575 114.043 92.4465 119.167 98.7241 119.167Z");
    			attr_dev(path29, "fill", "url(#paint3_linear)");
    			add_location(path29, file$6, 177, 4, 5423);
    			attr_dev(path30, "id", "Vector_31");
    			attr_dev(path30, "d", "M98.7241 33.4927C104.547 33.4927 109.268 28.7399 109.268 22.877C109.268 17.0141 104.547 12.2612 98.7241 12.2612C92.901 12.2612 88.1804 17.0141 88.1804 22.877C88.1804 28.7399 92.901 33.4927 98.7241 33.4927Z");
    			attr_dev(path30, "fill", "#1E77FD");
    			add_location(path30, file$6, 181, 4, 5710);
    			attr_dev(path31, "id", "Vector_32");
    			attr_dev(path31, "opacity", "0.7");
    			attr_dev(path31, "d", "M130.804 45.3282H132.506");
    			attr_dev(path31, "stroke", "#1E77FD");
    			attr_dev(path31, "stroke-width", "4");
    			attr_dev(path31, "stroke-linecap", "round");
    			attr_dev(path31, "stroke-linejoin", "round");
    			add_location(path31, file$6, 186, 6, 6019);
    			attr_dev(path32, "id", "Vector_33");
    			attr_dev(path32, "opacity", "0.7");
    			attr_dev(path32, "d", "M141.977 45.3282H189.342");
    			attr_dev(path32, "stroke", "#1E77FD");
    			attr_dev(path32, "stroke-width", "4");
    			attr_dev(path32, "stroke-linecap", "round");
    			attr_dev(path32, "stroke-linejoin", "round");
    			attr_dev(path32, "stroke-dasharray", "12.52 33.38");
    			add_location(path32, file$6, 194, 6, 6229);
    			attr_dev(path33, "id", "Vector_34");
    			attr_dev(path33, "opacity", "0.7");
    			attr_dev(path33, "d", "M194.077 45.3282H195.78V47.0423");
    			attr_dev(path33, "stroke", "#1E77FD");
    			attr_dev(path33, "stroke-width", "4");
    			attr_dev(path33, "stroke-linecap", "round");
    			attr_dev(path33, "stroke-linejoin", "round");
    			add_location(path33, file$6, 203, 6, 6478);
    			attr_dev(path34, "id", "Vector_35");
    			attr_dev(path34, "opacity", "0.7");
    			attr_dev(path34, "d", "M195.78 56.1298V89.0654");
    			attr_dev(path34, "stroke", "#1E77FD");
    			attr_dev(path34, "stroke-width", "4");
    			attr_dev(path34, "stroke-linecap", "round");
    			attr_dev(path34, "stroke-linejoin", "round");
    			attr_dev(path34, "stroke-dasharray", "11.93 31.8");
    			add_location(path34, file$6, 211, 6, 6695);
    			attr_dev(path35, "id", "Vector_36");
    			attr_dev(path35, "opacity", "0.7");
    			attr_dev(path35, "d", "M195.78 93.6075V95.3216");
    			attr_dev(path35, "stroke", "#1E77FD");
    			attr_dev(path35, "stroke-width", "4");
    			attr_dev(path35, "stroke-linecap", "round");
    			attr_dev(path35, "stroke-linejoin", "round");
    			add_location(path35, file$6, 220, 6, 6942);
    			attr_dev(g18, "id", "Group_19");
    			attr_dev(g18, "opacity", "0.7");
    			add_location(g18, file$6, 185, 4, 5981);
    			attr_dev(path36, "id", "Vector_37");
    			attr_dev(path36, "opacity", "0.7");
    			attr_dev(path36, "d", "M104.297 174.74L102.594 174.731");
    			attr_dev(path36, "stroke", "#1E77FD");
    			attr_dev(path36, "stroke-width", "4");
    			attr_dev(path36, "stroke-linecap", "round");
    			attr_dev(path36, "stroke-linejoin", "round");
    			add_location(path36, file$6, 230, 6, 7196);
    			attr_dev(path37, "id", "Vector_38");
    			attr_dev(path37, "opacity", "0.7");
    			attr_dev(path37, "d", "M93.1231 174.685L45.7614 174.457");
    			attr_dev(path37, "stroke", "#1E77FD");
    			attr_dev(path37, "stroke-width", "4");
    			attr_dev(path37, "stroke-linecap", "round");
    			attr_dev(path37, "stroke-linejoin", "round");
    			attr_dev(path37, "stroke-dasharray", "12.52 33.38");
    			add_location(path37, file$6, 238, 6, 7413);
    			attr_dev(path38, "id", "Vector_39");
    			attr_dev(path38, "opacity", "0.7");
    			attr_dev(path38, "d", "M41.023 174.437L39.3206 174.428L39.3319 172.714");
    			attr_dev(path38, "stroke", "#1E77FD");
    			attr_dev(path38, "stroke-width", "4");
    			attr_dev(path38, "stroke-linecap", "round");
    			attr_dev(path38, "stroke-linejoin", "round");
    			add_location(path38, file$6, 247, 6, 7670);
    			attr_dev(path39, "id", "Vector_40");
    			attr_dev(path39, "opacity", "0.7");
    			attr_dev(path39, "d", "M39.3887 163.918L39.5192 144.13");
    			attr_dev(path39, "stroke", "#1E77FD");
    			attr_dev(path39, "stroke-width", "4");
    			attr_dev(path39, "stroke-linecap", "round");
    			attr_dev(path39, "stroke-linejoin", "round");
    			attr_dev(path39, "stroke-dasharray", "11.55 30.79");
    			add_location(path39, file$6, 255, 6, 7903);
    			attr_dev(path40, "id", "Vector_41");
    			attr_dev(path40, "opacity", "0.7");
    			attr_dev(path40, "d", "M39.5475 139.73L39.5589 138.016");
    			attr_dev(path40, "stroke", "#1E77FD");
    			attr_dev(path40, "stroke-width", "4");
    			attr_dev(path40, "stroke-linecap", "round");
    			attr_dev(path40, "stroke-linejoin", "round");
    			add_location(path40, file$6, 264, 6, 8159);
    			attr_dev(g19, "id", "Group_20");
    			attr_dev(g19, "opacity", "0.7");
    			add_location(g19, file$6, 229, 4, 7158);
    			attr_dev(path41, "id", "Vector_42");
    			attr_dev(path41, "d", "M204.635 180.108C204.635 180.108 208.018 203.099 227.979 210.764H147.113C167.074 203.099 170.456 180.108 170.456 180.108H204.635Z");
    			attr_dev(path41, "fill", "#E0E0E0");
    			add_location(path41, file$6, 273, 4, 8383);
    			attr_dev(path42, "id", "Vector_43");
    			attr_dev(path42, "d", "M228.336 210.764H146.719V215.62H228.336V210.764Z");
    			attr_dev(path42, "fill", "url(#paint4_linear)");
    			add_location(path42, file$6, 277, 4, 8578);
    			attr_dev(path43, "id", "Vector_44");
    			attr_dev(path43, "d", "M227.979 210.764H147.124V214.512H227.979V210.764Z");
    			attr_dev(path43, "fill", "#F5F5F5");
    			add_location(path43, file$6, 281, 4, 8704);
    			attr_dev(path44, "id", "Vector_45");
    			attr_dev(path44, "d", "M253.45 98.3812H122.221C121.412 98.3812 120.636 98.7048 120.064 99.2807C119.492 99.8566 119.17 100.638 119.17 101.452V184.696C119.17 185.67 119.555 186.604 120.239 187.293C120.923 187.982 121.851 188.369 122.819 188.369H252.851C253.33 188.369 253.805 188.274 254.247 188.09C254.69 187.905 255.092 187.634 255.431 187.293C255.77 186.952 256.039 186.547 256.222 186.101C256.406 185.656 256.5 185.178 256.5 184.696V101.452C256.5 100.638 256.179 99.8566 255.607 99.2807C255.035 98.7048 254.259 98.3812 253.45 98.3812V98.3812Z");
    			attr_dev(path44, "fill", "url(#paint5_linear)");
    			add_location(path44, file$6, 285, 4, 8819);
    			attr_dev(path45, "id", "Vector_46");
    			attr_dev(path45, "d", "M123.872 99.6382H251.231C252.04 99.6382 252.816 99.9617 253.388 100.538C253.96 101.114 254.281 101.895 254.281 102.709V173.977H120.822V102.712C120.821 102.309 120.9 101.909 121.053 101.536C121.206 101.163 121.431 100.824 121.714 100.539C121.997 100.253 122.334 100.027 122.704 99.8722C123.074 99.7177 123.471 99.6382 123.872 99.6382V99.6382Z");
    			attr_dev(path45, "fill", "white");
    			add_location(path45, file$6, 289, 4, 9418);
    			attr_dev(path46, "id", "Vector_47");
    			attr_dev(path46, "d", "M250.632 186.238H124.471C123.503 186.238 122.575 185.851 121.89 185.162C121.206 184.473 120.822 183.539 120.822 182.564V173.977H254.281V182.564C254.281 183.539 253.897 184.473 253.212 185.162C252.528 185.851 251.6 186.238 250.632 186.238Z");
    			attr_dev(path46, "fill", "#F5F5F5");
    			add_location(path46, file$6, 293, 4, 9823);
    			attr_dev(path47, "id", "Vector_48");
    			attr_dev(path47, "d", "M248.192 105.66H127.419V165.669H248.192V105.66Z");
    			attr_dev(path47, "fill", "#1E77FD");
    			add_location(path47, file$6, 297, 4, 10127);
    			attr_dev(path48, "id", "Vector_49");
    			attr_dev(path48, "opacity", "0.2");
    			attr_dev(path48, "d", "M132.197 109.643H248.269V105.64H127.495V165.649H132.197V109.643Z");
    			attr_dev(path48, "fill", "white");
    			add_location(path48, file$6, 301, 4, 10240);
    			attr_dev(g20, "id", "Backend");
    			add_location(g20, file$6, 6, 2, 112);
    			attr_dev(stop0, "stop-color", "#808080");
    			attr_dev(stop0, "stop-opacity", "0.25");
    			add_location(stop0, file$6, 315, 6, 10559);
    			attr_dev(stop1, "offset", "0.54");
    			attr_dev(stop1, "stop-color", "#808080");
    			attr_dev(stop1, "stop-opacity", "0.12");
    			add_location(stop1, file$6, 316, 6, 10615);
    			attr_dev(stop2, "offset", "1");
    			attr_dev(stop2, "stop-color", "#808080");
    			attr_dev(stop2, "stop-opacity", "0.1");
    			add_location(stop2, file$6, 317, 6, 10685);
    			attr_dev(linearGradient0, "id", "paint0_linear");
    			attr_dev(linearGradient0, "x1", "58.3084");
    			attr_dev(linearGradient0, "y1", "131.046");
    			attr_dev(linearGradient0, "x2", "58.3084");
    			attr_dev(linearGradient0, "y2", "0");
    			attr_dev(linearGradient0, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient0, file$6, 308, 4, 10404);
    			attr_dev(stop3, "stop-color", "#808080");
    			attr_dev(stop3, "stop-opacity", "0.25");
    			add_location(stop3, file$6, 326, 6, 10932);
    			attr_dev(stop4, "offset", "0.54");
    			attr_dev(stop4, "stop-color", "#808080");
    			attr_dev(stop4, "stop-opacity", "0.12");
    			add_location(stop4, file$6, 327, 6, 10988);
    			attr_dev(stop5, "offset", "1");
    			attr_dev(stop5, "stop-color", "#808080");
    			attr_dev(stop5, "stop-opacity", "0.1");
    			add_location(stop5, file$6, 328, 6, 11058);
    			attr_dev(linearGradient1, "id", "paint1_linear");
    			attr_dev(linearGradient1, "x1", "7997.13");
    			attr_dev(linearGradient1, "y1", "2761.24");
    			attr_dev(linearGradient1, "x2", "7997.13");
    			attr_dev(linearGradient1, "y2", "927.426");
    			attr_dev(linearGradient1, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient1, file$6, 319, 4, 10771);
    			attr_dev(stop6, "stop-color", "#808080");
    			attr_dev(stop6, "stop-opacity", "0.25");
    			add_location(stop6, file$6, 337, 6, 11305);
    			attr_dev(stop7, "offset", "0.54");
    			attr_dev(stop7, "stop-color", "#808080");
    			attr_dev(stop7, "stop-opacity", "0.12");
    			add_location(stop7, file$6, 338, 6, 11361);
    			attr_dev(stop8, "offset", "1");
    			attr_dev(stop8, "stop-color", "#808080");
    			attr_dev(stop8, "stop-opacity", "0.1");
    			add_location(stop8, file$6, 339, 6, 11431);
    			attr_dev(linearGradient2, "id", "paint2_linear");
    			attr_dev(linearGradient2, "x1", "7997.13");
    			attr_dev(linearGradient2, "y1", "6214.19");
    			attr_dev(linearGradient2, "x2", "7997.13");
    			attr_dev(linearGradient2, "y2", "4380.37");
    			attr_dev(linearGradient2, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient2, file$6, 330, 4, 11144);
    			attr_dev(stop9, "stop-color", "#808080");
    			attr_dev(stop9, "stop-opacity", "0.25");
    			add_location(stop9, file$6, 348, 6, 11678);
    			attr_dev(stop10, "offset", "0.54");
    			attr_dev(stop10, "stop-color", "#808080");
    			attr_dev(stop10, "stop-opacity", "0.12");
    			add_location(stop10, file$6, 349, 6, 11734);
    			attr_dev(stop11, "offset", "1");
    			attr_dev(stop11, "stop-color", "#808080");
    			attr_dev(stop11, "stop-opacity", "0.1");
    			add_location(stop11, file$6, 350, 6, 11804);
    			attr_dev(linearGradient3, "id", "paint3_linear");
    			attr_dev(linearGradient3, "x1", "7997.13");
    			attr_dev(linearGradient3, "y1", "9643.95");
    			attr_dev(linearGradient3, "x2", "7997.13");
    			attr_dev(linearGradient3, "y2", "7810.13");
    			attr_dev(linearGradient3, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient3, file$6, 341, 4, 11517);
    			attr_dev(stop12, "stop-color", "#808080");
    			attr_dev(stop12, "stop-opacity", "0.25");
    			add_location(stop12, file$6, 359, 6, 12050);
    			attr_dev(stop13, "offset", "0.54");
    			attr_dev(stop13, "stop-color", "#808080");
    			attr_dev(stop13, "stop-opacity", "0.12");
    			add_location(stop13, file$6, 360, 6, 12106);
    			attr_dev(stop14, "offset", "1");
    			attr_dev(stop14, "stop-color", "#808080");
    			attr_dev(stop14, "stop-opacity", "0.1");
    			add_location(stop14, file$6, 361, 6, 12176);
    			attr_dev(linearGradient4, "id", "paint4_linear");
    			attr_dev(linearGradient4, "x1", "54088.5");
    			attr_dev(linearGradient4, "y1", "3876.3");
    			attr_dev(linearGradient4, "x2", "54088.5");
    			attr_dev(linearGradient4, "y2", "3793.74");
    			attr_dev(linearGradient4, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient4, file$6, 352, 4, 11890);
    			attr_dev(stop15, "stop-color", "#808080");
    			attr_dev(stop15, "stop-opacity", "0.25");
    			add_location(stop15, file$6, 370, 6, 12421);
    			attr_dev(stop16, "offset", "0.54");
    			attr_dev(stop16, "stop-color", "#808080");
    			attr_dev(stop16, "stop-opacity", "0.12");
    			add_location(stop16, file$6, 371, 6, 12477);
    			attr_dev(stop17, "offset", "1");
    			attr_dev(stop17, "stop-color", "#808080");
    			attr_dev(stop17, "stop-opacity", "0.1");
    			add_location(stop17, file$6, 372, 6, 12547);
    			attr_dev(linearGradient5, "id", "paint5_linear");
    			attr_dev(linearGradient5, "x1", "111356");
    			attr_dev(linearGradient5, "y1", "65969.7");
    			attr_dev(linearGradient5, "x2", "111356");
    			attr_dev(linearGradient5, "y2", "37623.4");
    			attr_dev(linearGradient5, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient5, file$6, 363, 4, 12262);
    			add_location(defs, file$6, 307, 2, 10393);
    			attr_dev(svg, "width", "171");
    			attr_dev(svg, "height", "144");
    			attr_dev(svg, "viewBox", "0 0 257 216");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g20);
    			append_dev(g20, path0);
    			append_dev(g20, path1);
    			append_dev(g20, path2);
    			append_dev(g20, g0);
    			append_dev(g0, path3);
    			append_dev(g20, g1);
    			append_dev(g1, path4);
    			append_dev(g20, g2);
    			append_dev(g2, path5);
    			append_dev(g20, g3);
    			append_dev(g3, path6);
    			append_dev(g20, g4);
    			append_dev(g4, path7);
    			append_dev(g20, g5);
    			append_dev(g5, path8);
    			append_dev(g20, path9);
    			append_dev(g20, path10);
    			append_dev(g20, path11);
    			append_dev(g20, g6);
    			append_dev(g6, path12);
    			append_dev(g20, g7);
    			append_dev(g7, path13);
    			append_dev(g20, g8);
    			append_dev(g8, path14);
    			append_dev(g20, g9);
    			append_dev(g9, path15);
    			append_dev(g20, g10);
    			append_dev(g10, path16);
    			append_dev(g20, g11);
    			append_dev(g11, path17);
    			append_dev(g20, path18);
    			append_dev(g20, path19);
    			append_dev(g20, path20);
    			append_dev(g20, g12);
    			append_dev(g12, path21);
    			append_dev(g20, g13);
    			append_dev(g13, path22);
    			append_dev(g20, g14);
    			append_dev(g14, path23);
    			append_dev(g20, g15);
    			append_dev(g15, path24);
    			append_dev(g20, g16);
    			append_dev(g16, path25);
    			append_dev(g20, g17);
    			append_dev(g17, path26);
    			append_dev(g20, path27);
    			append_dev(g20, path28);
    			append_dev(g20, path29);
    			append_dev(g20, path30);
    			append_dev(g20, g18);
    			append_dev(g18, path31);
    			append_dev(g18, path32);
    			append_dev(g18, path33);
    			append_dev(g18, path34);
    			append_dev(g18, path35);
    			append_dev(g20, g19);
    			append_dev(g19, path36);
    			append_dev(g19, path37);
    			append_dev(g19, path38);
    			append_dev(g19, path39);
    			append_dev(g19, path40);
    			append_dev(g20, path41);
    			append_dev(g20, path42);
    			append_dev(g20, path43);
    			append_dev(g20, path44);
    			append_dev(g20, path45);
    			append_dev(g20, path46);
    			append_dev(g20, path47);
    			append_dev(g20, path48);
    			append_dev(svg, defs);
    			append_dev(defs, linearGradient0);
    			append_dev(linearGradient0, stop0);
    			append_dev(linearGradient0, stop1);
    			append_dev(linearGradient0, stop2);
    			append_dev(defs, linearGradient1);
    			append_dev(linearGradient1, stop3);
    			append_dev(linearGradient1, stop4);
    			append_dev(linearGradient1, stop5);
    			append_dev(defs, linearGradient2);
    			append_dev(linearGradient2, stop6);
    			append_dev(linearGradient2, stop7);
    			append_dev(linearGradient2, stop8);
    			append_dev(defs, linearGradient3);
    			append_dev(linearGradient3, stop9);
    			append_dev(linearGradient3, stop10);
    			append_dev(linearGradient3, stop11);
    			append_dev(defs, linearGradient4);
    			append_dev(linearGradient4, stop12);
    			append_dev(linearGradient4, stop13);
    			append_dev(linearGradient4, stop14);
    			append_dev(defs, linearGradient5);
    			append_dev(linearGradient5, stop15);
    			append_dev(linearGradient5, stop16);
    			append_dev(linearGradient5, stop17);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BackendIllustration", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BackendIllustration> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class BackendIllustration extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BackendIllustration",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Sections/About/CloudIllustration.svelte generated by Svelte v3.31.0 */

    const file$7 = "src/Sections/About/CloudIllustration.svelte";

    function create_fragment$8(ctx) {
    	let svg;
    	let t;
    	let g3;
    	let path0;
    	let g0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let g2;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let g1;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let path21;
    	let path22;
    	let path23;
    	let path24;
    	let path25;
    	let path26;
    	let path27;
    	let path28;
    	let path29;
    	let path30;
    	let path31;
    	let path32;
    	let path33;
    	let path34;
    	let path35;
    	let path36;
    	let path37;
    	let path38;
    	let defs;
    	let filter;
    	let feFlood;
    	let feColorMatrix0;
    	let feOffset;
    	let feGaussianBlur;
    	let feColorMatrix1;
    	let feBlend0;
    	let feBlend1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t = text("s\n  ");
    			g3 = svg_element("g");
    			path0 = svg_element("path");
    			g0 = svg_element("g");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			g2 = svg_element("g");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			g1 = svg_element("g");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			path24 = svg_element("path");
    			path25 = svg_element("path");
    			path26 = svg_element("path");
    			path27 = svg_element("path");
    			path28 = svg_element("path");
    			path29 = svg_element("path");
    			path30 = svg_element("path");
    			path31 = svg_element("path");
    			path32 = svg_element("path");
    			path33 = svg_element("path");
    			path34 = svg_element("path");
    			path35 = svg_element("path");
    			path36 = svg_element("path");
    			path37 = svg_element("path");
    			path38 = svg_element("path");
    			defs = svg_element("defs");
    			filter = svg_element("filter");
    			feFlood = svg_element("feFlood");
    			feColorMatrix0 = svg_element("feColorMatrix");
    			feOffset = svg_element("feOffset");
    			feGaussianBlur = svg_element("feGaussianBlur");
    			feColorMatrix1 = svg_element("feColorMatrix");
    			feBlend0 = svg_element("feBlend");
    			feBlend1 = svg_element("feBlend");
    			attr_dev(path0, "id", "Vector");
    			attr_dev(path0, "opacity", "0.1");
    			attr_dev(path0, "d", "M178.69 53.4976C178.885 53.2178 178.992 52.8857 178.999 52.5439C178.999 50.473 174.815 48.7972 169.653 48.7972C164.492 48.7972 160.308 50.473 160.308 52.5439C160.318 52.9311 160.453 53.3045 160.693 53.6066C154.947 54.2537 151.076 55.4663 151.076 56.8582C151.076 58.9268 159.633 60.6049 170.216 60.6049C180.8 60.6049 189.357 58.9268 189.357 56.8582C189.346 55.3936 184.995 54.1107 178.69 53.4976Z");
    			attr_dev(path0, "fill", "#1E77FD");
    			add_location(path0, file$7, 7, 4, 132);
    			attr_dev(path1, "id", "Vector_2");
    			attr_dev(path1, "opacity", "0.2");
    			attr_dev(path1, "d", "M204.935 162.087C204.854 162.678 204.822 163.275 204.838 163.872C208.763 163.935 212.704 164.069 216.663 164.271C216.69 164.117 216.717 163.956 216.739 163.795C216.993 162.13 216.803 160.428 216.188 158.863C215.372 156.858 213.852 155.425 211.95 155.15C210.047 154.875 208.191 155.818 206.851 157.5C205.818 158.829 205.156 160.413 204.935 162.087Z");
    			attr_dev(path1, "fill", "#3F3D56");
    			add_location(path1, file$7, 13, 6, 645);
    			attr_dev(path2, "id", "Vector_3");
    			attr_dev(path2, "opacity", "0.2");
    			attr_dev(path2, "d", "M218.108 154.282C218.721 149.98 216.576 146.109 213.316 145.637C210.057 145.164 206.917 148.269 206.304 152.571C205.69 156.874 207.836 160.744 211.095 161.217C214.355 161.689 217.495 158.585 218.108 154.282Z");
    			attr_dev(path2, "fill", "#3F3D56");
    			add_location(path2, file$7, 18, 6, 1087);
    			attr_dev(path3, "id", "Vector_4");
    			attr_dev(path3, "opacity", "0.2");
    			attr_dev(path3, "d", "M219.464 144.762C220.078 140.46 217.932 136.589 214.673 136.117C211.413 135.644 208.273 138.749 207.66 143.051C207.047 147.354 209.192 151.225 212.452 151.697C215.711 152.17 218.851 149.065 219.464 144.762Z");
    			attr_dev(path3, "fill", "#3F3D56");
    			add_location(path3, file$7, 23, 6, 1389);
    			attr_dev(path4, "id", "Vector_5");
    			attr_dev(path4, "opacity", "0.2");
    			attr_dev(path4, "d", "M220.821 135.24C221.435 130.938 219.289 127.067 216.029 126.595C212.77 126.122 209.63 129.227 209.017 133.529C208.403 137.832 210.549 141.702 213.808 142.175C217.068 142.647 220.208 139.543 220.821 135.24Z");
    			attr_dev(path4, "fill", "#3F3D56");
    			add_location(path4, file$7, 28, 6, 1690);
    			attr_dev(path5, "id", "Vector_6");
    			attr_dev(path5, "opacity", "0.2");
    			attr_dev(path5, "d", "M222.178 125.718C222.791 121.416 220.646 117.545 217.386 117.073C214.126 116.6 210.987 119.705 210.373 124.007C209.76 128.31 211.905 132.18 215.165 132.653C218.425 133.125 221.565 130.021 222.178 125.718Z");
    			attr_dev(path5, "fill", "#3F3D56");
    			add_location(path5, file$7, 33, 6, 1990);
    			attr_dev(path6, "id", "Vector_7");
    			attr_dev(path6, "opacity", "0.5");
    			attr_dev(path6, "d", "M247.643 62.9029C248.597 61.9813 249.487 60.995 250.307 59.951L235.166 55.1439L251.92 57.7007C254.032 54.4028 255.455 50.705 256.101 46.8334C256.748 42.9618 256.604 38.998 255.678 35.1845L231.502 43.6928L254.442 31.3243C252.98 27.656 250.784 24.3306 247.992 21.555C245.201 18.7795 241.872 16.6133 238.214 15.1915C234.555 13.7696 230.646 13.1225 226.729 13.2904C222.812 13.4583 218.971 14.4377 215.445 16.1675C211.92 17.8973 208.786 20.3405 206.237 23.3449C203.689 26.3494 201.782 29.8507 200.634 33.6308C199.486 37.411 199.122 41.389 199.565 45.3172C200.007 49.2453 201.248 53.0394 203.208 56.4632C201.722 57.8925 200.394 59.479 199.245 61.1953L217.872 74.656L197.446 64.2835C195.298 68.5567 194.242 73.3024 194.371 78.0911C194.501 82.8798 195.813 87.5603 198.189 91.7089C194.31 95.4381 191.55 100.193 190.224 105.429C188.899 110.665 189.061 116.172 190.693 121.32C192.325 126.467 195.36 131.048 199.452 134.538C203.544 138.028 208.527 140.287 213.832 141.055C219.137 141.824 224.549 141.072 229.45 138.885C234.351 136.699 238.543 133.165 241.547 128.69C244.55 124.214 246.244 118.976 246.435 113.575C246.625 108.174 245.305 102.828 242.624 98.1487C247.258 93.6919 250.273 87.794 251.184 81.402C252.094 75.0101 250.848 68.495 247.646 62.9029H247.643Z");
    			attr_dev(path6, "fill", "#1E77FD");
    			add_location(path6, file$7, 38, 6, 2289);
    			attr_dev(path7, "id", "Vector_8");
    			attr_dev(path7, "opacity", "0.1");
    			attr_dev(path7, "d", "M194.649 73.2096C193.727 79.6018 194.974 86.1206 198.186 91.709C194.307 95.4381 191.547 100.193 190.222 105.429C188.896 110.665 189.059 116.172 190.691 121.32C192.323 126.467 195.358 131.048 199.45 134.538C203.542 138.028 208.525 140.287 213.83 141.055C219.135 141.824 224.547 141.072 229.448 138.885C234.349 136.699 238.541 133.165 241.544 128.69C244.548 124.214 246.242 118.976 246.432 113.575C246.623 108.174 245.302 102.828 242.622 98.1487C247.101 93.848 195.104 70.0102 194.649 73.2096Z");
    			attr_dev(path7, "fill", "black");
    			add_location(path7, file$7, 43, 6, 3634);
    			attr_dev(g0, "id", "Group");
    			attr_dev(g0, "opacity", "0.2");
    			add_location(g0, file$7, 12, 4, 610);
    			attr_dev(path8, "id", "Vector_9");
    			attr_dev(path8, "opacity", "0.2");
    			attr_dev(path8, "d", "M37.4841 153.669C37.573 154.182 37.7048 154.687 37.8782 155.177C41.0773 154.139 44.3094 153.155 47.5746 152.225C47.5565 152.089 47.5363 151.948 47.5115 151.807C47.2803 150.361 46.6761 149.002 45.7596 147.865C44.5684 146.428 42.956 145.661 41.3392 145.963C39.7224 146.265 38.4659 147.552 37.8241 149.332C37.3383 150.723 37.2211 152.218 37.4841 153.669V153.669Z");
    			attr_dev(path8, "fill", "#3F3D56");
    			add_location(path8, file$7, 50, 6, 4262);
    			attr_dev(path9, "id", "Vector_10");
    			attr_dev(path9, "opacity", "0.2");
    			attr_dev(path9, "d", "M42.1585 151.244C44.9396 150.801 46.7169 147.4 46.1282 143.648C45.5396 139.896 42.8079 137.214 40.0269 137.657C37.2458 138.101 35.4685 141.502 36.0572 145.254C36.6458 149.006 39.3775 151.688 42.1585 151.244Z");
    			attr_dev(path9, "fill", "#3F3D56");
    			add_location(path9, file$7, 55, 6, 4716);
    			attr_dev(path10, "id", "Vector_11");
    			attr_dev(path10, "opacity", "0.2");
    			attr_dev(path10, "d", "M41.4245 143.143C44.212 142.689 45.9831 139.272 45.3804 135.511C44.7777 131.751 42.0294 129.07 39.2419 129.525C36.4544 129.979 34.6833 133.396 35.286 137.156C35.8888 140.917 38.6371 143.597 41.4245 143.143Z");
    			attr_dev(path10, "fill", "#3F3D56");
    			add_location(path10, file$7, 60, 6, 5019);
    			attr_dev(path11, "id", "Vector_12");
    			attr_dev(path11, "opacity", "0.2");
    			attr_dev(path11, "d", "M39.32 134.681C42.1011 134.237 43.8784 130.836 43.2897 127.084C42.7011 123.332 39.9694 120.65 37.1884 121.094C34.4073 121.537 32.63 124.939 33.2187 128.691C33.8073 132.443 36.539 135.124 39.32 134.681Z");
    			attr_dev(path11, "fill", "#3F3D56");
    			add_location(path11, file$7, 65, 6, 5321);
    			attr_dev(path12, "id", "Vector_13");
    			attr_dev(path12, "opacity", "0.2");
    			attr_dev(path12, "d", "M37.9033 126.397C40.6843 125.954 42.4616 122.553 41.873 118.801C41.2843 115.049 38.5527 112.367 35.7716 112.81C32.9906 113.254 31.2133 116.655 31.8019 120.407C32.3906 124.159 35.1222 126.841 37.9033 126.397Z");
    			attr_dev(path12, "fill", "#3F3D56");
    			add_location(path12, file$7, 70, 6, 5618);
    			attr_dev(path13, "d", "M45.897 59.4491C46.4277 58.422 46.8889 57.3599 47.2773 56.2701L33.7213 56.4835L47.9889 53.9472C48.884 50.4255 49.0283 46.7525 48.4123 43.1704C47.8748 40.0005 46.7454 36.9622 45.084 34.2171L27.7201 48.0025L43.0596 31.3515C37.6372 24.7233 29.0307 21.1878 20.1495 22.8363C6.87487 25.2932 -1.96809 38.3906 0.376073 52.0829C1.30133 57.6141 4.03438 62.6744 8.14041 66.4587C7.31022 68.0603 6.65123 69.7463 6.17455 71.4883L24.8468 77.4852L5.52377 74.5538C5.12126 77.2707 5.15319 80.0351 5.61835 82.7419C6.54361 88.2731 9.27666 93.3333 13.3827 97.1177C10.7906 102.119 9.90646 107.842 10.8674 113.401C13.2115 127.095 25.8646 136.199 39.1302 133.735C52.3958 131.271 61.2477 118.176 58.9036 104.482C57.9773 98.9514 55.2444 93.8921 51.1392 90.108C53.7309 85.1062 54.615 79.3823 53.6545 73.8226C52.7301 68.2933 49.9996 63.2341 45.897 59.4491V59.4491Z");
    			attr_dev(path13, "fill", "#1E77FD");
    			add_location(path13, file$7, 76, 8, 5987);
    			attr_dev(g1, "id", "Vector_14");
    			attr_dev(g1, "opacity", "0.5");
    			attr_dev(g1, "filter", "url(#filter0_d)");
    			add_location(g1, file$7, 75, 6, 5921);
    			attr_dev(path14, "id", "Vector_15");
    			attr_dev(path14, "opacity", "0.1");
    			attr_dev(path14, "d", "M5.62508 82.7418C6.55034 88.273 9.28339 93.3333 13.3894 97.1176C10.7973 102.118 9.91319 107.842 10.8741 113.401C13.2183 127.095 25.8714 136.199 39.1369 133.735C52.4025 131.271 61.2545 118.176 58.9103 104.481C57.9841 98.9513 55.2512 93.8921 51.146 90.108C53.6433 85.2896 5.14769 79.9602 5.62508 82.7418Z");
    			attr_dev(path14, "fill", "black");
    			add_location(path14, file$7, 80, 6, 6889);
    			attr_dev(g2, "id", "Group_2");
    			attr_dev(g2, "opacity", "0.2");
    			add_location(g2, file$7, 49, 4, 4225);
    			attr_dev(path15, "id", "Vector_16");
    			attr_dev(path15, "d", "M25.6372 134.743C25.6372 146.621 33.0255 156.231 42.1567 156.231Z");
    			attr_dev(path15, "fill", "#46455B");
    			add_location(path15, file$7, 86, 4, 7292);
    			attr_dev(path16, "id", "Vector_17");
    			attr_dev(path16, "d", "M42.1566 156.231C42.1566 144.221 50.4028 134.502 60.5947 134.502Z");
    			attr_dev(path16, "fill", "#1E77FD");
    			add_location(path16, file$7, 90, 4, 7423);
    			attr_dev(path17, "id", "Vector_18");
    			attr_dev(path17, "d", "M31.6226 135.82C31.6226 147.103 36.3334 156.231 42.1567 156.231Z");
    			attr_dev(path17, "fill", "#1E77FD");
    			add_location(path17, file$7, 94, 4, 7554);
    			attr_dev(path18, "id", "Vector_19");
    			attr_dev(path18, "d", "M42.1566 156.231C42.1566 140.885 51.6886 128.467 63.468 128.467Z");
    			attr_dev(path18, "fill", "#46455B");
    			add_location(path18, file$7, 98, 4, 7684);
    			attr_dev(path19, "id", "Vector_20");
    			attr_dev(path19, "opacity", "0.1");
    			attr_dev(path19, "d", "M118.863 169.065C182.414 169.065 233.932 167.337 233.932 165.207C233.932 163.076 182.414 161.349 118.863 161.349C55.3124 161.349 3.79431 163.076 3.79431 165.207C3.79431 167.337 55.3124 169.065 118.863 169.065Z");
    			attr_dev(path19, "fill", "#1E77FD");
    			add_location(path19, file$7, 102, 4, 7814);
    			attr_dev(path20, "id", "Vector_21");
    			attr_dev(path20, "opacity", "0.1");
    			attr_dev(path20, "d", "M40.2493 159.28C42.5724 159.28 44.4557 158.959 44.4557 158.563C44.4557 158.167 42.5724 157.845 40.2493 157.845C37.9261 157.845 36.0428 158.167 36.0428 158.563C36.0428 158.959 37.9261 159.28 40.2493 159.28Z");
    			attr_dev(path20, "fill", "#1E77FD");
    			add_location(path20, file$7, 107, 4, 8109);
    			attr_dev(path21, "id", "Vector_22");
    			attr_dev(path21, "d", "M37.4233 155.229C37.4233 155.229 39.8238 155.157 40.5466 154.637C41.2695 154.117 44.2351 153.501 44.4153 154.33C44.5954 155.159 48.0182 158.472 45.316 158.492C42.6138 158.513 39.0244 158.068 38.3016 157.625C37.5787 157.182 37.4233 155.229 37.4233 155.229Z");
    			attr_dev(path21, "fill", "#A8A8A8");
    			add_location(path21, file$7, 112, 4, 8400);
    			attr_dev(path22, "id", "Vector_23");
    			attr_dev(path22, "opacity", "0.2");
    			attr_dev(path22, "d", "M45.3611 158.204C42.6589 158.224 39.0672 157.777 38.3466 157.334C37.7971 156.998 37.5765 155.786 37.5044 155.227H37.4233C37.4233 155.227 37.5765 157.18 38.2971 157.623C39.0176 158.066 42.6048 158.513 45.3115 158.49C46.0929 158.49 46.3631 158.204 46.3496 157.789C46.2415 158.043 45.942 158.2 45.3611 158.204Z");
    			attr_dev(path22, "fill", "black");
    			add_location(path22, file$7, 116, 4, 8721);
    			attr_dev(path23, "id", "Vector_24");
    			attr_dev(path23, "d", "M156.324 69.1567C153.092 53.0983 139.243 41 122.395 41C109.008 41 97.4674 48.6795 91.6959 59.8468C77.8471 61.2433 67 73.1122 67 87.5493C67 102.908 79.4617 115.479 94.6976 115.479H154.709C167.403 115.479 177.79 105.004 177.79 92.2043C177.815 86.3228 175.603 80.6556 171.61 76.3685C167.617 72.0814 162.146 69.5005 156.324 69.1567V69.1567ZM129.779 82.883V100.572H115.007V82.883H99.3116L122.393 59.6197L145.474 82.8944L129.779 82.883Z");
    			attr_dev(path23, "fill", "#1E77FD");
    			add_location(path23, file$7, 121, 4, 9112);
    			attr_dev(path24, "id", "Vector_25");
    			attr_dev(path24, "d", "M183.041 129.873C183.041 152.212 196.939 170.291 214.116 170.291Z");
    			attr_dev(path24, "fill", "#46455B");
    			add_location(path24, file$7, 125, 4, 9608);
    			attr_dev(path25, "id", "Vector_26");
    			attr_dev(path25, "d", "M214.116 170.291C214.116 147.698 229.624 129.418 248.794 129.418Z");
    			attr_dev(path25, "fill", "#1E77FD");
    			add_location(path25, file$7, 129, 4, 9739);
    			attr_dev(path26, "id", "Vector_27");
    			attr_dev(path26, "d", "M194.3 131.884C194.3 153.106 203.161 170.28 214.116 170.28Z");
    			attr_dev(path26, "fill", "#1E77FD");
    			add_location(path26, file$7, 133, 4, 9870);
    			attr_dev(path27, "id", "Vector_28");
    			attr_dev(path27, "d", "M214.116 170.291C214.116 141.424 232.043 118.065 254.199 118.065Z");
    			attr_dev(path27, "fill", "#46455B");
    			add_location(path27, file$7, 137, 4, 9995);
    			attr_dev(path28, "id", "Vector_29");
    			attr_dev(path28, "opacity", "0.1");
    			attr_dev(path28, "d", "M212.767 178C217.034 178 220.493 177.41 220.493 176.683C220.493 175.956 217.034 175.366 212.767 175.366C208.5 175.366 205.041 175.956 205.041 176.683C205.041 177.41 208.5 178 212.767 178Z");
    			attr_dev(path28, "fill", "#1E77FD");
    			add_location(path28, file$7, 141, 4, 10126);
    			attr_dev(path29, "id", "Vector_30");
    			attr_dev(path29, "d", "M207.577 170.563C207.577 170.563 211.983 170.427 213.312 169.474C214.641 168.52 220.092 167.38 220.421 168.91C220.75 170.441 227.044 176.517 222.069 176.558C217.095 176.599 210.509 175.777 209.182 174.969C207.856 174.16 207.577 170.563 207.577 170.563Z");
    			attr_dev(path29, "fill", "#A8A8A8");
    			add_location(path29, file$7, 146, 4, 10399);
    			attr_dev(path30, "id", "Vector_31");
    			attr_dev(path30, "opacity", "0.2");
    			attr_dev(path30, "d", "M222.151 176.024C217.176 176.065 210.59 175.243 209.263 174.435C208.254 173.813 207.851 171.59 207.718 170.561H207.57C207.57 170.561 207.849 174.144 209.175 174.959C210.502 175.775 217.086 176.597 222.063 176.549C223.497 176.538 223.995 176.022 223.968 175.259C223.774 175.741 223.227 176.015 222.151 176.024Z");
    			attr_dev(path30, "fill", "black");
    			add_location(path30, file$7, 150, 4, 10717);
    			attr_dev(path31, "id", "Vector_32");
    			attr_dev(path31, "opacity", "0.1");
    			attr_dev(path31, "d", "M183.644 8.31082C183.839 8.03105 183.946 7.69893 183.953 7.35713C183.953 5.28625 179.769 3.61047 174.607 3.61047C169.446 3.61047 165.262 5.28625 165.262 7.35713C165.266 7.74223 165.395 8.1154 165.629 8.41981C159.883 9.06696 156.012 10.2795 156.012 11.6715C156.012 13.7401 164.569 15.4181 175.152 15.4181C185.736 15.4181 194.293 13.7401 194.293 11.6715C194.3 10.2069 189.949 8.92391 183.644 8.31082Z");
    			attr_dev(path31, "fill", "#1E77FD");
    			add_location(path31, file$7, 155, 4, 11110);
    			attr_dev(path32, "id", "Vector_33");
    			attr_dev(path32, "opacity", "0.1");
    			attr_dev(path32, "d", "M69.0255 12.3981C69.2204 12.1183 69.3278 11.7862 69.334 11.4444C69.334 9.37353 65.1501 7.69775 59.9889 7.69775C54.8277 7.69775 50.6438 9.37353 50.6438 11.4444C50.6531 11.8316 50.7884 12.205 51.0289 12.5071C45.2822 13.1542 41.4113 14.3668 41.4113 15.7587C41.4113 17.8273 49.9795 19.5054 60.5519 19.5054C71.1243 19.5054 79.6925 17.8273 79.6925 15.7587C79.6812 14.2941 75.3307 13.0112 69.0255 12.3981Z");
    			attr_dev(path32, "fill", "#1E77FD");
    			add_location(path32, file$7, 160, 4, 11594);
    			attr_dev(path33, "id", "Vector_34");
    			attr_dev(path33, "opacity", "0.1");
    			attr_dev(path33, "d", "M122 17.3207C122.525 17.0141 123.234 17.307 123.594 17.802C123.955 18.2971 124.045 18.9374 124.146 19.5323C124.346 20.8766 124.493 22.4184 123.594 23.4288C125.063 18.9397 129.285 15.5018 133.953 15");
    			attr_dev(path33, "stroke", "#1E77FD");
    			attr_dev(path33, "stroke-width", "3");
    			attr_dev(path33, "stroke-miterlimit", "10");
    			add_location(path33, file$7, 165, 4, 12078);
    			attr_dev(path34, "id", "Vector_35");
    			attr_dev(path34, "opacity", "0.1");
    			attr_dev(path34, "d", "M59.6151 32.1804C59.9529 31.9828 60.4078 32.1804 60.6397 32.4892C60.8463 32.8254 60.9684 33.2073 60.9955 33.6018C61.1238 34.467 61.2207 35.457 60.6419 36.0996C61.1358 34.658 62.0215 33.3855 63.1981 32.4271C64.3747 31.4688 65.7947 30.8632 67.2961 30.6794");
    			attr_dev(path34, "stroke", "#1E77FD");
    			attr_dev(path34, "stroke-width", "3");
    			attr_dev(path34, "stroke-miterlimit", "10");
    			add_location(path34, file$7, 172, 4, 12415);
    			attr_dev(path35, "id", "Vector_36");
    			attr_dev(path35, "opacity", "0.1");
    			attr_dev(path35, "d", "M160.948 38.9924C161.286 38.7948 161.741 38.9924 161.972 39.3012C162.179 39.6374 162.301 40.0193 162.328 40.4138C162.457 41.279 162.553 42.269 161.975 42.9116C162.469 41.4701 163.354 40.1975 164.531 39.2391C165.707 38.2808 167.127 37.6752 168.629 37.4915");
    			attr_dev(path35, "stroke", "#1E77FD");
    			attr_dev(path35, "stroke-width", "3");
    			attr_dev(path35, "stroke-miterlimit", "10");
    			add_location(path35, file$7, 179, 4, 12808);
    			attr_dev(path36, "id", "Vector_37");
    			attr_dev(path36, "opacity", "0.1");
    			attr_dev(path36, "d", "M152.641 115.34V109.822L155.163 112.366L155.793 111.707L152.19 108.074L148.587 111.707L149.218 112.341L151.74 109.822V115.34H152.641Z");
    			attr_dev(path36, "fill", "#1E77FD");
    			add_location(path36, file$7, 186, 4, 13202);
    			attr_dev(path37, "id", "Vector_38");
    			attr_dev(path37, "opacity", "0.1");
    			attr_dev(path37, "d", "M98.1463 133.506V127.988L100.668 130.531L101.299 129.873L97.696 126.24L94.093 129.873L94.7235 130.506L97.2456 127.988V133.506H98.1463Z");
    			attr_dev(path37, "fill", "#1E77FD");
    			add_location(path37, file$7, 191, 4, 13421);
    			attr_dev(path38, "id", "Vector_39");
    			attr_dev(path38, "opacity", "0.1");
    			attr_dev(path38, "d", "M138.229 149.628V144.11L140.751 146.653L141.382 145.995L137.779 142.361L134.176 145.995L134.806 146.628L137.328 144.11V149.628H138.229Z");
    			attr_dev(path38, "fill", "#1E77FD");
    			add_location(path38, file$7, 196, 4, 13641);
    			attr_dev(g3, "id", "Cloud");
    			add_location(g3, file$7, 6, 2, 113);
    			attr_dev(feFlood, "flood-opacity", "0");
    			attr_dev(feFlood, "result", "BackgroundImageFix");
    			add_location(feFlood, file$7, 211, 6, 14072);
    			attr_dev(feColorMatrix0, "in", "SourceAlpha");
    			attr_dev(feColorMatrix0, "type", "matrix");
    			attr_dev(feColorMatrix0, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix0, file$7, 212, 6, 14136);
    			attr_dev(feOffset, "dy", "4");
    			add_location(feOffset, file$7, 216, 6, 14266);
    			attr_dev(feGaussianBlur, "stdDeviation", "2");
    			add_location(feGaussianBlur, file$7, 217, 6, 14292);
    			attr_dev(feColorMatrix1, "type", "matrix");
    			attr_dev(feColorMatrix1, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix1, file$7, 218, 6, 14334);
    			attr_dev(feBlend0, "mode", "normal");
    			attr_dev(feBlend0, "in2", "BackgroundImageFix");
    			attr_dev(feBlend0, "result", "effect1_dropShadow");
    			add_location(feBlend0, file$7, 221, 6, 14440);
    			attr_dev(feBlend1, "mode", "normal");
    			attr_dev(feBlend1, "in", "SourceGraphic");
    			attr_dev(feBlend1, "in2", "effect1_dropShadow");
    			attr_dev(feBlend1, "result", "shape");
    			add_location(feBlend1, file$7, 225, 6, 14549);
    			attr_dev(filter, "id", "filter0_d");
    			attr_dev(filter, "x", "-4.00049");
    			attr_dev(filter, "y", "22.4343");
    			attr_dev(filter, "width", "67.2803");
    			attr_dev(filter, "height", "119.703");
    			attr_dev(filter, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter, "color-interpolation-filters", "sRGB");
    			add_location(filter, file$7, 203, 4, 13878);
    			add_location(defs, file$7, 202, 2, 13867);
    			attr_dev(svg, "width", "171");
    			attr_dev(svg, "height", "119");
    			attr_dev(svg, "viewBox", "0 0 257 178");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, t);
    			append_dev(svg, g3);
    			append_dev(g3, path0);
    			append_dev(g3, g0);
    			append_dev(g0, path1);
    			append_dev(g0, path2);
    			append_dev(g0, path3);
    			append_dev(g0, path4);
    			append_dev(g0, path5);
    			append_dev(g0, path6);
    			append_dev(g0, path7);
    			append_dev(g3, g2);
    			append_dev(g2, path8);
    			append_dev(g2, path9);
    			append_dev(g2, path10);
    			append_dev(g2, path11);
    			append_dev(g2, path12);
    			append_dev(g2, g1);
    			append_dev(g1, path13);
    			append_dev(g2, path14);
    			append_dev(g3, path15);
    			append_dev(g3, path16);
    			append_dev(g3, path17);
    			append_dev(g3, path18);
    			append_dev(g3, path19);
    			append_dev(g3, path20);
    			append_dev(g3, path21);
    			append_dev(g3, path22);
    			append_dev(g3, path23);
    			append_dev(g3, path24);
    			append_dev(g3, path25);
    			append_dev(g3, path26);
    			append_dev(g3, path27);
    			append_dev(g3, path28);
    			append_dev(g3, path29);
    			append_dev(g3, path30);
    			append_dev(g3, path31);
    			append_dev(g3, path32);
    			append_dev(g3, path33);
    			append_dev(g3, path34);
    			append_dev(g3, path35);
    			append_dev(g3, path36);
    			append_dev(g3, path37);
    			append_dev(g3, path38);
    			append_dev(svg, defs);
    			append_dev(defs, filter);
    			append_dev(filter, feFlood);
    			append_dev(filter, feColorMatrix0);
    			append_dev(filter, feOffset);
    			append_dev(filter, feGaussianBlur);
    			append_dev(filter, feColorMatrix1);
    			append_dev(filter, feBlend0);
    			append_dev(filter, feBlend1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CloudIllustration", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CloudIllustration> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CloudIllustration extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CloudIllustration",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Sections/About/Skill.svelte generated by Svelte v3.31.0 */

    const file$8 = "src/Sections/About/Skill.svelte";

    function create_fragment$9(ctx) {
    	let div2;
    	let div0;
    	let switch_instance;
    	let t0;
    	let span0;
    	let t1;
    	let t2;
    	let div1;
    	let span1;
    	let t3;
    	let current;
    	var switch_value = /*svg*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t0 = space();
    			span0 = element("span");
    			t1 = text(/*header*/ ctx[1]);
    			t2 = space();
    			div1 = element("div");
    			span1 = element("span");
    			t3 = text(/*text*/ ctx[2]);
    			attr_dev(div0, "class", "illustrationContainer svelte-zhndlw");
    			add_location(div0, file$8, 35, 2, 622);
    			attr_dev(span0, "class", "header svelte-zhndlw");
    			add_location(span0, file$8, 38, 2, 704);
    			add_location(span1, file$8, 40, 4, 767);
    			attr_dev(div1, "class", "skill svelte-zhndlw");
    			add_location(div1, file$8, 39, 2, 743);
    			attr_dev(div2, "class", "skillContainer svelte-zhndlw");
    			add_location(div2, file$8, 34, 0, 591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			if (switch_instance) {
    				mount_component(switch_instance, div0, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, span0);
    			append_dev(span0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, span1);
    			append_dev(span1, t3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*svg*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div0, null);
    				} else {
    					switch_instance = null;
    				}
    			}

    			if (!current || dirty & /*header*/ 2) set_data_dev(t1, /*header*/ ctx[1]);
    			if (!current || dirty & /*text*/ 4) set_data_dev(t3, /*text*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Skill", slots, []);
    	let { svg } = $$props;
    	let { header } = $$props;
    	let { text } = $$props;
    	const writable_props = ["svg", "header", "text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Skill> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("svg" in $$props) $$invalidate(0, svg = $$props.svg);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ svg, header, text });

    	$$self.$inject_state = $$props => {
    		if ("svg" in $$props) $$invalidate(0, svg = $$props.svg);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [svg, header, text];
    }

    class Skill extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { svg: 0, header: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Skill",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*svg*/ ctx[0] === undefined && !("svg" in props)) {
    			console.warn("<Skill> was created without expected prop 'svg'");
    		}

    		if (/*header*/ ctx[1] === undefined && !("header" in props)) {
    			console.warn("<Skill> was created without expected prop 'header'");
    		}

    		if (/*text*/ ctx[2] === undefined && !("text" in props)) {
    			console.warn("<Skill> was created without expected prop 'text'");
    		}
    	}

    	get svg() {
    		throw new Error("<Skill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<Skill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header() {
    		throw new Error("<Skill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Skill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Skill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Skill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Sections/About/About.svelte generated by Svelte v3.31.0 */
    const file$9 = "src/Sections/About/About.svelte";

    function create_fragment$a(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t2;
    	let h20;
    	let t4;
    	let h21;
    	let t6;
    	let div2;
    	let skill0;
    	let t7;
    	let skill1;
    	let t8;
    	let skill2;
    	let current;

    	skill0 = new Skill({
    			props: {
    				svg: FrontendIllustration,
    				header: "Frontend",
    				text: `Building fast and responsive UIs is important.
      This is why I use modern web technologies (HTML5, CSS3, React &
        Svelte to name a few) to build my sites.`
    			},
    			$$inline: true
    		});

    	skill1 = new Skill({
    			props: {
    				svg: BackendIllustration,
    				header: "Backend",
    				text: `Secure and reliable backends are a necessity for providing 
      a great user experience. I love building modern APIs using REST or GraphQL. 
      My languages of choice for that are Go or TypeScript.`
    			},
    			$$inline: true
    		});

    	skill2 = new Skill({
    			props: {
    				svg: CloudIllustration,
    				header: "Cloud",
    				text: `Applications should be built with the underlying infrastructure in mind. 
      I have multiple years of experience running my applications as CloudServices.
      For that I have used Azure, Firebase and AWS.`
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Hi, I'm Nathan.";
    			t2 = space();
    			h20 = element("h2");
    			h20.textContent = "A full stack web devloper based in Karslruhe, Germany.";
    			t4 = space();
    			h21 = element("h2");
    			h21.textContent = "I like to create beautiful applications.";
    			t6 = space();
    			div2 = element("div");
    			create_component(skill0.$$.fragment);
    			t7 = space();
    			create_component(skill1.$$.fragment);
    			t8 = space();
    			create_component(skill2.$$.fragment);
    			attr_dev(img, "class", "profilePicture svelte-1o7tkal");
    			if (img.src !== (img_src_value = "./profile_picture.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Profile");
    			add_location(img, file$9, 63, 6, 1249);
    			attr_dev(div0, "class", "imageContainer svelte-1o7tkal");
    			add_location(div0, file$9, 62, 4, 1214);
    			attr_dev(h1, "class", "svelte-1o7tkal");
    			add_location(h1, file$9, 66, 4, 1338);
    			attr_dev(h20, "class", "svelte-1o7tkal");
    			add_location(h20, file$9, 67, 4, 1367);
    			attr_dev(h21, "class", "svelte-1o7tkal");
    			add_location(h21, file$9, 68, 4, 1435);
    			attr_dev(div1, "class", "description svelte-1o7tkal");
    			add_location(div1, file$9, 61, 2, 1184);
    			attr_dev(div2, "class", "skills svelte-1o7tkal");
    			add_location(div2, file$9, 70, 2, 1496);
    			attr_dev(div3, "class", "pageContainer svelte-1o7tkal");
    			add_location(div3, file$9, 60, 0, 1154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h1);
    			append_dev(div1, t2);
    			append_dev(div1, h20);
    			append_dev(div1, t4);
    			append_dev(div1, h21);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			mount_component(skill0, div2, null);
    			append_dev(div2, t7);
    			mount_component(skill1, div2, null);
    			append_dev(div2, t8);
    			mount_component(skill2, div2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(skill0.$$.fragment, local);
    			transition_in(skill1.$$.fragment, local);
    			transition_in(skill2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(skill0.$$.fragment, local);
    			transition_out(skill1.$$.fragment, local);
    			transition_out(skill2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(skill0);
    			destroy_component(skill1);
    			destroy_component(skill2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		FrontendIllustration,
    		BackendIllustration,
    		CloudIllustration,
    		Skill
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/Sections/Projects.svelte generated by Svelte v3.31.0 */

    const file$a = "src/Sections/Projects.svelte";

    function create_fragment$b(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Projects";
    			add_location(div, file$a, 5, 2, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/Sections/Contact/Form.svelte generated by Svelte v3.31.0 */

    const file$b = "src/Sections/Contact/Form.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let form;
    	let input0;
    	let t0;
    	let p;
    	let label;
    	let t1;
    	let input1;
    	let t2;
    	let input2;
    	let t3;
    	let input3;
    	let t4;
    	let textarea;
    	let t5;
    	let button;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			form = element("form");
    			input0 = element("input");
    			t0 = space();
    			p = element("p");
    			label = element("label");
    			t1 = text("Don’t fill this out if you're human:\n          ");
    			input1 = element("input");
    			t2 = space();
    			input2 = element("input");
    			t3 = space();
    			input3 = element("input");
    			t4 = space();
    			textarea = element("textarea");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Send";
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "form-name");
    			input0.value = "contact";
    			attr_dev(input0, "class", "svelte-sipkhq");
    			add_location(input0, file$b, 59, 6, 1164);
    			attr_dev(input1, "name", "bot-field");
    			attr_dev(input1, "class", "svelte-sipkhq");
    			add_location(input1, file$b, 62, 10, 1315);
    			add_location(label, file$b, 61, 8, 1261);
    			set_style(p, "display", "none");
    			add_location(p, file$b, 60, 6, 1227);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "name", "Name");
    			attr_dev(input2, "placeholder", "Name");
    			attr_dev(input2, "class", "svelte-sipkhq");
    			add_location(input2, file$b, 64, 6, 1366);
    			attr_dev(input3, "type", "email");
    			attr_dev(input3, "name", "Email");
    			attr_dev(input3, "placeholder", "Email");
    			attr_dev(input3, "class", "svelte-sipkhq");
    			add_location(input3, file$b, 65, 6, 1425);
    			attr_dev(textarea, "name", "Message");
    			attr_dev(textarea, "placeholder", "Message");
    			attr_dev(textarea, "rows", "10");
    			attr_dev(textarea, "class", "svelte-sipkhq");
    			add_location(textarea, file$b, 66, 6, 1487);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-sipkhq");
    			add_location(button, file$b, 67, 6, 1553);
    			attr_dev(form, "name", "contact");
    			attr_dev(form, "method", "POST");
    			attr_dev(form, "class", "svelte-sipkhq");
    			add_location(form, file$b, 58, 4, 1122);
    			attr_dev(div0, "class", "formCard svelte-sipkhq");
    			add_location(div0, file$b, 57, 2, 1095);
    			attr_dev(div1, "class", "formContainer svelte-sipkhq");
    			add_location(div1, file$b, 56, 0, 1065);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, form);
    			append_dev(form, input0);
    			append_dev(form, t0);
    			append_dev(form, p);
    			append_dev(p, label);
    			append_dev(label, t1);
    			append_dev(label, input1);
    			append_dev(form, t2);
    			append_dev(form, input2);
    			append_dev(form, t3);
    			append_dev(form, input3);
    			append_dev(form, t4);
    			append_dev(form, textarea);
    			append_dev(form, t5);
    			append_dev(form, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Form", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Form> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/IllustrationComponents/ContactIllustration.svelte generated by Svelte v3.31.0 */
    const file$c = "src/IllustrationComponents/ContactIllustration.svelte";

    function create_fragment$d(ctx) {
    	let div1;
    	let div0;
    	let svg;
    	let g8;
    	let g4;
    	let g2;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let a0;
    	let g1;
    	let path5;
    	let g0;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path18_fill_value;
    	let path19;
    	let path20;
    	let path20_fill_value;
    	let path21;
    	let g3;
    	let path22;
    	let path23;
    	let path24;
    	let path25;
    	let path26;
    	let g6;
    	let path27;
    	let path28;
    	let path29;
    	let path30;
    	let path31;
    	let a1;
    	let g5;
    	let rect0;
    	let path32;
    	let a2;
    	let g7;
    	let rect1;
    	let path33;
    	let div0_resize_listener;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			g8 = svg_element("g");
    			g4 = svg_element("g");
    			g2 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			a0 = svg_element("a");
    			g1 = svg_element("g");
    			path5 = svg_element("path");
    			g0 = svg_element("g");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			g3 = svg_element("g");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			path24 = svg_element("path");
    			path25 = svg_element("path");
    			path26 = svg_element("path");
    			g6 = svg_element("g");
    			path27 = svg_element("path");
    			path28 = svg_element("path");
    			path29 = svg_element("path");
    			path30 = svg_element("path");
    			path31 = svg_element("path");
    			a1 = svg_element("a");
    			g5 = svg_element("g");
    			rect0 = svg_element("rect");
    			path32 = svg_element("path");
    			a2 = svg_element("a");
    			g7 = svg_element("g");
    			rect1 = svg_element("rect");
    			path33 = svg_element("path");
    			attr_dev(path0, "id", "Path 561");
    			attr_dev(path0, "d", "M500.209 22.7307L353.798 120.481C353.24 120.854 352.848 121.437 352.707 122.101C352.566 122.766 352.688 123.458 353.046 124.025L416.834 224.952C417.193 225.519 417.758 225.915 418.406 226.053C419.054 226.191 419.731 226.06 420.289 225.688L566.701 127.937C567.005 127.734 567.263 127.467 567.457 127.153C567.652 126.839 567.777 126.486 567.826 126.119C567.831 126.089 567.834 126.059 567.835 126.03C567.861 125.789 567.852 125.545 567.808 125.308C567.751 124.98 567.631 124.667 567.454 124.389L503.668 23.4642C503.308 22.8968 502.742 22.5007 502.094 22.3632C501.445 22.2256 500.767 22.3578 500.209 22.7307ZM566.854 124.793C567.043 125.091 567.141 125.441 567.136 125.798C567.13 126.113 567.047 126.422 566.895 126.698C566.753 126.952 566.554 127.167 566.315 127.327L419.903 225.077C419.505 225.342 419.021 225.436 418.558 225.338C418.095 225.239 417.691 224.956 417.434 224.551L353.647 123.624C353.391 123.219 353.304 122.724 353.405 122.25C353.505 121.775 353.785 121.359 354.184 121.092L500.595 23.3417C500.994 23.0754 501.478 22.9811 501.942 23.0793C502.405 23.1776 502.81 23.4604 503.067 23.8657L566.854 124.793Z");
    			attr_dev(path0, "fill", "#3F3D56");
    			add_location(path0, file$c, 45, 12, 955);
    			attr_dev(path1, "id", "Rectangle 99");
    			attr_dev(path1, "d", "M507 30.1447L357.451 129.783L357.837 130.392L507.386 30.7532L507 30.1447Z");
    			attr_dev(path1, "fill", "#3F3D56");
    			add_location(path1, file$c, 49, 12, 2167);
    			attr_dev(path2, "id", "Ellipse 88");
    			attr_dev(path2, "d", "M361.169 124.211C362.166 123.545 362.454 122.183 361.813 121.169C361.172 120.154 359.844 119.871 358.847 120.537C357.85 121.203 357.561 122.565 358.202 123.58C358.843 124.594 360.171 124.877 361.169 124.211Z");
    			attr_dev(path2, "fill", "#3F3D56");
    			add_location(path2, file$c, 53, 12, 2341);
    			attr_dev(path3, "id", "Ellipse 89");
    			attr_dev(path3, "d", "M366.338 120.767C367.335 120.101 367.624 118.739 366.983 117.724C366.342 116.71 365.014 116.427 364.017 117.093C363.019 117.759 362.731 119.121 363.372 120.135C364.013 121.15 365.341 121.433 366.338 120.767Z");
    			attr_dev(path3, "fill", "#3F3D56");
    			add_location(path3, file$c, 57, 12, 2647);
    			attr_dev(path4, "id", "Ellipse 90");
    			attr_dev(path4, "d", "M371.508 117.323C372.505 116.657 372.794 115.295 372.153 114.28C371.512 113.266 370.183 112.983 369.186 113.649C368.189 114.315 367.9 115.677 368.542 116.691C369.183 117.706 370.511 117.988 371.508 117.323Z");
    			attr_dev(path4, "fill", "#3F3D56");
    			add_location(path4, file$c, 61, 12, 2953);
    			attr_dev(path5, "id", "Vector");
    			attr_dev(path5, "d", "M509.056 126.125C508.608 127.921 507.442 129.639 505.716 130.783L446.472 170.062C444.745 171.206 442.711 171.611 440.884 171.323L438.123 166.6L445.623 136.967L450.241 134.239L451.037 131.046L468.641 119.374L471.299 120.278L476.816 116.62L504.763 120.918L509.056 126.125Z");
    			attr_dev(path5, "fill", "#A6C9FF");
    			add_location(path5, file$c, 67, 16, 3347);
    			attr_dev(path6, "id", "Vector_2");
    			attr_dev(path6, "d", "M509.057 126.125C508.609 127.921 507.443 129.638 505.716 130.783L476.094 150.422L459.545 125.405L468.642 119.374L471.3 120.278L476.817 116.62L504.764 120.918L509.057 126.125Z");
    			attr_dev(path6, "fill", "#7FB0F9");
    			add_location(path6, file$c, 72, 18, 3761);
    			attr_dev(path7, "id", "Vector_3");
    			attr_dev(path7, "d", "M447.143 130.138L416.882 125.475L412.483 128.392C412.033 130.199 412.282 132.116 413.338 133.713L436.324 168.459C437.38 170.056 439.046 171.034 440.884 171.324L450.241 134.239L447.143 130.138Z");
    			attr_dev(path7, "fill", "#98C1FF");
    			add_location(path7, file$c, 76, 18, 4056);
    			attr_dev(g0, "id", "Group");
    			add_location(g0, file$c, 71, 16, 3728);
    			attr_dev(path8, "id", "Vector_4");
    			attr_dev(path8, "d", "M480.657 83.1927L476.192 86.153L468.853 115.137L471.299 120.278L509.058 126.125C509.508 124.318 509.259 122.4 508.202 120.804L485.217 86.0575C484.161 84.4609 482.495 83.4828 480.657 83.1927Z");
    			attr_dev(path8, "fill", "#579AFF");
    			add_location(path8, file$c, 81, 16, 4388);
    			attr_dev(path9, "id", "Vector_5");
    			attr_dev(path9, "d", "M480.657 83.1939L469.492 127.53C468.846 130.124 467.209 132.32 465.061 133.744C462.913 135.168 460.254 135.82 457.616 135.404L412.484 128.392C412.932 126.595 414.098 124.878 415.825 123.733L475.068 84.455C476.795 83.3103 478.83 82.9054 480.657 83.1939Z");
    			attr_dev(path9, "fill", "#3284FF");
    			add_location(path9, file$c, 85, 16, 4691);
    			attr_dev(path10, "id", "Vector_6");
    			attr_dev(path10, "d", "M469.493 127.529C468.846 130.124 467.209 132.32 465.061 133.744L445.447 104.094L475.069 84.455C476.795 83.3102 478.83 82.9053 480.657 83.1938L469.493 127.529Z");
    			attr_dev(path10, "fill", "#1E77FD");
    			add_location(path10, file$c, 89, 16, 5056);
    			attr_dev(g1, "id", "mail");
    			add_location(g1, file$c, 66, 14, 3317);
    			attr_dev(a0, "href", "mailto:nathan.herrmann@hotmail.de");
    			add_location(a0, file$c, 65, 12, 3258);
    			attr_dev(g2, "id", "MailWindow");
    			add_location(g2, file$c, 44, 10, 923);
    			attr_dev(path11, "id", "Path 552");
    			attr_dev(path11, "d", "M229.521 120.961C229.947 121.16 230.357 121.395 230.746 121.662L269.683 104.618L271.072 94.0979L286.63 94L285.71 118.129L234.319 132.07C234.211 132.436 234.081 132.795 233.93 133.145C233.187 134.772 231.992 136.136 230.496 137.068C228.999 138 227.267 138.458 225.517 138.383C223.768 138.309 222.079 137.706 220.662 136.65C219.246 135.595 218.165 134.133 217.555 132.45C216.946 130.766 216.835 128.935 217.237 127.187C217.639 125.439 218.535 123.852 219.814 122.625C221.092 121.398 222.696 120.585 224.423 120.29C226.15 119.994 227.924 120.229 229.521 120.964V120.961Z");
    			attr_dev(path11, "fill", "#CAA0A6");
    			add_location(path11, file$c, 96, 10, 5372);
    			attr_dev(path12, "id", "Path 553");
    			attr_dev(path12, "d", "M286.918 342.546H276.275L271.212 300.443H286.919L286.918 342.546Z");
    			attr_dev(path12, "fill", "#CAA0A6");
    			add_location(path12, file$c, 100, 10, 6028);
    			attr_dev(path13, "id", "Path 554");
    			attr_dev(path13, "d", "M268.673 339.427H289.198V352.678H255.749C255.749 349.162 257.111 345.791 259.534 343.305C261.958 340.82 265.245 339.423 268.673 339.423V339.427Z");
    			attr_dev(path13, "fill", "#2F2E41");
    			add_location(path13, file$c, 104, 10, 6182);
    			attr_dev(path14, "id", "Path 555");
    			attr_dev(path14, "d", "M328.309 339.462L317.718 340.531L308.654 299.14L324.286 297.56L328.309 339.462Z");
    			attr_dev(path14, "fill", "#CAA0A6");
    			add_location(path14, file$c, 108, 10, 6415);
    			attr_dev(path15, "id", "Path 556");
    			attr_dev(path15, "d", "M309.851 338.198L330.278 336.134L331.544 349.325L298.257 352.688C297.921 349.189 298.954 345.697 301.129 342.98C303.303 340.262 306.441 338.542 309.852 338.198L309.851 338.198Z");
    			attr_dev(path15, "fill", "#2F2E41");
    			add_location(path15, file$c, 112, 10, 6583);
    			attr_dev(path16, "id", "Ellipse 84");
    			attr_dev(path16, "d", "M289.88 52.3914C301.656 52.3914 311.202 42.6007 311.202 30.5233C311.202 18.4459 301.656 8.65525 289.88 8.65525C278.105 8.65525 268.559 18.4459 268.559 30.5233C268.559 42.6007 278.105 52.3914 289.88 52.3914Z");
    			attr_dev(path16, "fill", "#CAA0A6");
    			add_location(path16, file$c, 116, 10, 6848);
    			attr_dev(path17, "id", "Path 557");
    			attr_dev(path17, "d", "M273.896 334.032C272.981 334.034 272.095 333.705 271.394 333.102C270.692 332.499 270.221 331.662 270.063 330.738C264.559 299.38 246.548 196.826 246.118 193.985C246.108 193.919 246.103 193.853 246.104 193.787V186.141C246.103 185.862 246.188 185.591 246.346 185.364L248.724 181.947C248.838 181.783 248.986 181.647 249.158 181.551C249.33 181.454 249.522 181.4 249.718 181.391C263.279 180.739 307.693 178.827 309.839 181.577C311.994 184.337 311.232 192.713 311.055 194.362L311.063 194.534L331.017 325.417C331.173 326.461 330.922 327.526 330.319 328.381C329.715 329.237 328.807 329.814 327.792 329.989L315.329 332.094C314.401 332.247 313.45 332.053 312.65 331.548C311.849 331.043 311.252 330.259 310.967 329.341C307.112 316.708 294.187 274.211 289.708 257.767C289.679 257.664 289.615 257.575 289.527 257.516C289.439 257.457 289.333 257.433 289.229 257.448C289.125 257.463 289.03 257.517 288.962 257.598C288.893 257.679 288.856 257.784 288.856 257.891C289.08 273.567 289.621 313.559 289.811 327.372L289.831 328.86C289.839 329.867 289.479 330.841 288.821 331.589C288.163 332.336 287.256 332.804 286.278 332.898L274.261 334.015C274.139 334.027 274.021 334.032 273.896 334.032Z");
    			attr_dev(path17, "fill", "#2F2E41");
    			add_location(path17, file$c, 120, 10, 7145);
    			attr_dev(path18, "id", "Tshirt");
    			attr_dev(path18, "d", "M276.348 60.9905C272.628 63.2591 270.401 67.4278 269.123 71.6748C266.758 79.5287 265.334 87.6489 264.883 95.856L263.533 120.43L246.817 185.577C261.305 198.15 269.661 195.292 289.164 185.008C308.667 174.725 310.895 188.437 310.895 188.437L314.794 133.005L320.366 72.4325C319.115 70.8878 317.699 69.4919 316.145 68.2709C310.995 64.1629 305.004 61.3073 298.621 59.9192C292.239 58.5311 285.633 58.6469 279.301 60.2577L276.348 60.9905Z");
    			attr_dev(path18, "fill", path18_fill_value = /*colors*/ ctx[2].light);
    			add_location(path18, file$c, 124, 10, 8402);
    			attr_dev(path19, "id", "Path 558");
    			attr_dev(path19, "d", "M270.919 137.068C271.369 137.24 271.804 137.449 272.222 137.691L310.72 117.925L311.359 107.218L327.24 106.095L328.091 130.502L276.642 147.953C276.222 149.803 275.263 151.477 273.893 152.754C272.523 154.03 270.806 154.849 268.971 155.1C267.136 155.352 265.27 155.024 263.621 154.161C261.972 153.298 260.619 151.941 259.74 150.269C258.862 148.598 258.501 146.692 258.704 144.805C258.908 142.918 259.667 141.139 260.881 139.705C262.094 138.271 263.705 137.251 265.498 136.779C267.291 136.306 269.182 136.406 270.918 137.063L270.919 137.068Z");
    			attr_dev(path19, "fill", "#CAA0A6");
    			add_location(path19, file$c, 128, 10, 8924);
    			attr_dev(path20, "id", "Sleeve");
    			attr_dev(path20, "d", "M320.088 72.7049C329.56 76.1337 331.229 113.282 331.229 113.282C320.085 106.996 306.713 117.282 306.713 117.282C306.713 117.282 303.927 107.567 300.584 94.995C299.575 91.4587 299.454 87.7179 300.233 84.1209C301.013 80.5238 302.666 77.1875 305.041 74.4224C305.041 74.4224 310.615 69.2744 320.088 72.7049Z");
    			attr_dev(path20, "fill", path20_fill_value = /*colors*/ ctx[2].light);
    			add_location(path20, file$c, 132, 10, 9550);
    			attr_dev(path21, "id", "Path 102");
    			attr_dev(path21, "d", "M308.998 36.3071C306.342 34.1275 302.717 38.0878 302.717 38.0878L300.592 18.4723C300.592 18.4723 287.31 20.1044 278.808 17.9274C270.306 15.7505 268.978 25.8294 268.978 25.8294C268.54 21.7582 268.451 17.6554 268.713 13.5683C269.244 8.66417 276.151 3.75919 288.371 0.489799C300.591 -2.77959 306.967 11.3887 306.967 11.3887C315.469 15.747 311.654 38.4867 308.998 36.3071Z");
    			attr_dev(path21, "fill", "#E6C412");
    			add_location(path21, file$c, 136, 10, 9945);
    			attr_dev(path22, "id", "Path 561_2");
    			attr_dev(path22, "d", "M564.959 226.973H391.003C390.34 226.974 389.705 227.244 389.236 227.725C388.767 228.205 388.504 228.857 388.503 229.537V350.436C388.504 351.115 388.767 351.767 389.236 352.248C389.705 352.728 390.34 352.999 391.003 352.999H564.959C565.32 352.999 565.677 352.919 566.005 352.763C566.334 352.608 566.625 352.382 566.859 352.1C566.879 352.078 566.898 352.054 566.914 352.029C567.064 351.841 567.184 351.631 567.273 351.406C567.398 351.098 567.463 350.767 567.462 350.433V229.537C567.461 228.856 567.197 228.204 566.728 227.724C566.258 227.243 565.622 226.973 564.959 226.973ZM566.747 350.436C566.748 350.793 566.645 351.143 566.452 351.441C566.281 351.703 566.048 351.917 565.776 352.064C565.523 352.198 565.243 352.268 564.959 352.267H391.003C390.529 352.267 390.075 352.074 389.741 351.73C389.406 351.387 389.217 350.921 389.217 350.436V229.537C389.217 229.051 389.406 228.586 389.741 228.242C390.075 227.899 390.529 227.706 391.003 227.705H564.959C565.433 227.705 565.887 227.898 566.223 228.242C566.558 228.585 566.747 229.051 566.747 229.537V350.436Z");
    			attr_dev(path22, "fill", "#3F3D56");
    			add_location(path22, file$c, 141, 12, 10438);
    			attr_dev(path23, "id", "Rectangle 99_2");
    			attr_dev(path23, "d", "M567.101 237.246H388.859V237.979H567.101V237.246Z");
    			attr_dev(path23, "fill", "#3F3D56");
    			add_location(path23, file$c, 145, 12, 11589);
    			attr_dev(path24, "id", "Ellipse 88_2");
    			attr_dev(path24, "d", "M394.932 234.667C396.116 234.667 397.075 233.683 397.075 232.469C397.075 231.255 396.116 230.27 394.932 230.27C393.748 230.27 392.788 231.255 392.788 232.469C392.788 233.683 393.748 234.667 394.932 234.667Z");
    			attr_dev(path24, "fill", "#3F3D56");
    			add_location(path24, file$c, 149, 12, 11741);
    			attr_dev(path25, "id", "Ellipse 89_2");
    			attr_dev(path25, "d", "M401.094 234.667C402.277 234.667 403.237 233.683 403.237 232.469C403.237 231.255 402.277 230.27 401.094 230.27C399.91 230.27 398.95 231.255 398.95 232.469C398.95 233.683 399.91 234.667 401.094 234.667Z");
    			attr_dev(path25, "fill", "#3F3D56");
    			add_location(path25, file$c, 153, 12, 12048);
    			attr_dev(path26, "id", "Ellipse 90_2");
    			attr_dev(path26, "d", "M407.255 234.667C408.439 234.667 409.399 233.683 409.399 232.469C409.399 231.255 408.439 230.27 407.255 230.27C406.072 230.27 405.112 231.255 405.112 232.469C405.112 233.683 406.072 234.667 407.255 234.667Z");
    			attr_dev(path26, "fill", "#3F3D56");
    			add_location(path26, file$c, 157, 12, 12350);
    			attr_dev(g3, "id", "linkedinWindow");
    			add_location(g3, file$c, 140, 10, 10402);
    			attr_dev(g4, "id", "Group 22");
    			add_location(g4, file$c, 43, 8, 895);
    			attr_dev(path27, "id", "Path 561_3");
    			attr_dev(path27, "d", "M212.163 105.885H3.45846C2.66343 105.886 1.90117 106.21 1.339 106.786C0.776836 107.363 0.460712 108.145 0.460022 108.96V254.009C0.460712 254.825 0.776836 255.606 1.339 256.183C1.90117 256.76 2.66343 257.084 3.45846 257.085H212.163C212.597 257.085 213.025 256.988 213.419 256.802C213.812 256.615 214.162 256.344 214.443 256.005C214.467 255.979 214.488 255.951 214.508 255.921C214.689 255.697 214.835 255.446 214.942 255.177C215.093 254.807 215.17 254.41 215.169 254.009V108.96C215.168 108.556 215.09 108.156 214.939 107.782C214.788 107.409 214.566 107.07 214.287 106.784C214.008 106.498 213.677 106.272 213.312 106.118C212.948 105.963 212.558 105.884 212.163 105.885ZM214.309 254.009C214.31 254.438 214.186 254.858 213.955 255.216C213.749 255.53 213.47 255.788 213.143 255.964C212.84 256.124 212.504 256.207 212.163 256.207H3.45846C2.89067 256.206 2.34636 255.974 1.94487 255.563C1.54339 255.151 1.31753 254.592 1.31684 254.01V108.96C1.31753 108.378 1.54339 107.82 1.94487 107.408C2.34636 106.996 2.89067 106.764 3.45846 106.764H212.163C212.732 106.764 213.277 106.995 213.68 107.407C214.082 107.819 214.309 108.378 214.309 108.961V254.009Z");
    			attr_dev(path27, "fill", "#3F3D56");
    			add_location(path27, file$c, 164, 10, 12713);
    			attr_dev(path28, "id", "Rectangle 99_3");
    			attr_dev(path28, "d", "M214.735 118.209H0.887131V119.088H214.735V118.209Z");
    			attr_dev(path28, "fill", "#3F3D56");
    			add_location(path28, file$c, 168, 10, 13943);
    			attr_dev(path29, "id", "Ellipse 88_3");
    			attr_dev(path29, "d", "M8.17227 115.115C9.59238 115.115 10.7436 113.935 10.7436 112.478C10.7436 111.022 9.59238 109.841 8.17227 109.841C6.75217 109.841 5.60094 111.022 5.60094 112.478C5.60094 113.935 6.75217 115.115 8.17227 115.115Z");
    			attr_dev(path29, "fill", "#3F3D56");
    			add_location(path29, file$c, 172, 10, 14088);
    			attr_dev(path30, "id", "Ellipse 89_3");
    			attr_dev(path30, "d", "M15.5651 115.115C16.9852 115.115 18.1364 113.935 18.1364 112.478C18.1364 111.022 16.9852 109.841 15.5651 109.841C14.145 109.841 12.9937 111.022 12.9937 112.478C12.9937 113.935 14.145 115.115 15.5651 115.115Z");
    			attr_dev(path30, "fill", "#3F3D56");
    			add_location(path30, file$c, 176, 10, 14390);
    			attr_dev(path31, "id", "Ellipse 90_3");
    			attr_dev(path31, "d", "M22.9579 115.115C24.378 115.115 25.5292 113.935 25.5292 112.478C25.5292 111.022 24.378 109.841 22.9579 109.841C21.5378 109.841 20.3865 111.022 20.3865 112.478C20.3865 113.935 21.5378 115.115 22.9579 115.115Z");
    			attr_dev(path31, "fill", "#3F3D56");
    			add_location(path31, file$c, 180, 10, 14690);
    			attr_dev(rect0, "width", "75");
    			attr_dev(rect0, "height", "75");
    			attr_dev(rect0, "transform", "translate(70 148)");
    			attr_dev(rect0, "fill", "transparent");
    			add_location(rect0, file$c, 186, 14, 15084);
    			attr_dev(path32, "id", "Vector");
    			attr_dev(path32, "fill-rule", "evenodd");
    			attr_dev(path32, "clip-rule", "evenodd");
    			attr_dev(path32, "d", "M107.5 148C86.7812 148 70 164.781 70 185.5C70 202.094 80.7344 216.109 95.6406 221.078C97.5156 221.406 98.2188 220.281 98.2188 219.297C98.2188 218.406 98.1719 215.453 98.1719 212.312C88.75 214.047 86.3125 210.016 85.5625 207.906C85.1406 206.828 83.3125 203.5 81.7188 202.609C80.4062 201.906 78.5312 200.172 81.6719 200.125C84.625 200.078 86.7344 202.844 87.4375 203.969C90.8125 209.641 96.2031 208.047 98.3594 207.062C98.6875 204.625 99.6719 202.984 100.75 202.047C92.4062 201.109 83.6875 197.875 83.6875 183.531C83.6875 179.453 85.1406 176.078 87.5312 173.453C87.1562 172.516 85.8438 168.672 87.9062 163.516C87.9062 163.516 91.0469 162.531 98.2188 167.359C101.219 166.516 104.406 166.094 107.594 166.094C110.781 166.094 113.969 166.516 116.969 167.359C124.141 162.484 127.281 163.516 127.281 163.516C129.344 168.672 128.031 172.516 127.656 173.453C130.047 176.078 131.5 179.406 131.5 183.531C131.5 197.922 122.734 201.109 114.391 202.047C115.75 203.219 116.922 205.469 116.922 208.984C116.922 214 116.875 218.031 116.875 219.297C116.875 220.281 117.578 221.453 119.453 221.078C126.898 218.565 133.366 213.781 137.949 207.398C142.532 201.016 144.998 193.357 145 185.5C145 164.781 128.219 148 107.5 148Z");
    			attr_dev(path32, "fill", "#7FB0F9");
    			add_location(path32, file$c, 191, 14, 15243);
    			attr_dev(g5, "id", "github");
    			attr_dev(g5, "class", "svelte-1uab03m");
    			add_location(g5, file$c, 185, 12, 15054);
    			attr_dev(a1, "href", "https://github.com/nhe23");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$c, 184, 10, 14990);
    			attr_dev(g6, "id", "githubWindow");
    			add_location(g6, file$c, 163, 8, 12681);
    			attr_dev(rect1, "width", "50");
    			attr_dev(rect1, "height", "50");
    			attr_dev(rect1, "transform", "translate(453 271)");
    			attr_dev(rect1, "fill", "transparent");
    			add_location(rect1, file$c, 204, 12, 16799);
    			attr_dev(path33, "id", "Vector_2");
    			attr_dev(path33, "d", "M492.583 271H463.417C457.665 271 453 275.665 453 281.417V310.583C453 316.335 457.665 321 463.417 321H492.583C498.337 321 503 316.335 503 310.583V281.417C503 275.665 498.337 271 492.583 271ZM469.667 310.583H463.417V287.667H469.667V310.583ZM466.542 285.025C464.529 285.025 462.896 283.379 462.896 281.35C462.896 279.321 464.529 277.675 466.542 277.675C468.554 277.675 470.187 279.321 470.187 281.35C470.187 283.379 468.556 285.025 466.542 285.025ZM494.667 310.583H488.417V298.908C488.417 291.892 480.083 292.423 480.083 298.908V310.583H473.833V287.667H480.083V291.344C482.992 285.956 494.667 285.558 494.667 296.502V310.583Z");
    			attr_dev(path33, "fill", "#7FB0F9");
    			add_location(path33, file$c, 209, 12, 16949);
    			attr_dev(g7, "id", "linkedin");
    			attr_dev(g7, "class", "svelte-1uab03m");
    			add_location(g7, file$c, 203, 10, 16769);
    			attr_dev(a2, "href", "https://de.linkedin.com/in/nathan-herrmann-56802b1a1");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$c, 200, 8, 16659);
    			attr_dev(g8, "id", "illustration");
    			add_location(g8, file$c, 42, 6, 865);
    			attr_dev(svg, "width", /*svgWidth*/ ctx[1]);
    			attr_dev(svg, "height", /*svgHeight*/ ctx[3]);
    			attr_dev(svg, "viewBox", "0 0 569 353");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$c, 36, 4, 718);
    			attr_dev(div0, "class", "illustration svelte-1uab03m");
    			add_render_callback(() => /*div0_elementresize_handler*/ ctx[6].call(div0));
    			add_location(div0, file$c, 35, 2, 666);
    			attr_dev(div1, "class", "illustrationContainer svelte-1uab03m");
    			add_location(div1, file$c, 34, 0, 628);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, g8);
    			append_dev(g8, g4);
    			append_dev(g4, g2);
    			append_dev(g2, path0);
    			append_dev(g2, path1);
    			append_dev(g2, path2);
    			append_dev(g2, path3);
    			append_dev(g2, path4);
    			append_dev(g2, a0);
    			append_dev(a0, g1);
    			append_dev(g1, path5);
    			append_dev(g1, g0);
    			append_dev(g0, path6);
    			append_dev(g0, path7);
    			append_dev(g1, path8);
    			append_dev(g1, path9);
    			append_dev(g1, path10);
    			append_dev(g4, path11);
    			append_dev(g4, path12);
    			append_dev(g4, path13);
    			append_dev(g4, path14);
    			append_dev(g4, path15);
    			append_dev(g4, path16);
    			append_dev(g4, path17);
    			append_dev(g4, path18);
    			append_dev(g4, path19);
    			append_dev(g4, path20);
    			append_dev(g4, path21);
    			append_dev(g4, g3);
    			append_dev(g3, path22);
    			append_dev(g3, path23);
    			append_dev(g3, path24);
    			append_dev(g3, path25);
    			append_dev(g3, path26);
    			append_dev(g8, g6);
    			append_dev(g6, path27);
    			append_dev(g6, path28);
    			append_dev(g6, path29);
    			append_dev(g6, path30);
    			append_dev(g6, path31);
    			append_dev(g6, a1);
    			append_dev(a1, g5);
    			append_dev(g5, rect0);
    			append_dev(g5, path32);
    			append_dev(g8, a2);
    			append_dev(a2, g7);
    			append_dev(g7, rect1);
    			append_dev(g7, path33);
    			div0_resize_listener = add_resize_listener(div0, /*div0_elementresize_handler*/ ctx[6].bind(div0));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*colors*/ 4 && path18_fill_value !== (path18_fill_value = /*colors*/ ctx[2].light)) {
    				attr_dev(path18, "fill", path18_fill_value);
    			}

    			if (dirty & /*colors*/ 4 && path20_fill_value !== (path20_fill_value = /*colors*/ ctx[2].light)) {
    				attr_dev(path20, "fill", path20_fill_value);
    			}

    			if (dirty & /*svgWidth*/ 2) {
    				attr_dev(svg, "width", /*svgWidth*/ ctx[1]);
    			}

    			if (dirty & /*svgHeight*/ 8) {
    				attr_dev(svg, "height", /*svgHeight*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			div0_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const aspectRatio = 1.6;

    function instance$d($$self, $$props, $$invalidate) {
    	let $theme;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ContactIllustration", slots, []);
    	const { theme } = getContext("theme");
    	validate_store(theme, "theme");
    	component_subscribe($$self, theme, value => $$invalidate(5, $theme = value));
    	let h = 0;
    	let w = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ContactIllustration> was created with unknown prop '${key}'`);
    	});

    	function div0_elementresize_handler() {
    		w = this.clientWidth;
    		$$invalidate(0, w);
    	}

    	$$self.$capture_state = () => ({
    		ThemeContext,
    		getContext,
    		theme,
    		aspectRatio,
    		h,
    		w,
    		colors,
    		$theme,
    		svgWidth,
    		svgHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("h" in $$props) h = $$props.h;
    		if ("w" in $$props) $$invalidate(0, w = $$props.w);
    		if ("colors" in $$props) $$invalidate(2, colors = $$props.colors);
    		if ("svgWidth" in $$props) $$invalidate(1, svgWidth = $$props.svgWidth);
    		if ("svgHeight" in $$props) $$invalidate(3, svgHeight = $$props.svgHeight);
    	};

    	let colors;
    	let svgWidth;
    	let svgHeight;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$theme*/ 32) {
    			 $$invalidate(2, colors = $theme.colors);
    		}

    		if ($$self.$$.dirty & /*w*/ 1) {
    			 $$invalidate(1, svgWidth = w);
    		}

    		if ($$self.$$.dirty & /*svgWidth*/ 2) {
    			 $$invalidate(3, svgHeight = svgWidth / 1.6);
    		}
    	};

    	return [w, svgWidth, colors, svgHeight, theme, $theme, div0_elementresize_handler];
    }

    class ContactIllustration extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactIllustration",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/Sections/Contact/Contact.svelte generated by Svelte v3.31.0 */
    const file$d = "src/Sections/Contact/Contact.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let section;
    	let form;
    	let t2;
    	let contactillustration;
    	let current;
    	form = new Form({ $$inline: true });
    	contactillustration = new ContactIllustration({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Let's create together";
    			t1 = space();
    			section = element("section");
    			create_component(form.$$.fragment);
    			t2 = space();
    			create_component(contactillustration.$$.fragment);
    			attr_dev(h1, "class", "svelte-1tsadhg");
    			add_location(h1, file$d, 31, 2, 665);
    			attr_dev(div, "class", "header svelte-1tsadhg");
    			add_location(div, file$d, 30, 0, 642);
    			attr_dev(section, "class", "svelte-1tsadhg");
    			add_location(section, file$d, 34, 0, 704);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			mount_component(form, section, null);
    			append_dev(section, t2);
    			mount_component(contactillustration, section, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			transition_in(contactillustration.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			transition_out(contactillustration.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    			destroy_component(form);
    			destroy_component(contactillustration);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	document.querySelector("#remove-me").remove();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Form, ContactIllustration });
    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/Section.svelte generated by Svelte v3.31.0 */

    const file$e = "src/Section.svelte";

    function create_fragment$f(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "id", /*id*/ ctx[0]);
    			add_location(div0, file$e, 22, 4, 334);
    			attr_dev(div1, "class", "marker");
    			add_location(div1, file$e, 21, 2, 309);
    			attr_dev(section, "class", "svelte-5m1jmz");
    			toggle_class(section, "blue", /*isBlue*/ ctx[1]);
    			add_location(section, file$e, 20, 0, 277);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(section, t);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*id*/ 1) {
    				attr_dev(div0, "id", /*id*/ ctx[0]);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (dirty & /*isBlue*/ 2) {
    				toggle_class(section, "blue", /*isBlue*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Section", slots, ['default']);
    	let { id = "" } = $$props;
    	let { isBlue = true } = $$props;
    	const writable_props = ["id", "isBlue"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Section> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("isBlue" in $$props) $$invalidate(1, isBlue = $$props.isBlue);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ id, isBlue });

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("isBlue" in $$props) $$invalidate(1, isBlue = $$props.isBlue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, isBlue, $$scope, slots];
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { id: 0, isBlue: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get id() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isBlue() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isBlue(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/IllustrationComponents/Rocket.svelte generated by Svelte v3.31.0 */

    const file$f = "src/IllustrationComponents/Rocket.svelte";

    function create_fragment$g(ctx) {
    	let svg;
    	let g5;
    	let g0;
    	let path0;
    	let path0_fill_value;
    	let path1;
    	let path1_fill_value;
    	let path2;
    	let path2_fill_value;
    	let path3;
    	let path3_fill_value;
    	let path4;
    	let path4_fill_value;
    	let g1;
    	let path5;
    	let path5_fill_value;
    	let g2;
    	let path6;
    	let g3;
    	let path7;
    	let path8;
    	let g4;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let defs;
    	let filter0;
    	let feFlood0;
    	let feColorMatrix0;
    	let feOffset0;
    	let feGaussianBlur0;
    	let feColorMatrix1;
    	let feBlend0;
    	let feBlend1;
    	let filter1;
    	let feFlood1;
    	let feColorMatrix2;
    	let feOffset1;
    	let feGaussianBlur1;
    	let feColorMatrix3;
    	let feBlend2;
    	let feBlend3;
    	let filter2;
    	let feFlood2;
    	let feColorMatrix4;
    	let feOffset2;
    	let feGaussianBlur2;
    	let feColorMatrix5;
    	let feBlend4;
    	let feBlend5;
    	let filter3;
    	let feFlood3;
    	let feColorMatrix6;
    	let feOffset3;
    	let feGaussianBlur3;
    	let feColorMatrix7;
    	let feBlend6;
    	let feBlend7;
    	let filter4;
    	let feFlood4;
    	let feColorMatrix8;
    	let feOffset4;
    	let feGaussianBlur4;
    	let feColorMatrix9;
    	let feBlend8;
    	let feBlend9;
    	let clipPath;
    	let rect;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g5 = svg_element("g");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			g1 = svg_element("g");
    			path5 = svg_element("path");
    			g2 = svg_element("g");
    			path6 = svg_element("path");
    			g3 = svg_element("g");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			g4 = svg_element("g");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			defs = svg_element("defs");
    			filter0 = svg_element("filter");
    			feFlood0 = svg_element("feFlood");
    			feColorMatrix0 = svg_element("feColorMatrix");
    			feOffset0 = svg_element("feOffset");
    			feGaussianBlur0 = svg_element("feGaussianBlur");
    			feColorMatrix1 = svg_element("feColorMatrix");
    			feBlend0 = svg_element("feBlend");
    			feBlend1 = svg_element("feBlend");
    			filter1 = svg_element("filter");
    			feFlood1 = svg_element("feFlood");
    			feColorMatrix2 = svg_element("feColorMatrix");
    			feOffset1 = svg_element("feOffset");
    			feGaussianBlur1 = svg_element("feGaussianBlur");
    			feColorMatrix3 = svg_element("feColorMatrix");
    			feBlend2 = svg_element("feBlend");
    			feBlend3 = svg_element("feBlend");
    			filter2 = svg_element("filter");
    			feFlood2 = svg_element("feFlood");
    			feColorMatrix4 = svg_element("feColorMatrix");
    			feOffset2 = svg_element("feOffset");
    			feGaussianBlur2 = svg_element("feGaussianBlur");
    			feColorMatrix5 = svg_element("feColorMatrix");
    			feBlend4 = svg_element("feBlend");
    			feBlend5 = svg_element("feBlend");
    			filter3 = svg_element("filter");
    			feFlood3 = svg_element("feFlood");
    			feColorMatrix6 = svg_element("feColorMatrix");
    			feOffset3 = svg_element("feOffset");
    			feGaussianBlur3 = svg_element("feGaussianBlur");
    			feColorMatrix7 = svg_element("feColorMatrix");
    			feBlend6 = svg_element("feBlend");
    			feBlend7 = svg_element("feBlend");
    			filter4 = svg_element("filter");
    			feFlood4 = svg_element("feFlood");
    			feColorMatrix8 = svg_element("feColorMatrix");
    			feOffset4 = svg_element("feOffset");
    			feGaussianBlur4 = svg_element("feGaussianBlur");
    			feColorMatrix9 = svg_element("feColorMatrix");
    			feBlend8 = svg_element("feBlend");
    			feBlend9 = svg_element("feBlend");
    			clipPath = svg_element("clipPath");
    			rect = svg_element("rect");
    			attr_dev(path0, "id", "Vector_9");
    			attr_dev(path0, "d", "M252.994 535.102L253.001 495.101C253.002 489.578 257.48 485.102 263.002 485.102C268.526 485.104 273.002 489.583 273.001 495.104L272.994 535.105C272.993 540.628 268.515 545.105 262.993 545.104C257.47 545.102 252.992 540.624 252.994 535.102Z");
    			attr_dev(path0, "fill", path0_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path0, file$f, 68, 6, 1140);
    			attr_dev(path1, "id", "Vector_10");
    			attr_dev(path1, "d", "M453.006 535.105L452.999 495.104C452.998 489.581 457.474 485.103 462.997 485.102C468.519 485.1 472.996 489.577 472.998 495.1L473.005 535.101C473.007 540.624 468.53 545.102 463.007 545.103C457.487 545.104 453.007 540.63 453.006 535.105Z");
    			attr_dev(path1, "fill", path1_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path1, file$f, 72, 6, 1477);
    			attr_dev(path2, "id", "Vector_11");
    			attr_dev(path2, "d", "M312.995 555.106L313.002 650.898C313.002 656.421 308.525 660.898 303.002 660.898C297.481 660.9 293.002 656.423 293.002 650.899L292.995 555.107C292.994 549.584 297.471 545.107 302.994 545.107C308.515 545.105 312.993 549.583 312.995 555.106Z");
    			attr_dev(path2, "fill", path2_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path2, file$f, 76, 6, 1811);
    			attr_dev(path3, "id", "Vector_12");
    			attr_dev(path3, "d", "M369.563 611.674L369.57 707.466C369.571 712.989 365.094 717.467 359.571 717.467C354.05 717.468 349.57 712.991 349.57 707.468L349.563 611.676C349.563 606.153 354.04 601.675 359.563 601.675C365.084 601.675 369.562 606.153 369.563 611.674Z");
    			attr_dev(path3, "fill", path3_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path3, file$f, 80, 6, 2149);
    			attr_dev(path4, "id", "Vector_13");
    			attr_dev(path4, "d", "M412.998 650.898L413.005 555.106C413.006 549.583 417.482 545.106 423.006 545.106C428.527 545.106 433.005 549.584 433.005 555.106L432.998 650.898C432.998 656.421 428.521 660.898 422.997 660.898C417.475 660.898 412.997 656.421 412.998 650.898Z");
    			attr_dev(path4, "fill", path4_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path4, file$f, 84, 6, 2484);
    			attr_dev(g0, "id", "directionLines");
    			attr_dev(g0, "filter", "url(#filter4_d)");
    			attr_dev(g0, "class", "svelte-1j2qzve");
    			toggle_class(g0, "flyingLines", /*flying*/ ctx[0]);
    			add_location(g0, file$f, 67, 4, 1058);
    			attr_dev(path5, "d", "M393.002 455.284L333.35 455.284C327.014 465.905 323.175 479.913 323.175 495.285C323.175 528.42 363.176 575.28 363.176 575.28C363.176 575.28 403.177 528.42 403.177 495.285C403.177 479.913 399.337 465.905 393.002 455.284Z");
    			attr_dev(path5, "fill", path5_fill_value = /*flying*/ ctx[0] ? "#FFDD78" : "transparent");
    			add_location(path5, file$f, 90, 6, 2907);
    			attr_dev(g1, "id", "Flame");
    			attr_dev(g1, "filter", "url(#filter3_d)");
    			attr_dev(g1, "class", "svelte-1j2qzve");
    			toggle_class(g1, "pulsatingFlame", /*flying*/ ctx[0]);
    			add_location(g1, file$f, 89, 4, 2831);
    			attr_dev(path6, "d", "M363.176 15.28C363.176 15.28 326.477 54.7083 297.542 115.279L428.81 115.279C399.875 54.7083 363.176 15.28 363.176 15.28Z");
    			attr_dev(path6, "fill", "#ff6584");
    			add_location(path6, file$f, 95, 6, 3233);
    			attr_dev(g2, "id", "Vector");
    			add_location(g2, file$f, 94, 4, 3211);
    			attr_dev(path7, "d", "M428.81 115.279L297.542 115.279C278.705 154.679 263.17 203.038 263.17 255.279C263.17 303.42 272.859 351.646 289.778 395.279L436.574 395.279C447.894 366.083 457.037 331.993 461.025 295.04C462.418 282.107 463.182 268.827 463.182 255.279C463.182 203.038 447.647 154.679 428.81 115.279Z");
    			attr_dev(path7, "fill", "#F2F2F2");
    			add_location(path7, file$f, 100, 6, 3460);
    			attr_dev(g3, "id", "Vector_2");
    			attr_dev(g3, "filter", "url(#filter1_d)");
    			add_location(g3, file$f, 99, 4, 3411);
    			attr_dev(path8, "id", "Vector_3");
    			attr_dev(path8, "d", "M363.176 175.284C341.086 175.284 323.175 193.195 323.175 215.285C323.175 237.375 341.079 255.279 363.176 255.286C385.273 255.279 403.177 237.375 403.177 215.285C403.177 193.195 385.266 175.284 363.176 175.284Z");
    			attr_dev(path8, "fill", "#7BD8E8");
    			add_location(path8, file$f, 104, 4, 3800);
    			attr_dev(path9, "id", "Vector_4");
    			attr_dev(path9, "d", "M263.177 295.28C172.066 313.502 204.954 417.058 243.173 455.277C243.173 415.283 274.858 395.279 274.858 395.279L289.778 395.279C278.457 366.083 269.315 331.993 265.326 295.04L263.177 295.28Z");
    			attr_dev(path9, "fill", "#ff6584");
    			add_location(path9, file$f, 109, 6, 4120);
    			attr_dev(path10, "id", "Vector_5");
    			attr_dev(path10, "d", "M393.002 455.284H395.293C402.06 455.277 408.629 452.032 412.079 446.205C420.614 431.773 429.071 414.604 436.574 395.279L289.778 395.279C297.281 414.604 305.738 431.773 314.272 446.205C317.723 452.032 324.292 455.277 331.059 455.284H333.35L393.002 455.284Z");
    			attr_dev(path10, "fill", "#ff6584");
    			add_location(path10, file$f, 113, 6, 4383);
    			attr_dev(path11, "id", "Vector_6");
    			attr_dev(path11, "d", "M463.175 295.28L461.025 295.04C457.037 331.993 447.894 366.083 436.574 395.279H451.494C451.494 395.279 483.179 415.283 483.179 455.277C521.398 417.058 554.286 313.502 463.175 295.28Z");
    			attr_dev(path11, "fill", "#ff6584");
    			add_location(path11, file$f, 117, 6, 4711);
    			attr_dev(g4, "id", "Group");
    			attr_dev(g4, "filter", "url(#filter2_d)");
    			add_location(g4, file$f, 108, 4, 4074);
    			attr_dev(path12, "id", "Vector_7");
    			attr_dev(path12, "d", "M352.994 355.101C353.001 349.579 357.477 345.103 362.992 345.103C368.522 345.103 372.998 349.579 372.998 355.108C372.998 360.624 368.522 365.1 362.999 365.107C357.477 365.1 353.001 360.624 352.994 355.101Z");
    			attr_dev(path12, "fill", "black");
    			add_location(path12, file$f, 122, 4, 4973);
    			attr_dev(path13, "id", "Vector_8");
    			attr_dev(path13, "d", "M312.998 215.108C312.998 187.477 335.363 165.107 362.999 165.107C390.632 165.108 413 187.475 413.001 215.109C413.001 242.671 390.572 265.101 362.996 265.109C335.433 265.101 312.998 242.677 312.998 215.108ZM393 215.108C393 198.53 379.581 185.107 362.999 185.107C346.421 185.107 332.998 198.527 332.999 215.108C332.998 231.645 346.457 245.104 362.997 245.109C379.541 245.104 393.001 231.646 393 215.108Z");
    			attr_dev(path13, "fill", "black");
    			add_location(path13, file$f, 126, 4, 5241);
    			attr_dev(path14, "id", "Vector_14");
    			attr_dev(path14, "d", "M352.999 315.1L352.999 295.103C352.999 289.581 357.477 285.103 363 285.103C368.523 285.103 372.999 289.579 373 295.103L373 315.1C373 320.623 368.523 325.1 363 325.101C357.477 325.1 353 320.624 352.999 315.1Z");
    			attr_dev(path14, "fill", "black");
    			add_location(path14, file$f, 130, 4, 5705);
    			attr_dev(g5, "id", "Rocket");
    			attr_dev(g5, "clip-path", "url(#clip0)");
    			add_location(g5, file$f, 66, 2, 1014);
    			attr_dev(feFlood0, "flood-opacity", "0");
    			attr_dev(feFlood0, "result", "BackgroundImageFix");
    			add_location(feFlood0, file$f, 144, 6, 6182);
    			attr_dev(feColorMatrix0, "in", "SourceAlpha");
    			attr_dev(feColorMatrix0, "type", "matrix");
    			attr_dev(feColorMatrix0, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix0, file$f, 145, 6, 6246);
    			attr_dev(feOffset0, "dy", "4");
    			add_location(feOffset0, file$f, 149, 6, 6376);
    			attr_dev(feGaussianBlur0, "stdDeviation", "2");
    			add_location(feGaussianBlur0, file$f, 150, 6, 6402);
    			attr_dev(feColorMatrix1, "type", "matrix");
    			attr_dev(feColorMatrix1, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix1, file$f, 151, 6, 6444);
    			attr_dev(feBlend0, "mode", "normal");
    			attr_dev(feBlend0, "in2", "BackgroundImageFix");
    			attr_dev(feBlend0, "result", "effect1_dropShadow");
    			add_location(feBlend0, file$f, 154, 6, 6550);
    			attr_dev(feBlend1, "mode", "normal");
    			attr_dev(feBlend1, "in", "SourceGraphic");
    			attr_dev(feBlend1, "in2", "effect1_dropShadow");
    			attr_dev(feBlend1, "result", "shape");
    			add_location(feBlend1, file$f, 158, 6, 6659);
    			attr_dev(filter0, "id", "filter0_d");
    			attr_dev(filter0, "x", "276.36");
    			attr_dev(filter0, "y", "15.28");
    			attr_dev(filter0, "width", "173.633");
    			attr_dev(filter0, "height", "173.633");
    			attr_dev(filter0, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter0, "color-interpolation-filters", "sRGB");
    			add_location(filter0, file$f, 136, 4, 5992);
    			attr_dev(feFlood1, "flood-opacity", "0");
    			attr_dev(feFlood1, "result", "BackgroundImageFix");
    			add_location(feFlood1, file$f, 172, 6, 6986);
    			attr_dev(feColorMatrix2, "in", "SourceAlpha");
    			attr_dev(feColorMatrix2, "type", "matrix");
    			attr_dev(feColorMatrix2, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix2, file$f, 173, 6, 7050);
    			attr_dev(feOffset1, "dy", "4");
    			add_location(feOffset1, file$f, 177, 6, 7180);
    			attr_dev(feGaussianBlur1, "stdDeviation", "2");
    			add_location(feGaussianBlur1, file$f, 178, 6, 7206);
    			attr_dev(feColorMatrix3, "type", "matrix");
    			attr_dev(feColorMatrix3, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix3, file$f, 179, 6, 7248);
    			attr_dev(feBlend2, "mode", "normal");
    			attr_dev(feBlend2, "in2", "BackgroundImageFix");
    			attr_dev(feBlend2, "result", "effect1_dropShadow");
    			add_location(feBlend2, file$f, 182, 6, 7354);
    			attr_dev(feBlend3, "mode", "normal");
    			attr_dev(feBlend3, "in", "SourceGraphic");
    			attr_dev(feBlend3, "in2", "effect1_dropShadow");
    			attr_dev(feBlend3, "result", "shape");
    			add_location(feBlend3, file$f, 186, 6, 7463);
    			attr_dev(filter1, "id", "filter1_d");
    			attr_dev(filter1, "x", "149.66");
    			attr_dev(filter1, "y", "49.6454");
    			attr_dev(filter1, "width", "427.031");
    			attr_dev(filter1, "height", "427.031");
    			attr_dev(filter1, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter1, "color-interpolation-filters", "sRGB");
    			add_location(filter1, file$f, 164, 4, 6794);
    			attr_dev(feFlood2, "flood-opacity", "0");
    			attr_dev(feFlood2, "result", "BackgroundImageFix");
    			add_location(feFlood2, file$f, 200, 6, 7791);
    			attr_dev(feColorMatrix4, "in", "SourceAlpha");
    			attr_dev(feColorMatrix4, "type", "matrix");
    			attr_dev(feColorMatrix4, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix4, file$f, 201, 6, 7855);
    			attr_dev(feOffset2, "dy", "4");
    			add_location(feOffset2, file$f, 205, 6, 7985);
    			attr_dev(feGaussianBlur2, "stdDeviation", "2");
    			add_location(feGaussianBlur2, file$f, 206, 6, 8011);
    			attr_dev(feColorMatrix5, "type", "matrix");
    			attr_dev(feColorMatrix5, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix5, file$f, 207, 6, 8053);
    			attr_dev(feBlend4, "mode", "normal");
    			attr_dev(feBlend4, "in2", "BackgroundImageFix");
    			attr_dev(feBlend4, "result", "effect1_dropShadow");
    			add_location(feBlend4, file$f, 210, 6, 8159);
    			attr_dev(feBlend5, "mode", "normal");
    			attr_dev(feBlend5, "in", "SourceGraphic");
    			attr_dev(feBlend5, "in2", "effect1_dropShadow");
    			attr_dev(feBlend5, "result", "shape");
    			add_location(feBlend5, file$f, 214, 6, 8268);
    			attr_dev(filter2, "id", "filter2_d");
    			attr_dev(filter2, "x", "158.792");
    			attr_dev(filter2, "y", "283.701");
    			attr_dev(filter2, "width", "408.767");
    			attr_dev(filter2, "height", "220.172");
    			attr_dev(filter2, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter2, "color-interpolation-filters", "sRGB");
    			add_location(filter2, file$f, 192, 4, 7598);
    			attr_dev(feFlood3, "flood-opacity", "0");
    			attr_dev(feFlood3, "result", "BackgroundImageFix");
    			add_location(feFlood3, file$f, 228, 6, 8596);
    			attr_dev(feColorMatrix6, "in", "SourceAlpha");
    			attr_dev(feColorMatrix6, "type", "matrix");
    			attr_dev(feColorMatrix6, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix6, file$f, 229, 6, 8660);
    			attr_dev(feOffset3, "dy", "4");
    			add_location(feOffset3, file$f, 233, 6, 8790);
    			attr_dev(feGaussianBlur3, "stdDeviation", "2");
    			add_location(feGaussianBlur3, file$f, 234, 6, 8816);
    			attr_dev(feColorMatrix7, "type", "matrix");
    			attr_dev(feColorMatrix7, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix7, file$f, 235, 6, 8858);
    			attr_dev(feBlend6, "mode", "normal");
    			attr_dev(feBlend6, "in2", "BackgroundImageFix");
    			attr_dev(feBlend6, "result", "effect1_dropShadow");
    			add_location(feBlend6, file$f, 238, 6, 8964);
    			attr_dev(feBlend7, "mode", "normal");
    			attr_dev(feBlend7, "in", "SourceGraphic");
    			attr_dev(feBlend7, "in2", "effect1_dropShadow");
    			attr_dev(feBlend7, "result", "shape");
    			add_location(feBlend7, file$f, 242, 6, 9073);
    			attr_dev(filter3, "id", "filter3_d");
    			attr_dev(filter3, "x", "284.265");
    			attr_dev(filter3, "y", "425.458");
    			attr_dev(filter3, "width", "157.822");
    			attr_dev(filter3, "height", "157.822");
    			attr_dev(filter3, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter3, "color-interpolation-filters", "sRGB");
    			add_location(filter3, file$f, 220, 4, 8403);
    			attr_dev(feFlood4, "flood-opacity", "0");
    			attr_dev(feFlood4, "result", "BackgroundImageFix");
    			add_location(feFlood4, file$f, 256, 6, 9400);
    			attr_dev(feColorMatrix8, "in", "SourceAlpha");
    			attr_dev(feColorMatrix8, "type", "matrix");
    			attr_dev(feColorMatrix8, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix8, file$f, 257, 6, 9464);
    			attr_dev(feOffset4, "dy", "4");
    			add_location(feOffset4, file$f, 261, 6, 9594);
    			attr_dev(feGaussianBlur4, "stdDeviation", "2");
    			add_location(feGaussianBlur4, file$f, 262, 6, 9620);
    			attr_dev(feColorMatrix9, "type", "matrix");
    			attr_dev(feColorMatrix9, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix9, file$f, 263, 6, 9662);
    			attr_dev(feBlend8, "mode", "normal");
    			attr_dev(feBlend8, "in2", "BackgroundImageFix");
    			attr_dev(feBlend8, "result", "effect1_dropShadow");
    			add_location(feBlend8, file$f, 266, 6, 9768);
    			attr_dev(feBlend9, "mode", "normal");
    			attr_dev(feBlend9, "in", "SourceGraphic");
    			attr_dev(feBlend9, "in2", "effect1_dropShadow");
    			attr_dev(feBlend9, "result", "shape");
    			add_location(feBlend9, file$f, 270, 6, 9877);
    			attr_dev(filter4, "id", "filter4_d");
    			attr_dev(filter4, "x", "224.855");
    			attr_dev(filter4, "y", "480.96");
    			attr_dev(filter4, "width", "276.289");
    			attr_dev(filter4, "height", "248.649");
    			attr_dev(filter4, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter4, "color-interpolation-filters", "sRGB");
    			add_location(filter4, file$f, 248, 4, 9208);
    			attr_dev(rect, "width", "512.001");
    			attr_dev(rect, "height", "512.001");
    			attr_dev(rect, "fill", "white");
    			attr_dev(rect, "transform", "matrix(-0.707107 -0.707107 -0.707107 0.707107 725.04 363)");
    			add_location(rect, file$f, 277, 6, 10040);
    			attr_dev(clipPath, "id", "clip0");
    			add_location(clipPath, file$f, 276, 4, 10012);
    			add_location(defs, file$f, 135, 2, 5981);
    			attr_dev(svg, "width", "75");
    			attr_dev(svg, "height", "75");
    			attr_dev(svg, "viewBox", "0 0 726 726");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1j2qzve");
    			add_location(svg, file$f, 59, 0, 879);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g5);
    			append_dev(g5, g0);
    			append_dev(g0, path0);
    			append_dev(g0, path1);
    			append_dev(g0, path2);
    			append_dev(g0, path3);
    			append_dev(g0, path4);
    			append_dev(g5, g1);
    			append_dev(g1, path5);
    			append_dev(g5, g2);
    			append_dev(g2, path6);
    			append_dev(g5, g3);
    			append_dev(g3, path7);
    			append_dev(g5, path8);
    			append_dev(g5, g4);
    			append_dev(g4, path9);
    			append_dev(g4, path10);
    			append_dev(g4, path11);
    			append_dev(g5, path12);
    			append_dev(g5, path13);
    			append_dev(g5, path14);
    			append_dev(svg, defs);
    			append_dev(defs, filter0);
    			append_dev(filter0, feFlood0);
    			append_dev(filter0, feColorMatrix0);
    			append_dev(filter0, feOffset0);
    			append_dev(filter0, feGaussianBlur0);
    			append_dev(filter0, feColorMatrix1);
    			append_dev(filter0, feBlend0);
    			append_dev(filter0, feBlend1);
    			append_dev(defs, filter1);
    			append_dev(filter1, feFlood1);
    			append_dev(filter1, feColorMatrix2);
    			append_dev(filter1, feOffset1);
    			append_dev(filter1, feGaussianBlur1);
    			append_dev(filter1, feColorMatrix3);
    			append_dev(filter1, feBlend2);
    			append_dev(filter1, feBlend3);
    			append_dev(defs, filter2);
    			append_dev(filter2, feFlood2);
    			append_dev(filter2, feColorMatrix4);
    			append_dev(filter2, feOffset2);
    			append_dev(filter2, feGaussianBlur2);
    			append_dev(filter2, feColorMatrix5);
    			append_dev(filter2, feBlend4);
    			append_dev(filter2, feBlend5);
    			append_dev(defs, filter3);
    			append_dev(filter3, feFlood3);
    			append_dev(filter3, feColorMatrix6);
    			append_dev(filter3, feOffset3);
    			append_dev(filter3, feGaussianBlur3);
    			append_dev(filter3, feColorMatrix7);
    			append_dev(filter3, feBlend6);
    			append_dev(filter3, feBlend7);
    			append_dev(defs, filter4);
    			append_dev(filter4, feFlood4);
    			append_dev(filter4, feColorMatrix8);
    			append_dev(filter4, feOffset4);
    			append_dev(filter4, feGaussianBlur4);
    			append_dev(filter4, feColorMatrix9);
    			append_dev(filter4, feBlend8);
    			append_dev(filter4, feBlend9);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*handleClick*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*flying*/ 1 && path0_fill_value !== (path0_fill_value = /*flying*/ ctx[0] ? "black" : "transparent")) {
    				attr_dev(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*flying*/ 1 && path1_fill_value !== (path1_fill_value = /*flying*/ ctx[0] ? "black" : "transparent")) {
    				attr_dev(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*flying*/ 1 && path2_fill_value !== (path2_fill_value = /*flying*/ ctx[0] ? "black" : "transparent")) {
    				attr_dev(path2, "fill", path2_fill_value);
    			}

    			if (dirty & /*flying*/ 1 && path3_fill_value !== (path3_fill_value = /*flying*/ ctx[0] ? "black" : "transparent")) {
    				attr_dev(path3, "fill", path3_fill_value);
    			}

    			if (dirty & /*flying*/ 1 && path4_fill_value !== (path4_fill_value = /*flying*/ ctx[0] ? "black" : "transparent")) {
    				attr_dev(path4, "fill", path4_fill_value);
    			}

    			if (dirty & /*flying*/ 1) {
    				toggle_class(g0, "flyingLines", /*flying*/ ctx[0]);
    			}

    			if (dirty & /*flying*/ 1 && path5_fill_value !== (path5_fill_value = /*flying*/ ctx[0] ? "#FFDD78" : "transparent")) {
    				attr_dev(path5, "fill", path5_fill_value);
    			}

    			if (dirty & /*flying*/ 1) {
    				toggle_class(g1, "pulsatingFlame", /*flying*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Rocket", slots, []);
    	let flying = false;

    	const handleClick = () => {
    		$$invalidate(0, flying = !flying);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rocket> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ flying, handleClick });

    	$$self.$inject_state = $$props => {
    		if ("flying" in $$props) $$invalidate(0, flying = $$props.flying);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [flying, handleClick];
    }

    class Rocket extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rocket",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */
    const file$g = "src/App.svelte";

    // (53:2) {#if scrollTop > 160}
    function create_if_block$1(ctx) {
    	let div;
    	let rocket;
    	let current;
    	let mounted;
    	let dispose;
    	rocket = new Rocket({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(rocket.$$.fragment);
    			attr_dev(div, "class", "toTopButton svelte-doxkan");
    			add_location(div, file$g, 53, 4, 1251);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(rocket, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*scrollToTop*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rocket.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rocket.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(rocket);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(53:2) {#if scrollTop > 160}",
    		ctx
    	});

    	return block;
    }

    // (59:2) <Section id="about" isBlue={false}>
    function create_default_slot_3(ctx) {
    	let about;
    	let current;
    	about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(59:2) <Section id=\\\"about\\\" isBlue={false}>",
    		ctx
    	});

    	return block;
    }

    // (63:2) <Section id="projects" isBlue={true}>
    function create_default_slot_2(ctx) {
    	let projects;
    	let current;
    	projects = new Projects({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(projects.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projects, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projects.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projects.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(projects, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(63:2) <Section id=\\\"projects\\\" isBlue={true}>",
    		ctx
    	});

    	return block;
    }

    // (67:2) <Section id="contact" isBlue={false}>
    function create_default_slot_1(ctx) {
    	let contact;
    	let current;
    	contact = new Contact({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(contact.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contact, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contact, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(67:2) <Section id=\\\"contact\\\" isBlue={false}>",
    		ctx
    	});

    	return block;
    }

    // (47:0) <ThemeContext>
    function create_default_slot(ctx) {
    	let div;
    	let nav;
    	let t0;
    	let home;
    	let t1;
    	let t2;
    	let section0;
    	let t3;
    	let section1;
    	let t4;
    	let section2;
    	let current;
    	nav = new Nav({ $$inline: true });
    	home = new Home({ $$inline: true });
    	let if_block = /*scrollTop*/ ctx[0] > 160 && create_if_block$1(ctx);

    	section0 = new Section({
    			props: {
    				id: "about",
    				isBlue: false,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section1 = new Section({
    			props: {
    				id: "projects",
    				isBlue: true,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section2 = new Section({
    			props: {
    				id: "contact",
    				isBlue: false,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			create_component(home.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			create_component(section0.$$.fragment);
    			t3 = space();
    			create_component(section1.$$.fragment);
    			t4 = space();
    			create_component(section2.$$.fragment);
    			attr_dev(div, "class", "home svelte-doxkan");
    			add_location(div, file$g, 47, 2, 1169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(nav, div, null);
    			append_dev(div, t0);
    			mount_component(home, div, null);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(section0, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(section1, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(section2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*scrollTop*/ ctx[0] > 160) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*scrollTop*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const section0_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				section0_changes.$$scope = { dirty, ctx };
    			}

    			section0.$set(section0_changes);
    			const section1_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				section1_changes.$$scope = { dirty, ctx };
    			}

    			section1.$set(section1_changes);
    			const section2_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				section2_changes.$$scope = { dirty, ctx };
    			}

    			section2.$set(section2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(home.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(section0.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			transition_in(section2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(home.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(section0.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			transition_out(section2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(nav);
    			destroy_component(home);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(section0, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(section1, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(section2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(47:0) <ThemeContext>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let themecontext;
    	let current;
    	let mounted;
    	let dispose;

    	themecontext = new ThemeContext({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(themecontext.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(themecontext, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "scroll", /*handleScroll*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const themecontext_changes = {};

    			if (dirty & /*$$scope, scrollTop*/ 9) {
    				themecontext_changes.$$scope = { dirty, ctx };
    			}

    			themecontext.$set(themecontext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(themecontext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(themecontext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(themecontext, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let scrollTop = 0;

    	const scrollToTop = () => {
    		const scrolling = setInterval(
    			() => {
    				document.documentElement.scrollTop = scrollTop - 100;

    				if (scrollTop === 0) {
    					clearInterval(scrolling);
    				}
    			},
    			25
    		);
    	};

    	const handleScroll = e => {
    		$$invalidate(0, scrollTop = document.documentElement.scrollTop);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		elasticOut,
    		bounceOut,
    		ThemeContext,
    		Nav,
    		Home,
    		About,
    		Projects,
    		Contact,
    		Section,
    		Rocket,
    		scrollTop,
    		scrollToTop,
    		handleScroll
    	});

    	$$self.$inject_state = $$props => {
    		if ("scrollTop" in $$props) $$invalidate(0, scrollTop = $$props.scrollTop);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [scrollTop, scrollToTop, handleScroll];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
