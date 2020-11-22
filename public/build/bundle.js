
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
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
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
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
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }

    /* src/Nav.svelte generated by Svelte v3.29.4 */

    const file = "src/Nav.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let a1;
    	let t2;
    	let a2;
    	let t4;
    	let a3;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			a1 = element("a");
    			a1.textContent = "About";
    			t2 = space();
    			a2 = element("a");
    			a2.textContent = "Projects";
    			t4 = space();
    			a3 = element("a");
    			a3.textContent = "Contact";
    			if (img.src !== (img_src_value = "/NHLogo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "svelte-1fpovr8");
    			add_location(img, file, 36, 32, 515);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-1fpovr8");
    			add_location(a0, file, 36, 20, 503);
    			attr_dev(div0, "class", "logo svelte-1fpovr8");
    			add_location(div0, file, 36, 2, 485);
    			attr_dev(a1, "href", "#about");
    			attr_dev(a1, "class", "svelte-1fpovr8");
    			add_location(a1, file, 39, 4, 589);
    			attr_dev(a2, "href", "#projects");
    			attr_dev(a2, "class", "svelte-1fpovr8");
    			add_location(a2, file, 40, 4, 620);
    			attr_dev(a3, "href", "#contact");
    			attr_dev(a3, "class", "svelte-1fpovr8");
    			add_location(a3, file, 41, 4, 657);
    			attr_dev(div1, "class", "links svelte-1fpovr8");
    			add_location(div1, file, 38, 2, 565);
    			attr_dev(nav, "class", "svelte-1fpovr8");
    			add_location(nav, file, 35, 0, 477);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img);
    			append_dev(nav, t0);
    			append_dev(nav, div1);
    			append_dev(div1, a1);
    			append_dev(div1, t2);
    			append_dev(div1, a2);
    			append_dev(div1, t4);
    			append_dev(div1, a3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
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

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nav", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment.name
    		});
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

    /* src/Nature.svelte generated by Svelte v3.29.4 */

    const file$1 = "src/Nature.svelte";

    function create_fragment$1(ctx) {
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
    			add_location(path0, file$1, 14, 4, 294);
    			attr_dev(path1, "id", "Vector");
    			attr_dev(path1, "d", "M258.819 101.419C258.881 101.409 258.928 101.371 259 101.38C258.968 101.273 258.927 101.168 258.877 101.067C258.787 101.174 258.695 101.284 258.615 101.38L258.819 101.419Z");
    			attr_dev(path1, "fill", "white");
    			add_location(path1, file$1, 18, 4, 563);
    			attr_dev(path2, "id", "Vector_2");
    			attr_dev(path2, "d", "M69.7914 141.563C69.956 146.965 70.9859 152.32 72.8508 157.47C72.8935 157.59 72.9381 157.707 72.9828 157.827H84.4005C84.3883 157.72 84.3762 157.6 84.364 157.47C83.6027 149.78 79.2134 102.979 84.4614 94.9755C84.0026 95.6247 68.9062 117.129 69.7914 141.563Z");
    			attr_dev(path2, "fill", "#E6E6E6");
    			add_location(path2, file$1, 22, 4, 795);
    			attr_dev(path3, "id", "Vector_3");
    			attr_dev(path3, "d", "M70.6481 157.47C70.7435 157.59 70.843 157.709 70.9445 157.827H79.5098C79.4448 157.725 79.3697 157.606 79.2824 157.47C77.8674 155.226 73.6791 148.518 69.7913 141.563C65.6132 134.089 61.7803 126.332 62.1031 123.524C62.0036 124.157 59.1126 143.461 70.6481 157.47Z");
    			attr_dev(path3, "fill", "#E6E6E6");
    			add_location(path3, file$1, 26, 4, 1115);
    			attr_dev(path4, "id", "Vector_4");
    			attr_dev(path4, "d", "M159.654 158.756C159.51 163.466 158.612 168.135 156.987 172.625C156.949 172.729 156.91 172.831 156.872 172.936H146.917C146.928 172.842 146.939 172.738 146.949 172.625C147.613 165.921 151.44 125.119 146.864 118.141C147.264 118.707 160.426 137.455 159.654 158.756Z");
    			attr_dev(path4, "fill", "#E6E6E6");
    			add_location(path4, file$1, 30, 4, 1440);
    			attr_dev(path5, "id", "Vector_5");
    			attr_dev(path5, "d", "M158.907 172.625C158.824 172.729 158.737 172.833 158.649 172.936H151.181C151.238 172.847 151.303 172.743 151.379 172.625C152.613 170.668 156.264 164.82 159.654 158.756C163.296 152.241 166.638 145.478 166.357 143.03C166.443 143.582 168.964 160.411 158.907 172.625Z");
    			attr_dev(path5, "fill", "#E6E6E6");
    			add_location(path5, file$1, 34, 4, 1767);
    			attr_dev(path6, "id", "Bird1");
    			attr_dev(path6, "d", "M45.8401 20.0986L50.4821 16.8366C46.876 16.487 45.3942 18.215 44.7878 19.5827C41.9705 18.5549 38.9036 19.9019 38.9036 19.9019L48.1914 22.8644C47.7228 21.7648 46.9072 20.8054 45.8401 20.0986V20.0986Z");
    			attr_dev(path6, "fill", "#3F3D56");
    			add_location(path6, file$1, 38, 4, 2095);
    			attr_dev(path7, "id", "Bird2");
    			attr_dev(path7, "d", "M185.654 3.30772L190.296 0.0456834C186.69 -0.303879 185.208 1.42411 184.602 2.79182C181.785 1.76399 178.718 3.11101 178.718 3.11101L188.006 6.07351C187.537 4.97393 186.721 4.0145 185.654 3.30772V3.30772Z");
    			attr_dev(path7, "fill", "#3F3D56");
    			add_location(path7, file$1, 42, 4, 2355);
    			attr_dev(path8, "id", "Vector_6");
    			attr_dev(path8, "d", "M253.953 132.306C253.953 135.009 253.846 137.689 253.632 140.348C251.978 161.324 243.7 181.478 229.728 198.548C227.902 200.787 225.985 202.964 223.976 205.077C218.772 210.561 212.994 215.604 206.717 220.14L179.205 205.956L162.756 172.224C162.756 172.224 187.299 128.564 253.91 129.355C253.937 130.335 253.952 131.319 253.953 132.306Z");
    			attr_dev(path8, "fill", "#3F3D56");
    			add_location(path8, file$1, 46, 4, 2620);
    			attr_dev(path9, "id", "Vector_7");
    			attr_dev(path9, "d", "M253.632 140.348C252.366 156.022 247.417 171.296 239.095 185.205C230.774 199.115 219.261 211.358 205.284 221.162L179.725 207.986L165.138 178.069C165.138 178.069 188.776 136.02 253.632 140.348Z");
    			attr_dev(path9, "fill", "#1E77FD");
    			add_location(path9, file$1, 50, 4, 3018);
    			attr_dev(path10, "id", "Vector_8");
    			attr_dev(path10, "d", "M229.728 198.548C227.902 200.787 225.985 202.964 223.976 205.077C210.518 219.284 193.321 230.395 173.874 237.449C169.937 238.875 165.906 240.133 161.783 241.222C132.013 248.178 100.473 246.419 71.9434 236.21C43.7275 225.146 20.9262 205.604 7.6348 181.097C5.84856 177.797 4.24227 174.414 2.81592 170.948C27.6923 154.936 76.7107 132.009 130.135 154.288C144.913 160.45 158.109 166.068 169.722 171.14C199.191 183.974 218.804 193.226 229.728 198.548Z");
    			attr_dev(path10, "fill", "#3F3D56");
    			add_location(path10, file$1, 54, 4, 3275);
    			attr_dev(path11, "id", "Vector_9");
    			attr_dev(path11, "d", "M223.976 205.077C210.064 219.726 192.182 231.067 171.975 238.054C151.769 245.042 129.887 247.452 108.342 245.064C86.7974 242.676 66.2823 235.566 48.6842 224.388C31.086 213.21 16.97 198.323 7.63477 181.097C28.4107 166.662 76.3296 140.721 128.916 162.647C142.44 168.287 154.514 173.427 165.137 178.069C196.107 191.556 215.184 200.721 223.976 205.077Z");
    			attr_dev(path11, "fill", "#1E77FD");
    			add_location(path11, file$1, 58, 4, 3785);
    			attr_dev(path12, "id", "Vector_10");
    			attr_dev(path12, "d", "M187.307 231.76C182.956 233.879 178.471 235.779 173.874 237.448C158.23 243.113 141.471 246.018 124.55 246C104.528 245.993 84.7807 241.908 66.8585 234.066C48.9363 226.223 33.3275 214.837 21.2578 200.801C52.1637 197.938 137.594 194.077 187.307 231.76Z");
    			attr_dev(path12, "fill", "#3F3D56");
    			add_location(path12, file$1, 62, 4, 4198);
    			attr_dev(path13, "id", "Vector_11");
    			attr_dev(path13, "d", "M173.874 237.449C149.616 246.212 122.901 248.3 97.2632 243.435C71.6252 238.57 48.2721 226.982 30.2922 210.204C41.5336 208.753 129.79 198.789 173.874 237.449Z");
    			attr_dev(path13, "fill", "#1E77FD");
    			add_location(path13, file$1, 66, 4, 4513);
    			attr_dev(path14, "id", "Vector_12");
    			attr_dev(path14, "d", "M232.249 69.2576V69.2611C139.848 9.23674 33.984 51.485 33.1663 51.8094V51.8059C45.1655 41.2646 59.4136 32.9065 75.0947 27.2105C90.7759 21.5144 107.582 18.5923 124.55 18.6113C169.472 18.6113 209.047 38.724 232.249 69.2576Z");
    			attr_dev(path14, "fill", "#E6E6E6");
    			add_location(path14, file$1, 70, 4, 4736);
    			attr_dev(path15, "id", "Vector_13");
    			attr_dev(path15, "d", "M40.5772 134.51C56.2084 132.034 64.2183 107.31 58.4679 79.2878C52.7175 51.2657 35.3844 30.5567 19.7533 33.0328C4.12221 35.509 -3.88772 60.2326 1.86265 88.2547C7.61301 116.277 24.9461 136.986 40.5772 134.51Z");
    			attr_dev(path15, "fill", "#3F3D56");
    			add_location(path15, file$1, 75, 6, 5044);
    			attr_dev(path16, "id", "Vector_14");
    			attr_dev(path16, "d", "M44.5943 167.236C43.6677 105.686 20.2284 47.9243 19.9919 47.3485L17.8542 48.0259C18.0897 48.5989 41.4003 106.058 42.3221 167.263L44.5943 167.236Z");
    			attr_dev(path16, "fill", "#1E77FD");
    			add_location(path16, file$1, 79, 6, 5324);
    			attr_dev(path17, "id", "Vector_15");
    			attr_dev(path17, "d", "M3.00845 76.8082L2.30908 78.7082L30.3705 86.6816L31.0698 84.7815L3.00845 76.8082Z");
    			attr_dev(path17, "fill", "#1E77FD");
    			add_location(path17, file$1, 83, 6, 5543);
    			attr_dev(path18, "id", "Vector_16");
    			attr_dev(path18, "d", "M55.7943 74.6679L32.6736 90.756L34.0847 92.3214L57.2054 76.2333L55.7943 74.6679Z");
    			attr_dev(path18, "fill", "#1E77FD");
    			add_location(path18, file$1, 87, 6, 5698);
    			attr_dev(g0, "id", "Tree1");
    			add_location(g0, file$1, 74, 4, 5023);
    			attr_dev(path19, "id", "Vector_17");
    			attr_dev(path19, "d", "M115.737 125.636C132.924 125.636 146.857 100.659 146.857 69.8472C146.857 39.0358 132.924 14.0582 115.737 14.0582C98.5503 14.0582 84.6174 39.0358 84.6174 69.8472C84.6174 100.659 98.5503 125.636 115.737 125.636Z");
    			attr_dev(path19, "fill", "#3F3D56");
    			add_location(path19, file$1, 93, 6, 5880);
    			attr_dev(path20, "id", "Vector_18");
    			attr_dev(path20, "d", "M112.864 161.165C125.327 95.462 112.989 29.9967 112.863 29.3436L110.439 29.7044C110.564 30.3543 122.832 95.4757 110.438 160.81L112.864 161.165Z");
    			attr_dev(path20, "fill", "#1E77FD");
    			add_location(path20, file$1, 97, 6, 6163);
    			attr_dev(path21, "id", "Vector_19");
    			attr_dev(path21, "d", "M88.3389 57.8508L87.179 59.7563L115.32 72.9811L116.48 71.0757L88.3389 57.8508Z");
    			attr_dev(path21, "fill", "#1E77FD");
    			add_location(path21, file$1, 101, 6, 6380);
    			attr_dev(path22, "id", "Vector_20");
    			attr_dev(path22, "d", "M145.02 64.4755L116.882 77.7079L118.043 79.613L146.18 66.3806L145.02 64.4755Z");
    			attr_dev(path22, "fill", "#1E77FD");
    			add_location(path22, file$1, 105, 6, 6532);
    			attr_dev(g1, "id", "Tree2");
    			add_location(g1, file$1, 92, 4, 5859);
    			attr_dev(path23, "id", "Vector_21");
    			attr_dev(path23, "d", "M250.913 107.69C239.495 102.058 227.566 97.2662 215.248 93.3636C147.136 71.7093 79.5965 80.0551 53.1602 111.045C73.7337 73.0799 147.144 61.142 221.225 84.6935C229.848 87.4322 238.286 90.5994 246.499 94.1797C248.288 98.5983 249.762 103.111 250.913 107.69V107.69Z");
    			attr_dev(path23, "fill", "#E6E6E6");
    			add_location(path23, file$1, 110, 4, 6690);
    			attr_dev(path24, "id", "Bird3");
    			attr_dev(path24, "d", "M158.924 46.5965L163.566 43.3345C159.96 42.9849 158.478 44.7129 157.872 46.0806C155.054 45.0528 151.987 46.3998 151.987 46.3998L161.275 49.3623C160.807 48.2628 159.991 47.3033 158.924 46.5965Z");
    			attr_dev(path24, "fill", "#3F3D56");
    			add_location(path24, file$1, 114, 4, 7017);
    			attr_dev(g2, "id", "undraw_nature_m5ll 1");
    			add_location(g2, file$1, 13, 2, 259);
    			attr_dev(svg, "width", /*height*/ ctx[0]);
    			attr_dev(svg, "height", /*width*/ ctx[1]);
    			attr_dev(svg, "viewBox", "0 0 259 246");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$1, 7, 0, 138);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { sizeFactor: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nature",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get sizeFactor() {
    		throw new Error("<Nature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sizeFactor(value) {
    		throw new Error("<Nature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Home.svelte generated by Svelte v3.29.4 */
    const file$2 = "src/Home.svelte";

    function create_fragment$2(ctx) {
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
    			add_location(path, file$2, 119, 6, 2554);
    			attr_dev(svg, "id", "triangle");
    			attr_dev(svg, "width", /*triangleWidth*/ ctx[2]);
    			attr_dev(svg, "height", /*triangleHeight*/ ctx[3]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + /*triangleWidth*/ ctx[2] + " " + /*triangleHeight*/ ctx[3]);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1um117o");
    			add_location(svg, file$2, 112, 4, 2352);
    			attr_dev(div0, "class", "illustrationContainer svelte-1um117o");
    			add_location(div0, file$2, 121, 4, 2640);
    			attr_dev(div1, "class", "illustration svelte-1um117o");
    			add_location(div1, file$2, 111, 2, 2321);
    			attr_dev(h10, "class", "svelte-1um117o");
    			add_location(h10, file$2, 128, 6, 2788);
    			attr_dev(h11, "class", "outstanding svelte-1um117o");
    			add_location(h11, file$2, 129, 6, 2809);
    			attr_dev(h2, "class", "svelte-1um117o");
    			add_location(h2, file$2, 130, 6, 2856);
    			attr_dev(button, "class", "primaryButton svelte-1um117o");
    			add_location(button, file$2, 131, 25, 2907);
    			attr_dev(a, "href", "#contact");
    			attr_dev(a, "class", "svelte-1um117o");
    			add_location(a, file$2, 131, 6, 2888);
    			attr_dev(div2, "class", "description svelte-1um117o");
    			add_location(div2, file$2, 127, 4, 2748);
    			attr_dev(section, "class", "svelte-1um117o");
    			add_location(section, file$2, 126, 2, 2734);
    			attr_dev(div3, "class", "sectionContainer svelte-1um117o");
    			add_render_callback(() => /*div3_elementresize_handler*/ ctx[4].call(div3));
    			add_location(div3, file$2, 110, 0, 2245);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Sections/About.svelte generated by Svelte v3.29.4 */

    const file$3 = "src/Sections/About.svelte";

    function create_fragment$3(ctx) {
    	let div7;
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
    	let div6;
    	let div3;
    	let svg0;
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
    	let t7;
    	let span0;
    	let t9;
    	let div2;
    	let span1;
    	let t11;
    	let span2;
    	let t13;
    	let div4;
    	let svg1;
    	let g3;
    	let g2;
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
    	let t14;
    	let h22;
    	let t16;
    	let div5;
    	let svg2;
    	let g5;
    	let g4;
    	let path32;
    	let path33;
    	let path34;
    	let path35;
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
    	let t17;
    	let h23;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Hi, I`m Nathan.";
    			t2 = space();
    			h20 = element("h2");
    			h20.textContent = "A full stack web devloper based in Karslruhe, Germany.";
    			t4 = space();
    			h21 = element("h2");
    			h21.textContent = "I like to create beautiful applications.";
    			t6 = space();
    			div6 = element("div");
    			div3 = element("div");
    			svg0 = svg_element("svg");
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
    			t7 = space();
    			span0 = element("span");
    			span0.textContent = "Frontend";
    			t9 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Building fast and responsive sites is important.";
    			t11 = space();
    			span2 = element("span");
    			span2.textContent = "This is why I use modern web technologies (HTML5, CSS3, React,\n          Svelte to name a few) to build my sites.";
    			t13 = space();
    			div4 = element("div");
    			svg1 = svg_element("svg");
    			g3 = svg_element("g");
    			g2 = svg_element("g");
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
    			t14 = space();
    			h22 = element("h2");
    			h22.textContent = "Backend";
    			t16 = space();
    			div5 = element("div");
    			svg2 = svg_element("svg");
    			g5 = svg_element("g");
    			g4 = svg_element("g");
    			path32 = svg_element("path");
    			path33 = svg_element("path");
    			path34 = svg_element("path");
    			path35 = svg_element("path");
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
    			t17 = space();
    			h23 = element("h2");
    			h23.textContent = "Cloud";
    			attr_dev(img, "class", "profilePicture svelte-1kdn3pd");
    			if (img.src !== (img_src_value = "./profile_picture.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Profile");
    			add_location(img, file$3, 75, 6, 1251);
    			attr_dev(div0, "class", "imageContainer svelte-1kdn3pd");
    			add_location(div0, file$3, 74, 4, 1216);
    			attr_dev(h1, "class", "svelte-1kdn3pd");
    			add_location(h1, file$3, 78, 4, 1340);
    			attr_dev(h20, "class", "svelte-1kdn3pd");
    			add_location(h20, file$3, 79, 4, 1369);
    			attr_dev(h21, "class", "svelte-1kdn3pd");
    			add_location(h21, file$3, 80, 4, 1437);
    			attr_dev(div1, "class", "description svelte-1kdn3pd");
    			add_location(div1, file$3, 73, 2, 1186);
    			attr_dev(path0, "id", "Vector");
    			attr_dev(path0, "d", "M130.453 180.178C199.998 180.178 256.375 176.642 256.375 172.279C256.375 167.916 199.998 164.38 130.453 164.38C60.9077 164.38 4.5304 167.916 4.5304 172.279C4.5304 176.642 60.9077 180.178 130.453 180.178Z");
    			attr_dev(path0, "fill", "#3F3D56");
    			add_location(path0, file$3, 92, 12, 1763);
    			attr_dev(path1, "id", "Vector_2");
    			attr_dev(path1, "d", "M9.67278 164.535C12.5603 169.89 18.6885 172.189 18.6885 172.189C18.6885 172.189 20.1353 165.805 17.2478 160.45C14.3603 155.095 8.23203 152.796 8.23203 152.796C8.23203 152.796 6.7853 159.18 9.67278 164.535Z");
    			attr_dev(path1, "fill", "#3F3D56");
    			add_location(path1, file$3, 96, 12, 2061);
    			attr_dev(path2, "id", "Vector_3");
    			attr_dev(path2, "d", "M11.6574 162.773C16.8705 165.909 18.8783 172.139 18.8783 172.139C18.8783 172.139 12.4339 173.283 7.22083 170.147C2.00773 167.011 0 160.781 0 160.781C0 160.781 6.44437 159.636 11.6574 162.773Z");
    			attr_dev(path2, "fill", "#1E77FD");
    			add_location(path2, file$3, 100, 12, 2363);
    			attr_dev(path3, "id", "Vector_4");
    			attr_dev(path3, "d", "M231.759 22.0857H25.4293V28.6499H231.759V22.0857Z");
    			attr_dev(path3, "fill", "#F2F2F2");
    			add_location(path3, file$3, 104, 12, 2651);
    			attr_dev(path4, "id", "Vector_5");
    			attr_dev(path4, "d", "M231.759 170.312H25.4293V126.031L48.2078 106.448L231.759 92.5305V170.312Z");
    			attr_dev(path4, "fill", "#1E77FD");
    			add_location(path4, file$3, 108, 12, 2797);
    			attr_dev(path5, "id", "Vector_6");
    			attr_dev(path5, "d", "M30.9508 26.97C31.889 26.97 32.6495 26.2095 32.6495 25.2712C32.6495 24.3329 31.889 23.5723 30.9508 23.5723C30.0125 23.5723 29.2518 24.3329 29.2518 25.2712C29.2518 26.2095 30.0125 26.97 30.9508 26.97Z");
    			attr_dev(path5, "fill", "#1E77FD");
    			add_location(path5, file$3, 112, 12, 2967);
    			attr_dev(path6, "id", "Vector_7");
    			attr_dev(path6, "d", "M36.472 26.97C37.4103 26.97 38.1708 26.2095 38.1708 25.2712C38.1708 24.3329 37.4103 23.5723 36.472 23.5723C35.5338 23.5723 34.773 24.3329 34.773 25.2712C34.773 26.2095 35.5338 26.97 36.472 26.97Z");
    			attr_dev(path6, "fill", "#1E77FD");
    			add_location(path6, file$3, 116, 12, 3263);
    			attr_dev(path7, "id", "Vector_8");
    			attr_dev(path7, "d", "M41.9933 26.97C42.9315 26.97 43.6923 26.2095 43.6923 25.2712C43.6923 24.3329 42.9315 23.5723 41.9933 23.5723C41.055 23.5723 40.2945 24.3329 40.2945 25.2712C40.2945 26.2095 41.055 26.97 41.9933 26.97Z");
    			attr_dev(path7, "fill", "#1E77FD");
    			add_location(path7, file$3, 120, 12, 3555);
    			attr_dev(path8, "id", "Vector_9");
    			attr_dev(path8, "d", "M231.634 92.2103L25.5543 125.782V28.775H231.634V92.2103Z");
    			attr_dev(path8, "fill", "white");
    			attr_dev(path8, "stroke", "#F2F2F2");
    			add_location(path8, file$3, 124, 12, 3851);
    			attr_dev(path9, "id", "Vector_10");
    			attr_dev(path9, "d", "M208.66 140.07C203.09 139.126 197.733 138.316 192.589 137.639L194.623 133.696C193.937 133.458 190.925 135.716 190.925 135.716L193.593 124.272C190.145 124.688 188.392 136.373 188.392 136.373L184.539 132.422L186.404 136.864C170.662 135.01 157.067 134.322 145.632 134.298L147.372 130.923C146.686 130.685 143.674 132.943 143.674 132.943L146.342 121.499C142.894 121.915 141.141 133.6 141.141 133.6L137.288 129.649L139.264 134.353C131.429 134.483 123.606 135.014 115.825 135.945C117.585 130.689 123.565 125.69 123.565 125.69C118.998 127.048 116.603 129.324 115.352 131.446C115.24 120.6 117.043 109.819 120.679 99.6007C120.679 99.6007 111.24 120.141 112.444 133.929L112.588 136.377C104.586 137.523 100.562 138.715 100.562 138.715L208.66 140.07Z");
    			attr_dev(path9, "fill", "#3F3D56");
    			add_location(path9, file$3, 129, 12, 4033);
    			attr_dev(path10, "id", "Vector_11");
    			attr_dev(path10, "d", "M97.9373 65.996H40.3198V68.3192H97.9373V65.996Z");
    			attr_dev(path10, "fill", "#3F3D56");
    			add_location(path10, file$3, 133, 12, 4868);
    			attr_dev(path11, "id", "Vector_12");
    			attr_dev(path11, "d", "M97.9373 71.1072H40.3198V73.4304H97.9373V71.1072Z");
    			attr_dev(path11, "fill", "#3F3D56");
    			add_location(path11, file$3, 137, 12, 5013);
    			attr_dev(path12, "id", "Vector_13");
    			attr_dev(path12, "d", "M59.8353 76.2185H40.3198V78.5418H59.8353V76.2185Z");
    			attr_dev(path12, "fill", "#3F3D56");
    			add_location(path12, file$3, 141, 12, 5160);
    			attr_dev(path13, "id", "Vector_14");
    			attr_dev(path13, "d", "M193.329 54.3054C204.924 54.3054 214.323 44.9057 214.323 33.3107C214.323 21.7156 204.924 12.3159 193.329 12.3159C181.733 12.3159 172.334 21.7156 172.334 33.3107C172.334 44.9057 181.733 54.3054 193.329 54.3054Z");
    			attr_dev(path13, "fill", "#FF6584");
    			add_location(path13, file$3, 145, 12, 5307);
    			attr_dev(path14, "id", "Vector_15");
    			attr_dev(path14, "d", "M207.942 58.6007C212.076 86.8085 196.749 99.1137 176.065 102.144C175.585 102.215 175.106 102.28 174.628 102.339C173.667 102.458 172.712 102.554 171.763 102.625C152.902 104.038 136.88 95.8102 133.036 69.577C129.058 42.429 158.734 3.0842 160.965 0.169678C160.968 0.169345 160.967 0.169345 160.969 0.166708C161.054 0.055678 161.098 0 161.098 0C161.098 0 203.809 30.3952 207.942 58.6007Z");
    			attr_dev(path14, "fill", "#1E77FD");
    			add_location(path14, file$3, 149, 12, 5614);
    			attr_dev(path15, "id", "Vector_16");
    			attr_dev(path15, "d", "M174.07 98.0294L184.964 76.8829L174.343 100.136L174.629 102.339C173.667 102.458 172.712 102.554 171.764 102.625L169.104 74.1889L169.061 73.9722L169.08 73.9272L168.83 71.2402L151.942 51.9642L168.578 69.2364L168.696 69.7969L166.686 48.3127L151.676 28.0362L166.282 44.5444L160.965 0.16963L160.948 0.0218506L160.97 0.16666L165.885 35.0554L175.59 19.5164L166.274 38.0649L168.761 57.2014L177.035 37.2747L169.129 60.0147L170.512 70.6554L182.678 42.8229L170.993 74.3679L174.07 98.0294Z");
    			attr_dev(path15, "fill", "#3F3D56");
    			add_location(path15, file$3, 153, 12, 6095);
    			attr_dev(g0, "id", "Group");
    			add_location(g0, file$3, 91, 10, 1736);
    			attr_dev(g1, "id", "Frontend 1");
    			add_location(g1, file$3, 90, 8, 1706);
    			attr_dev(svg0, "width", "171");
    			attr_dev(svg0, "height", "121");
    			attr_dev(svg0, "viewBox", "0 0 257 181");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$3, 84, 6, 1558);
    			attr_dev(span0, "class", "header svelte-1kdn3pd");
    			add_location(span0, file$3, 160, 6, 6705);
    			add_location(span1, file$3, 162, 8, 6776);
    			add_location(span2, file$3, 163, 8, 6846);
    			attr_dev(div2, "class", "skill svelte-1kdn3pd");
    			add_location(div2, file$3, 161, 6, 6748);
    			attr_dev(div3, "class", "skillContainer svelte-1kdn3pd");
    			add_location(div3, file$3, 83, 4, 1523);
    			attr_dev(path16, "id", "Vector");
    			attr_dev(path16, "d", "M130.453 180.178C199.998 180.178 256.375 176.642 256.375 172.279C256.375 167.916 199.998 164.38 130.453 164.38C60.9077 164.38 4.5304 167.916 4.5304 172.279C4.5304 176.642 60.9077 180.178 130.453 180.178Z");
    			attr_dev(path16, "fill", "#3F3D56");
    			add_location(path16, file$3, 176, 12, 7241);
    			attr_dev(path17, "id", "Vector_2");
    			attr_dev(path17, "d", "M9.67278 164.535C12.5603 169.89 18.6885 172.189 18.6885 172.189C18.6885 172.189 20.1353 165.805 17.2478 160.45C14.3603 155.095 8.23203 152.796 8.23203 152.796C8.23203 152.796 6.7853 159.18 9.67278 164.535Z");
    			attr_dev(path17, "fill", "#3F3D56");
    			add_location(path17, file$3, 180, 12, 7539);
    			attr_dev(path18, "id", "Vector_3");
    			attr_dev(path18, "d", "M11.6574 162.773C16.8705 165.909 18.8783 172.139 18.8783 172.139C18.8783 172.139 12.4339 173.283 7.22083 170.147C2.00773 167.011 0 160.781 0 160.781C0 160.781 6.44437 159.636 11.6574 162.773Z");
    			attr_dev(path18, "fill", "#1E77FD");
    			add_location(path18, file$3, 184, 12, 7841);
    			attr_dev(path19, "id", "Vector_4");
    			attr_dev(path19, "d", "M231.759 22.0857H25.4293V28.6499H231.759V22.0857Z");
    			attr_dev(path19, "fill", "#F2F2F2");
    			add_location(path19, file$3, 188, 12, 8129);
    			attr_dev(path20, "id", "Vector_5");
    			attr_dev(path20, "d", "M231.759 170.312H25.4293V126.031L48.2078 106.448L231.759 92.5305V170.312Z");
    			attr_dev(path20, "fill", "#1E77FD");
    			add_location(path20, file$3, 192, 12, 8275);
    			attr_dev(path21, "id", "Vector_6");
    			attr_dev(path21, "d", "M30.9508 26.97C31.889 26.97 32.6495 26.2095 32.6495 25.2712C32.6495 24.3329 31.889 23.5723 30.9508 23.5723C30.0125 23.5723 29.2518 24.3329 29.2518 25.2712C29.2518 26.2095 30.0125 26.97 30.9508 26.97Z");
    			attr_dev(path21, "fill", "#1E77FD");
    			add_location(path21, file$3, 196, 12, 8445);
    			attr_dev(path22, "id", "Vector_7");
    			attr_dev(path22, "d", "M36.472 26.97C37.4103 26.97 38.1708 26.2095 38.1708 25.2712C38.1708 24.3329 37.4103 23.5723 36.472 23.5723C35.5338 23.5723 34.773 24.3329 34.773 25.2712C34.773 26.2095 35.5338 26.97 36.472 26.97Z");
    			attr_dev(path22, "fill", "#1E77FD");
    			add_location(path22, file$3, 200, 12, 8741);
    			attr_dev(path23, "id", "Vector_8");
    			attr_dev(path23, "d", "M41.9933 26.97C42.9315 26.97 43.6923 26.2095 43.6923 25.2712C43.6923 24.3329 42.9315 23.5723 41.9933 23.5723C41.055 23.5723 40.2945 24.3329 40.2945 25.2712C40.2945 26.2095 41.055 26.97 41.9933 26.97Z");
    			attr_dev(path23, "fill", "#1E77FD");
    			add_location(path23, file$3, 204, 12, 9033);
    			attr_dev(path24, "id", "Vector_9");
    			attr_dev(path24, "d", "M231.634 92.2103L25.5543 125.782V28.775H231.634V92.2103Z");
    			attr_dev(path24, "fill", "white");
    			attr_dev(path24, "stroke", "#F2F2F2");
    			add_location(path24, file$3, 208, 12, 9329);
    			attr_dev(path25, "id", "Vector_10");
    			attr_dev(path25, "d", "M208.66 140.07C203.09 139.126 197.733 138.316 192.589 137.639L194.623 133.696C193.937 133.458 190.925 135.716 190.925 135.716L193.593 124.272C190.145 124.688 188.392 136.373 188.392 136.373L184.539 132.422L186.404 136.864C170.662 135.01 157.067 134.322 145.632 134.298L147.372 130.923C146.686 130.685 143.674 132.943 143.674 132.943L146.342 121.499C142.894 121.915 141.141 133.6 141.141 133.6L137.288 129.649L139.264 134.353C131.429 134.483 123.606 135.014 115.825 135.945C117.585 130.689 123.565 125.69 123.565 125.69C118.998 127.048 116.603 129.324 115.352 131.446C115.24 120.6 117.043 109.819 120.679 99.6007C120.679 99.6007 111.24 120.141 112.444 133.929L112.588 136.377C104.586 137.523 100.562 138.715 100.562 138.715L208.66 140.07Z");
    			attr_dev(path25, "fill", "#3F3D56");
    			add_location(path25, file$3, 213, 12, 9511);
    			attr_dev(path26, "id", "Vector_11");
    			attr_dev(path26, "d", "M97.9373 65.996H40.3198V68.3192H97.9373V65.996Z");
    			attr_dev(path26, "fill", "#3F3D56");
    			add_location(path26, file$3, 217, 12, 10346);
    			attr_dev(path27, "id", "Vector_12");
    			attr_dev(path27, "d", "M97.9373 71.1072H40.3198V73.4304H97.9373V71.1072Z");
    			attr_dev(path27, "fill", "#3F3D56");
    			add_location(path27, file$3, 221, 12, 10491);
    			attr_dev(path28, "id", "Vector_13");
    			attr_dev(path28, "d", "M59.8353 76.2185H40.3198V78.5418H59.8353V76.2185Z");
    			attr_dev(path28, "fill", "#3F3D56");
    			add_location(path28, file$3, 225, 12, 10638);
    			attr_dev(path29, "id", "Vector_14");
    			attr_dev(path29, "d", "M193.329 54.3054C204.924 54.3054 214.323 44.9057 214.323 33.3107C214.323 21.7156 204.924 12.3159 193.329 12.3159C181.733 12.3159 172.334 21.7156 172.334 33.3107C172.334 44.9057 181.733 54.3054 193.329 54.3054Z");
    			attr_dev(path29, "fill", "#FF6584");
    			add_location(path29, file$3, 229, 12, 10785);
    			attr_dev(path30, "id", "Vector_15");
    			attr_dev(path30, "d", "M207.942 58.6007C212.076 86.8085 196.749 99.1137 176.065 102.144C175.585 102.215 175.106 102.28 174.628 102.339C173.667 102.458 172.712 102.554 171.763 102.625C152.902 104.038 136.88 95.8102 133.036 69.577C129.058 42.429 158.734 3.0842 160.965 0.169678C160.968 0.169345 160.967 0.169345 160.969 0.166708C161.054 0.055678 161.098 0 161.098 0C161.098 0 203.809 30.3952 207.942 58.6007Z");
    			attr_dev(path30, "fill", "#1E77FD");
    			add_location(path30, file$3, 233, 12, 11092);
    			attr_dev(path31, "id", "Vector_16");
    			attr_dev(path31, "d", "M174.07 98.0294L184.964 76.8829L174.343 100.136L174.629 102.339C173.667 102.458 172.712 102.554 171.764 102.625L169.104 74.1889L169.061 73.9722L169.08 73.9272L168.83 71.2402L151.942 51.9642L168.578 69.2364L168.696 69.7969L166.686 48.3127L151.676 28.0362L166.282 44.5444L160.965 0.16963L160.948 0.0218506L160.97 0.16666L165.885 35.0554L175.59 19.5164L166.274 38.0649L168.761 57.2014L177.035 37.2747L169.129 60.0147L170.512 70.6554L182.678 42.8229L170.993 74.3679L174.07 98.0294Z");
    			attr_dev(path31, "fill", "#3F3D56");
    			add_location(path31, file$3, 237, 12, 11573);
    			attr_dev(g2, "id", "Group");
    			add_location(g2, file$3, 175, 10, 7214);
    			attr_dev(g3, "id", "Frontend 1");
    			add_location(g3, file$3, 174, 8, 7184);
    			attr_dev(svg1, "width", "171");
    			attr_dev(svg1, "height", "121");
    			attr_dev(svg1, "viewBox", "0 0 257 181");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$3, 168, 6, 7036);
    			attr_dev(h22, "class", "svelte-1kdn3pd");
    			add_location(h22, file$3, 244, 6, 12183);
    			attr_dev(div4, "class", "skillContainer svelte-1kdn3pd");
    			add_location(div4, file$3, 167, 4, 7001);
    			attr_dev(path32, "id", "Vector");
    			attr_dev(path32, "d", "M130.453 180.178C199.998 180.178 256.375 176.642 256.375 172.279C256.375 167.916 199.998 164.38 130.453 164.38C60.9077 164.38 4.5304 167.916 4.5304 172.279C4.5304 176.642 60.9077 180.178 130.453 180.178Z");
    			attr_dev(path32, "fill", "#3F3D56");
    			add_location(path32, file$3, 255, 12, 12455);
    			attr_dev(path33, "id", "Vector_2");
    			attr_dev(path33, "d", "M9.67278 164.535C12.5603 169.89 18.6885 172.189 18.6885 172.189C18.6885 172.189 20.1353 165.805 17.2478 160.45C14.3603 155.095 8.23203 152.796 8.23203 152.796C8.23203 152.796 6.7853 159.18 9.67278 164.535Z");
    			attr_dev(path33, "fill", "#3F3D56");
    			add_location(path33, file$3, 259, 12, 12753);
    			attr_dev(path34, "id", "Vector_3");
    			attr_dev(path34, "d", "M11.6574 162.773C16.8705 165.909 18.8783 172.139 18.8783 172.139C18.8783 172.139 12.4339 173.283 7.22083 170.147C2.00773 167.011 0 160.781 0 160.781C0 160.781 6.44437 159.636 11.6574 162.773Z");
    			attr_dev(path34, "fill", "#1E77FD");
    			add_location(path34, file$3, 263, 12, 13055);
    			attr_dev(path35, "id", "Vector_4");
    			attr_dev(path35, "d", "M231.759 22.0857H25.4293V28.6499H231.759V22.0857Z");
    			attr_dev(path35, "fill", "#F2F2F2");
    			add_location(path35, file$3, 267, 12, 13343);
    			attr_dev(path36, "id", "Vector_5");
    			attr_dev(path36, "d", "M231.759 170.312H25.4293V126.031L48.2078 106.448L231.759 92.5305V170.312Z");
    			attr_dev(path36, "fill", "#1E77FD");
    			add_location(path36, file$3, 271, 12, 13489);
    			attr_dev(path37, "id", "Vector_6");
    			attr_dev(path37, "d", "M30.9508 26.97C31.889 26.97 32.6495 26.2095 32.6495 25.2712C32.6495 24.3329 31.889 23.5723 30.9508 23.5723C30.0125 23.5723 29.2518 24.3329 29.2518 25.2712C29.2518 26.2095 30.0125 26.97 30.9508 26.97Z");
    			attr_dev(path37, "fill", "#1E77FD");
    			add_location(path37, file$3, 275, 12, 13659);
    			attr_dev(path38, "id", "Vector_7");
    			attr_dev(path38, "d", "M36.472 26.97C37.4103 26.97 38.1708 26.2095 38.1708 25.2712C38.1708 24.3329 37.4103 23.5723 36.472 23.5723C35.5338 23.5723 34.773 24.3329 34.773 25.2712C34.773 26.2095 35.5338 26.97 36.472 26.97Z");
    			attr_dev(path38, "fill", "#1E77FD");
    			add_location(path38, file$3, 279, 12, 13955);
    			attr_dev(path39, "id", "Vector_8");
    			attr_dev(path39, "d", "M41.9933 26.97C42.9315 26.97 43.6923 26.2095 43.6923 25.2712C43.6923 24.3329 42.9315 23.5723 41.9933 23.5723C41.055 23.5723 40.2945 24.3329 40.2945 25.2712C40.2945 26.2095 41.055 26.97 41.9933 26.97Z");
    			attr_dev(path39, "fill", "#1E77FD");
    			add_location(path39, file$3, 283, 12, 14247);
    			attr_dev(path40, "id", "Vector_9");
    			attr_dev(path40, "d", "M231.634 92.2103L25.5543 125.782V28.775H231.634V92.2103Z");
    			attr_dev(path40, "fill", "white");
    			attr_dev(path40, "stroke", "#F2F2F2");
    			add_location(path40, file$3, 287, 12, 14543);
    			attr_dev(path41, "id", "Vector_10");
    			attr_dev(path41, "d", "M208.66 140.07C203.09 139.126 197.733 138.316 192.589 137.639L194.623 133.696C193.937 133.458 190.925 135.716 190.925 135.716L193.593 124.272C190.145 124.688 188.392 136.373 188.392 136.373L184.539 132.422L186.404 136.864C170.662 135.01 157.067 134.322 145.632 134.298L147.372 130.923C146.686 130.685 143.674 132.943 143.674 132.943L146.342 121.499C142.894 121.915 141.141 133.6 141.141 133.6L137.288 129.649L139.264 134.353C131.429 134.483 123.606 135.014 115.825 135.945C117.585 130.689 123.565 125.69 123.565 125.69C118.998 127.048 116.603 129.324 115.352 131.446C115.24 120.6 117.043 109.819 120.679 99.6007C120.679 99.6007 111.24 120.141 112.444 133.929L112.588 136.377C104.586 137.523 100.562 138.715 100.562 138.715L208.66 140.07Z");
    			attr_dev(path41, "fill", "#3F3D56");
    			add_location(path41, file$3, 292, 12, 14725);
    			attr_dev(path42, "id", "Vector_11");
    			attr_dev(path42, "d", "M97.9373 65.996H40.3198V68.3192H97.9373V65.996Z");
    			attr_dev(path42, "fill", "#3F3D56");
    			add_location(path42, file$3, 296, 12, 15560);
    			attr_dev(path43, "id", "Vector_12");
    			attr_dev(path43, "d", "M97.9373 71.1072H40.3198V73.4304H97.9373V71.1072Z");
    			attr_dev(path43, "fill", "#3F3D56");
    			add_location(path43, file$3, 300, 12, 15705);
    			attr_dev(path44, "id", "Vector_13");
    			attr_dev(path44, "d", "M59.8353 76.2185H40.3198V78.5418H59.8353V76.2185Z");
    			attr_dev(path44, "fill", "#3F3D56");
    			add_location(path44, file$3, 304, 12, 15852);
    			attr_dev(path45, "id", "Vector_14");
    			attr_dev(path45, "d", "M193.329 54.3054C204.924 54.3054 214.323 44.9057 214.323 33.3107C214.323 21.7156 204.924 12.3159 193.329 12.3159C181.733 12.3159 172.334 21.7156 172.334 33.3107C172.334 44.9057 181.733 54.3054 193.329 54.3054Z");
    			attr_dev(path45, "fill", "#FF6584");
    			add_location(path45, file$3, 308, 12, 15999);
    			attr_dev(path46, "id", "Vector_15");
    			attr_dev(path46, "d", "M207.942 58.6007C212.076 86.8085 196.749 99.1137 176.065 102.144C175.585 102.215 175.106 102.28 174.628 102.339C173.667 102.458 172.712 102.554 171.763 102.625C152.902 104.038 136.88 95.8102 133.036 69.577C129.058 42.429 158.734 3.0842 160.965 0.169678C160.968 0.169345 160.967 0.169345 160.969 0.166708C161.054 0.055678 161.098 0 161.098 0C161.098 0 203.809 30.3952 207.942 58.6007Z");
    			attr_dev(path46, "fill", "#1E77FD");
    			add_location(path46, file$3, 312, 12, 16306);
    			attr_dev(path47, "id", "Vector_16");
    			attr_dev(path47, "d", "M174.07 98.0294L184.964 76.8829L174.343 100.136L174.629 102.339C173.667 102.458 172.712 102.554 171.764 102.625L169.104 74.1889L169.061 73.9722L169.08 73.9272L168.83 71.2402L151.942 51.9642L168.578 69.2364L168.696 69.7969L166.686 48.3127L151.676 28.0362L166.282 44.5444L160.965 0.16963L160.948 0.0218506L160.97 0.16666L165.885 35.0554L175.59 19.5164L166.274 38.0649L168.761 57.2014L177.035 37.2747L169.129 60.0147L170.512 70.6554L182.678 42.8229L170.993 74.3679L174.07 98.0294Z");
    			attr_dev(path47, "fill", "#3F3D56");
    			add_location(path47, file$3, 316, 12, 16787);
    			attr_dev(g4, "id", "Group");
    			add_location(g4, file$3, 254, 10, 12428);
    			attr_dev(g5, "id", "Frontend 1");
    			add_location(g5, file$3, 253, 8, 12398);
    			attr_dev(svg2, "width", "171");
    			attr_dev(svg2, "height", "121");
    			attr_dev(svg2, "viewBox", "0 0 257 181");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$3, 247, 6, 12250);
    			attr_dev(h23, "class", "svelte-1kdn3pd");
    			add_location(h23, file$3, 323, 6, 17397);
    			attr_dev(div5, "class", "skillContainer svelte-1kdn3pd");
    			add_location(div5, file$3, 246, 4, 12215);
    			attr_dev(div6, "class", "skills svelte-1kdn3pd");
    			add_location(div6, file$3, 82, 2, 1498);
    			attr_dev(div7, "class", "pageContainer svelte-1kdn3pd");
    			add_location(div7, file$3, 72, 0, 1156);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h1);
    			append_dev(div1, t2);
    			append_dev(div1, h20);
    			append_dev(div1, t4);
    			append_dev(div1, h21);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			append_dev(div6, div3);
    			append_dev(div3, svg0);
    			append_dev(svg0, g1);
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
    			append_dev(div3, t7);
    			append_dev(div3, span0);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, span1);
    			append_dev(div2, t11);
    			append_dev(div2, span2);
    			append_dev(div6, t13);
    			append_dev(div6, div4);
    			append_dev(div4, svg1);
    			append_dev(svg1, g3);
    			append_dev(g3, g2);
    			append_dev(g2, path16);
    			append_dev(g2, path17);
    			append_dev(g2, path18);
    			append_dev(g2, path19);
    			append_dev(g2, path20);
    			append_dev(g2, path21);
    			append_dev(g2, path22);
    			append_dev(g2, path23);
    			append_dev(g2, path24);
    			append_dev(g2, path25);
    			append_dev(g2, path26);
    			append_dev(g2, path27);
    			append_dev(g2, path28);
    			append_dev(g2, path29);
    			append_dev(g2, path30);
    			append_dev(g2, path31);
    			append_dev(div4, t14);
    			append_dev(div4, h22);
    			append_dev(div6, t16);
    			append_dev(div6, div5);
    			append_dev(div5, svg2);
    			append_dev(svg2, g5);
    			append_dev(g5, g4);
    			append_dev(g4, path32);
    			append_dev(g4, path33);
    			append_dev(g4, path34);
    			append_dev(g4, path35);
    			append_dev(g4, path36);
    			append_dev(g4, path37);
    			append_dev(g4, path38);
    			append_dev(g4, path39);
    			append_dev(g4, path40);
    			append_dev(g4, path41);
    			append_dev(g4, path42);
    			append_dev(g4, path43);
    			append_dev(g4, path44);
    			append_dev(g4, path45);
    			append_dev(g4, path46);
    			append_dev(g4, path47);
    			append_dev(div5, t17);
    			append_dev(div5, h23);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
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

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Sections/Projects.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/Sections/Projects.svelte";

    function create_fragment$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Projects";
    			add_location(div, file$4, 5, 2, 22);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Sections/Contact.svelte generated by Svelte v3.29.4 */

    const file$5 = "src/Sections/Contact.svelte";

    function create_fragment$5(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Contact";
    			add_location(span, file$5, 3, 0, 18);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
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

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Section.svelte generated by Svelte v3.29.4 */

    const file$6 = "src/Section.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(div0, file$6, 20, 4, 288);
    			attr_dev(div1, "class", "marker");
    			add_location(div1, file$6, 19, 2, 263);
    			attr_dev(section, "class", "svelte-kx1zir");
    			toggle_class(section, "blue", /*isBlue*/ ctx[1]);
    			add_location(section, file$6, 18, 0, 231);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { id: 0, isBlue: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$6.name
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

    /* src/Rocket.svelte generated by Svelte v3.29.4 */

    const file$7 = "src/Rocket.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(path0, file$7, 68, 6, 1140);
    			attr_dev(path1, "id", "Vector_10");
    			attr_dev(path1, "d", "M453.006 535.105L452.999 495.104C452.998 489.581 457.474 485.103 462.997 485.102C468.519 485.1 472.996 489.577 472.998 495.1L473.005 535.101C473.007 540.624 468.53 545.102 463.007 545.103C457.487 545.104 453.007 540.63 453.006 535.105Z");
    			attr_dev(path1, "fill", path1_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path1, file$7, 72, 6, 1477);
    			attr_dev(path2, "id", "Vector_11");
    			attr_dev(path2, "d", "M312.995 555.106L313.002 650.898C313.002 656.421 308.525 660.898 303.002 660.898C297.481 660.9 293.002 656.423 293.002 650.899L292.995 555.107C292.994 549.584 297.471 545.107 302.994 545.107C308.515 545.105 312.993 549.583 312.995 555.106Z");
    			attr_dev(path2, "fill", path2_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path2, file$7, 76, 6, 1811);
    			attr_dev(path3, "id", "Vector_12");
    			attr_dev(path3, "d", "M369.563 611.674L369.57 707.466C369.571 712.989 365.094 717.467 359.571 717.467C354.05 717.468 349.57 712.991 349.57 707.468L349.563 611.676C349.563 606.153 354.04 601.675 359.563 601.675C365.084 601.675 369.562 606.153 369.563 611.674Z");
    			attr_dev(path3, "fill", path3_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path3, file$7, 80, 6, 2149);
    			attr_dev(path4, "id", "Vector_13");
    			attr_dev(path4, "d", "M412.998 650.898L413.005 555.106C413.006 549.583 417.482 545.106 423.006 545.106C428.527 545.106 433.005 549.584 433.005 555.106L432.998 650.898C432.998 656.421 428.521 660.898 422.997 660.898C417.475 660.898 412.997 656.421 412.998 650.898Z");
    			attr_dev(path4, "fill", path4_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path4, file$7, 84, 6, 2484);
    			attr_dev(g0, "id", "directionLines");
    			attr_dev(g0, "filter", "url(#filter4_d)");
    			attr_dev(g0, "class", "svelte-1j2qzve");
    			toggle_class(g0, "flyingLines", /*flying*/ ctx[0]);
    			add_location(g0, file$7, 67, 4, 1058);
    			attr_dev(path5, "d", "M393.002 455.284L333.35 455.284C327.014 465.905 323.175 479.913 323.175 495.285C323.175 528.42 363.176 575.28 363.176 575.28C363.176 575.28 403.177 528.42 403.177 495.285C403.177 479.913 399.337 465.905 393.002 455.284Z");
    			attr_dev(path5, "fill", path5_fill_value = /*flying*/ ctx[0] ? "#FFDD78" : "transparent");
    			add_location(path5, file$7, 90, 6, 2907);
    			attr_dev(g1, "id", "Flame");
    			attr_dev(g1, "filter", "url(#filter3_d)");
    			attr_dev(g1, "class", "svelte-1j2qzve");
    			toggle_class(g1, "pulsatingFlame", /*flying*/ ctx[0]);
    			add_location(g1, file$7, 89, 4, 2831);
    			attr_dev(path6, "d", "M363.176 15.28C363.176 15.28 326.477 54.7083 297.542 115.279L428.81 115.279C399.875 54.7083 363.176 15.28 363.176 15.28Z");
    			attr_dev(path6, "fill", "#FF5249");
    			add_location(path6, file$7, 95, 6, 3258);
    			attr_dev(g2, "id", "Vector");
    			attr_dev(g2, "filter", "url(#filter0_d)");
    			add_location(g2, file$7, 94, 4, 3211);
    			attr_dev(path7, "d", "M428.81 115.279L297.542 115.279C278.705 154.679 263.17 203.038 263.17 255.279C263.17 303.42 272.859 351.646 289.778 395.279L436.574 395.279C447.894 366.083 457.037 331.993 461.025 295.04C462.418 282.107 463.182 268.827 463.182 255.279C463.182 203.038 447.647 154.679 428.81 115.279Z");
    			attr_dev(path7, "fill", "#F2F2F2");
    			add_location(path7, file$7, 100, 6, 3485);
    			attr_dev(g3, "id", "Vector_2");
    			attr_dev(g3, "filter", "url(#filter1_d)");
    			add_location(g3, file$7, 99, 4, 3436);
    			attr_dev(path8, "id", "Vector_3");
    			attr_dev(path8, "d", "M363.176 175.284C341.086 175.284 323.175 193.195 323.175 215.285C323.175 237.375 341.079 255.279 363.176 255.286C385.273 255.279 403.177 237.375 403.177 215.285C403.177 193.195 385.266 175.284 363.176 175.284Z");
    			attr_dev(path8, "fill", "#7BD8E8");
    			add_location(path8, file$7, 104, 4, 3825);
    			attr_dev(path9, "id", "Vector_4");
    			attr_dev(path9, "d", "M263.177 295.28C172.066 313.502 204.954 417.058 243.173 455.277C243.173 415.283 274.858 395.279 274.858 395.279L289.778 395.279C278.457 366.083 269.315 331.993 265.326 295.04L263.177 295.28Z");
    			attr_dev(path9, "fill", "#FF5249");
    			add_location(path9, file$7, 109, 6, 4145);
    			attr_dev(path10, "id", "Vector_5");
    			attr_dev(path10, "d", "M393.002 455.284H395.293C402.06 455.277 408.629 452.032 412.079 446.205C420.614 431.773 429.071 414.604 436.574 395.279L289.778 395.279C297.281 414.604 305.738 431.773 314.272 446.205C317.723 452.032 324.292 455.277 331.059 455.284H333.35L393.002 455.284Z");
    			attr_dev(path10, "fill", "#FF5249");
    			add_location(path10, file$7, 113, 6, 4408);
    			attr_dev(path11, "id", "Vector_6");
    			attr_dev(path11, "d", "M463.175 295.28L461.025 295.04C457.037 331.993 447.894 366.083 436.574 395.279H451.494C451.494 395.279 483.179 415.283 483.179 455.277C521.398 417.058 554.286 313.502 463.175 295.28Z");
    			attr_dev(path11, "fill", "#FF5249");
    			add_location(path11, file$7, 117, 6, 4736);
    			attr_dev(g4, "id", "Group");
    			attr_dev(g4, "filter", "url(#filter2_d)");
    			add_location(g4, file$7, 108, 4, 4099);
    			attr_dev(path12, "id", "Vector_7");
    			attr_dev(path12, "d", "M352.994 355.101C353.001 349.579 357.477 345.103 362.992 345.103C368.522 345.103 372.998 349.579 372.998 355.108C372.998 360.624 368.522 365.1 362.999 365.107C357.477 365.1 353.001 360.624 352.994 355.101Z");
    			attr_dev(path12, "fill", "black");
    			add_location(path12, file$7, 122, 4, 4998);
    			attr_dev(path13, "id", "Vector_8");
    			attr_dev(path13, "d", "M312.998 215.108C312.998 187.477 335.363 165.107 362.999 165.107C390.632 165.108 413 187.475 413.001 215.109C413.001 242.671 390.572 265.101 362.996 265.109C335.433 265.101 312.998 242.677 312.998 215.108ZM393 215.108C393 198.53 379.581 185.107 362.999 185.107C346.421 185.107 332.998 198.527 332.999 215.108C332.998 231.645 346.457 245.104 362.997 245.109C379.541 245.104 393.001 231.646 393 215.108Z");
    			attr_dev(path13, "fill", "black");
    			add_location(path13, file$7, 126, 4, 5266);
    			attr_dev(path14, "id", "Vector_14");
    			attr_dev(path14, "d", "M352.999 315.1L352.999 295.103C352.999 289.581 357.477 285.103 363 285.103C368.523 285.103 372.999 289.579 373 295.103L373 315.1C373 320.623 368.523 325.1 363 325.101C357.477 325.1 353 320.624 352.999 315.1Z");
    			attr_dev(path14, "fill", "black");
    			add_location(path14, file$7, 130, 4, 5730);
    			attr_dev(g5, "id", "Rocket");
    			attr_dev(g5, "clip-path", "url(#clip0)");
    			add_location(g5, file$7, 66, 2, 1014);
    			attr_dev(feFlood0, "flood-opacity", "0");
    			attr_dev(feFlood0, "result", "BackgroundImageFix");
    			add_location(feFlood0, file$7, 144, 6, 6207);
    			attr_dev(feColorMatrix0, "in", "SourceAlpha");
    			attr_dev(feColorMatrix0, "type", "matrix");
    			attr_dev(feColorMatrix0, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix0, file$7, 145, 6, 6271);
    			attr_dev(feOffset0, "dy", "4");
    			add_location(feOffset0, file$7, 149, 6, 6401);
    			attr_dev(feGaussianBlur0, "stdDeviation", "2");
    			add_location(feGaussianBlur0, file$7, 150, 6, 6427);
    			attr_dev(feColorMatrix1, "type", "matrix");
    			attr_dev(feColorMatrix1, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix1, file$7, 151, 6, 6469);
    			attr_dev(feBlend0, "mode", "normal");
    			attr_dev(feBlend0, "in2", "BackgroundImageFix");
    			attr_dev(feBlend0, "result", "effect1_dropShadow");
    			add_location(feBlend0, file$7, 154, 6, 6575);
    			attr_dev(feBlend1, "mode", "normal");
    			attr_dev(feBlend1, "in", "SourceGraphic");
    			attr_dev(feBlend1, "in2", "effect1_dropShadow");
    			attr_dev(feBlend1, "result", "shape");
    			add_location(feBlend1, file$7, 158, 6, 6684);
    			attr_dev(filter0, "id", "filter0_d");
    			attr_dev(filter0, "x", "276.36");
    			attr_dev(filter0, "y", "15.28");
    			attr_dev(filter0, "width", "173.633");
    			attr_dev(filter0, "height", "173.633");
    			attr_dev(filter0, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter0, "color-interpolation-filters", "sRGB");
    			add_location(filter0, file$7, 136, 4, 6017);
    			attr_dev(feFlood1, "flood-opacity", "0");
    			attr_dev(feFlood1, "result", "BackgroundImageFix");
    			add_location(feFlood1, file$7, 172, 6, 7011);
    			attr_dev(feColorMatrix2, "in", "SourceAlpha");
    			attr_dev(feColorMatrix2, "type", "matrix");
    			attr_dev(feColorMatrix2, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix2, file$7, 173, 6, 7075);
    			attr_dev(feOffset1, "dy", "4");
    			add_location(feOffset1, file$7, 177, 6, 7205);
    			attr_dev(feGaussianBlur1, "stdDeviation", "2");
    			add_location(feGaussianBlur1, file$7, 178, 6, 7231);
    			attr_dev(feColorMatrix3, "type", "matrix");
    			attr_dev(feColorMatrix3, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix3, file$7, 179, 6, 7273);
    			attr_dev(feBlend2, "mode", "normal");
    			attr_dev(feBlend2, "in2", "BackgroundImageFix");
    			attr_dev(feBlend2, "result", "effect1_dropShadow");
    			add_location(feBlend2, file$7, 182, 6, 7379);
    			attr_dev(feBlend3, "mode", "normal");
    			attr_dev(feBlend3, "in", "SourceGraphic");
    			attr_dev(feBlend3, "in2", "effect1_dropShadow");
    			attr_dev(feBlend3, "result", "shape");
    			add_location(feBlend3, file$7, 186, 6, 7488);
    			attr_dev(filter1, "id", "filter1_d");
    			attr_dev(filter1, "x", "149.66");
    			attr_dev(filter1, "y", "49.6454");
    			attr_dev(filter1, "width", "427.031");
    			attr_dev(filter1, "height", "427.031");
    			attr_dev(filter1, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter1, "color-interpolation-filters", "sRGB");
    			add_location(filter1, file$7, 164, 4, 6819);
    			attr_dev(feFlood2, "flood-opacity", "0");
    			attr_dev(feFlood2, "result", "BackgroundImageFix");
    			add_location(feFlood2, file$7, 200, 6, 7816);
    			attr_dev(feColorMatrix4, "in", "SourceAlpha");
    			attr_dev(feColorMatrix4, "type", "matrix");
    			attr_dev(feColorMatrix4, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix4, file$7, 201, 6, 7880);
    			attr_dev(feOffset2, "dy", "4");
    			add_location(feOffset2, file$7, 205, 6, 8010);
    			attr_dev(feGaussianBlur2, "stdDeviation", "2");
    			add_location(feGaussianBlur2, file$7, 206, 6, 8036);
    			attr_dev(feColorMatrix5, "type", "matrix");
    			attr_dev(feColorMatrix5, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix5, file$7, 207, 6, 8078);
    			attr_dev(feBlend4, "mode", "normal");
    			attr_dev(feBlend4, "in2", "BackgroundImageFix");
    			attr_dev(feBlend4, "result", "effect1_dropShadow");
    			add_location(feBlend4, file$7, 210, 6, 8184);
    			attr_dev(feBlend5, "mode", "normal");
    			attr_dev(feBlend5, "in", "SourceGraphic");
    			attr_dev(feBlend5, "in2", "effect1_dropShadow");
    			attr_dev(feBlend5, "result", "shape");
    			add_location(feBlend5, file$7, 214, 6, 8293);
    			attr_dev(filter2, "id", "filter2_d");
    			attr_dev(filter2, "x", "158.792");
    			attr_dev(filter2, "y", "283.701");
    			attr_dev(filter2, "width", "408.767");
    			attr_dev(filter2, "height", "220.172");
    			attr_dev(filter2, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter2, "color-interpolation-filters", "sRGB");
    			add_location(filter2, file$7, 192, 4, 7623);
    			attr_dev(feFlood3, "flood-opacity", "0");
    			attr_dev(feFlood3, "result", "BackgroundImageFix");
    			add_location(feFlood3, file$7, 228, 6, 8621);
    			attr_dev(feColorMatrix6, "in", "SourceAlpha");
    			attr_dev(feColorMatrix6, "type", "matrix");
    			attr_dev(feColorMatrix6, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix6, file$7, 229, 6, 8685);
    			attr_dev(feOffset3, "dy", "4");
    			add_location(feOffset3, file$7, 233, 6, 8815);
    			attr_dev(feGaussianBlur3, "stdDeviation", "2");
    			add_location(feGaussianBlur3, file$7, 234, 6, 8841);
    			attr_dev(feColorMatrix7, "type", "matrix");
    			attr_dev(feColorMatrix7, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix7, file$7, 235, 6, 8883);
    			attr_dev(feBlend6, "mode", "normal");
    			attr_dev(feBlend6, "in2", "BackgroundImageFix");
    			attr_dev(feBlend6, "result", "effect1_dropShadow");
    			add_location(feBlend6, file$7, 238, 6, 8989);
    			attr_dev(feBlend7, "mode", "normal");
    			attr_dev(feBlend7, "in", "SourceGraphic");
    			attr_dev(feBlend7, "in2", "effect1_dropShadow");
    			attr_dev(feBlend7, "result", "shape");
    			add_location(feBlend7, file$7, 242, 6, 9098);
    			attr_dev(filter3, "id", "filter3_d");
    			attr_dev(filter3, "x", "284.265");
    			attr_dev(filter3, "y", "425.458");
    			attr_dev(filter3, "width", "157.822");
    			attr_dev(filter3, "height", "157.822");
    			attr_dev(filter3, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter3, "color-interpolation-filters", "sRGB");
    			add_location(filter3, file$7, 220, 4, 8428);
    			attr_dev(feFlood4, "flood-opacity", "0");
    			attr_dev(feFlood4, "result", "BackgroundImageFix");
    			add_location(feFlood4, file$7, 256, 6, 9425);
    			attr_dev(feColorMatrix8, "in", "SourceAlpha");
    			attr_dev(feColorMatrix8, "type", "matrix");
    			attr_dev(feColorMatrix8, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix8, file$7, 257, 6, 9489);
    			attr_dev(feOffset4, "dy", "4");
    			add_location(feOffset4, file$7, 261, 6, 9619);
    			attr_dev(feGaussianBlur4, "stdDeviation", "2");
    			add_location(feGaussianBlur4, file$7, 262, 6, 9645);
    			attr_dev(feColorMatrix9, "type", "matrix");
    			attr_dev(feColorMatrix9, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix9, file$7, 263, 6, 9687);
    			attr_dev(feBlend8, "mode", "normal");
    			attr_dev(feBlend8, "in2", "BackgroundImageFix");
    			attr_dev(feBlend8, "result", "effect1_dropShadow");
    			add_location(feBlend8, file$7, 266, 6, 9793);
    			attr_dev(feBlend9, "mode", "normal");
    			attr_dev(feBlend9, "in", "SourceGraphic");
    			attr_dev(feBlend9, "in2", "effect1_dropShadow");
    			attr_dev(feBlend9, "result", "shape");
    			add_location(feBlend9, file$7, 270, 6, 9902);
    			attr_dev(filter4, "id", "filter4_d");
    			attr_dev(filter4, "x", "224.855");
    			attr_dev(filter4, "y", "480.96");
    			attr_dev(filter4, "width", "276.289");
    			attr_dev(filter4, "height", "248.649");
    			attr_dev(filter4, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter4, "color-interpolation-filters", "sRGB");
    			add_location(filter4, file$7, 248, 4, 9233);
    			attr_dev(rect, "width", "512.001");
    			attr_dev(rect, "height", "512.001");
    			attr_dev(rect, "fill", "white");
    			attr_dev(rect, "transform", "matrix(-0.707107 -0.707107 -0.707107 0.707107 725.04 363)");
    			add_location(rect, file$7, 277, 6, 10065);
    			attr_dev(clipPath, "id", "clip0");
    			add_location(clipPath, file$7, 276, 4, 10037);
    			add_location(defs, file$7, 135, 2, 6006);
    			attr_dev(svg, "width", "75");
    			attr_dev(svg, "height", "75");
    			attr_dev(svg, "viewBox", "0 0 726 726");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1j2qzve");
    			add_location(svg, file$7, 59, 0, 879);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rocket",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file$8 = "src/App.svelte";

    // (52:0) {#if scrollTop > 160}
    function create_if_block(ctx) {
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
    			attr_dev(div, "class", "toTopButton svelte-10nuyk9");
    			add_location(div, file$8, 52, 2, 1157);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(52:0) {#if scrollTop > 160}",
    		ctx
    	});

    	return block;
    }

    // (58:0) <Section id="about" isBlue={false}>
    function create_default_slot_2(ctx) {
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(58:0) <Section id=\\\"about\\\" isBlue={false}>",
    		ctx
    	});

    	return block;
    }

    // (62:0) <Section id="projects" isBlue={true}>
    function create_default_slot_1(ctx) {
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(62:0) <Section id=\\\"projects\\\" isBlue={true}>",
    		ctx
    	});

    	return block;
    }

    // (66:0) <Section id="contact" isBlue={false}>
    function create_default_slot(ctx) {
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(66:0) <Section id=\\\"contact\\\" isBlue={false}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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
    	let mounted;
    	let dispose;
    	nav = new Nav({ $$inline: true });
    	home = new Home({ $$inline: true });
    	let if_block = /*scrollTop*/ ctx[0] > 160 && create_if_block(ctx);

    	section0 = new Section({
    			props: {
    				id: "about",
    				isBlue: false,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section1 = new Section({
    			props: {
    				id: "projects",
    				isBlue: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section2 = new Section({
    			props: {
    				id: "contact",
    				isBlue: false,
    				$$slots: { default: [create_default_slot] },
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
    			attr_dev(div, "class", "home svelte-10nuyk9");
    			add_location(div, file$8, 46, 0, 1085);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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

    			if (!mounted) {
    				dispose = listen_dev(window, "scroll", /*handleScroll*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*scrollTop*/ ctx[0] > 160) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*scrollTop*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
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
    			mounted = false;
    			dispose();
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

    function instance$8($$self, $$props, $$invalidate) {
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
    		console.log("handleScroll");
    		$$invalidate(0, scrollTop = document.documentElement.scrollTop);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		elasticOut,
    		bounceOut,
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
