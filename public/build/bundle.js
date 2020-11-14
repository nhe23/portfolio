
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
    			attr_dev(img, "class", "svelte-qcwfh4");
    			add_location(img, file, 34, 32, 471);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-qcwfh4");
    			add_location(a0, file, 34, 20, 459);
    			attr_dev(div0, "class", "logo svelte-qcwfh4");
    			add_location(div0, file, 34, 2, 441);
    			attr_dev(a1, "href", "#about");
    			attr_dev(a1, "class", "svelte-qcwfh4");
    			add_location(a1, file, 37, 4, 545);
    			attr_dev(a2, "href", "#projects");
    			attr_dev(a2, "class", "svelte-qcwfh4");
    			add_location(a2, file, 38, 4, 576);
    			attr_dev(a3, "href", "#contact");
    			attr_dev(a3, "class", "svelte-qcwfh4");
    			add_location(a3, file, 39, 4, 613);
    			attr_dev(div1, "class", "links svelte-qcwfh4");
    			add_location(div1, file, 36, 2, 521);
    			attr_dev(nav, "class", "svelte-qcwfh4");
    			add_location(nav, file, 33, 0, 433);
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

    /* src/Home.svelte generated by Svelte v3.29.4 */

    const { window: window_1 } = globals;
    const file$1 = "src/Home.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let div0;
    	let h1;
    	let t1;
    	let h2;
    	let div0_intro;
    	let t3;
    	let div1;
    	let svg;
    	let g6;
    	let g2;
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
    	let path16;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let path21;
    	let g1;
    	let path22;
    	let path23;
    	let path24;
    	let path25;
    	let path26;
    	let g4;
    	let path27;
    	let path28;
    	let path29;
    	let path30;
    	let path31;
    	let a0;
    	let g3;
    	let rect0;
    	let path32;
    	let a1;
    	let g5;
    	let rect1;
    	let path33;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Nathan Herrmann";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Fullstack Web Developer";
    			t3 = space();
    			div1 = element("div");
    			svg = svg_element("svg");
    			g6 = svg_element("g");
    			g2 = svg_element("g");
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
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			g1 = svg_element("g");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			path24 = svg_element("path");
    			path25 = svg_element("path");
    			path26 = svg_element("path");
    			g4 = svg_element("g");
    			path27 = svg_element("path");
    			path28 = svg_element("path");
    			path29 = svg_element("path");
    			path30 = svg_element("path");
    			path31 = svg_element("path");
    			a0 = svg_element("a");
    			g3 = svg_element("g");
    			rect0 = svg_element("rect");
    			path32 = svg_element("path");
    			a1 = svg_element("a");
    			g5 = svg_element("g");
    			rect1 = svg_element("rect");
    			path33 = svg_element("path");
    			attr_dev(h1, "class", "svelte-cvyb");
    			add_location(h1, file$1, 65, 4, 1192);
    			add_location(h2, file$1, 66, 4, 1221);
    			attr_dev(div0, "class", "description svelte-cvyb");
    			add_location(div0, file$1, 64, 2, 1154);
    			attr_dev(path0, "id", "Path 561");
    			attr_dev(path0, "d", "M500.209 22.7308L353.798 120.481C353.24 120.854 352.848 121.437 352.707 122.101C352.566 122.766 352.688 123.458 353.046 124.025L416.834 224.952C417.193 225.519 417.758 225.915 418.406 226.053C419.054 226.191 419.731 226.06 420.289 225.688L566.701 127.937C567.005 127.734 567.263 127.467 567.457 127.153C567.652 126.839 567.777 126.486 567.826 126.119C567.831 126.089 567.834 126.059 567.835 126.03C567.861 125.789 567.852 125.545 567.808 125.308C567.751 124.98 567.631 124.667 567.454 124.389L503.668 23.4643C503.308 22.8969 502.742 22.5008 502.094 22.3633C501.445 22.2257 500.767 22.3579 500.209 22.7308ZM566.854 124.793C567.043 125.091 567.141 125.441 567.136 125.798C567.13 126.113 567.047 126.422 566.895 126.698C566.753 126.952 566.554 127.167 566.315 127.327L419.903 225.077C419.505 225.342 419.021 225.436 418.558 225.338C418.095 225.239 417.691 224.956 417.434 224.551L353.647 123.624C353.391 123.219 353.304 122.724 353.405 122.25C353.505 121.775 353.785 121.359 354.184 121.092L500.595 23.3418C500.994 23.0755 501.478 22.9812 501.942 23.0794C502.405 23.1777 502.81 23.4605 503.067 23.8658L566.854 124.793Z");
    			attr_dev(path0, "fill", "#3F3D56");
    			add_location(path0, file$1, 78, 12, 1540);
    			attr_dev(path1, "id", "Rectangle 99");
    			attr_dev(path1, "d", "M507 30.1449L357.451 129.783L357.837 130.392L507.386 30.7534L507 30.1449Z");
    			attr_dev(path1, "fill", "#3F3D56");
    			add_location(path1, file$1, 82, 12, 2752);
    			attr_dev(path2, "id", "Ellipse 88");
    			attr_dev(path2, "d", "M361.169 124.211C362.166 123.545 362.454 122.183 361.813 121.169C361.172 120.154 359.844 119.871 358.847 120.537C357.85 121.203 357.561 122.565 358.202 123.58C358.843 124.594 360.171 124.877 361.169 124.211Z");
    			attr_dev(path2, "fill", "#3F3D56");
    			add_location(path2, file$1, 86, 12, 2926);
    			attr_dev(path3, "id", "Ellipse 89");
    			attr_dev(path3, "d", "M366.338 120.767C367.335 120.101 367.624 118.739 366.983 117.724C366.342 116.71 365.014 116.427 364.017 117.093C363.019 117.759 362.731 119.121 363.372 120.135C364.013 121.15 365.341 121.433 366.338 120.767Z");
    			attr_dev(path3, "fill", "#3F3D56");
    			add_location(path3, file$1, 90, 12, 3232);
    			attr_dev(path4, "id", "Ellipse 90");
    			attr_dev(path4, "d", "M371.508 117.323C372.505 116.657 372.794 115.295 372.153 114.28C371.512 113.266 370.183 112.983 369.186 113.649C368.189 114.315 367.9 115.677 368.542 116.691C369.183 117.706 370.511 117.988 371.508 117.323Z");
    			attr_dev(path4, "fill", "#3F3D56");
    			add_location(path4, file$1, 94, 12, 3538);
    			attr_dev(path5, "id", "Path 583");
    			attr_dev(path5, "d", "M430.703 124.816L392.869 150.039C392.382 150.35 391.796 150.454 391.237 150.33C390.679 150.205 390.193 149.861 389.883 149.372C389.573 148.883 389.465 148.287 389.581 147.713C389.697 147.139 390.028 146.632 390.504 146.301L428.337 121.078C428.825 120.767 429.411 120.662 429.97 120.787C430.528 120.911 431.014 121.255 431.324 121.744C431.633 122.234 431.742 122.829 431.626 123.404C431.51 123.978 431.179 124.485 430.703 124.816Z");
    			attr_dev(path5, "fill", "white");
    			add_location(path5, file$1, 98, 12, 3843);
    			attr_dev(path6, "id", "Path 584");
    			attr_dev(path6, "d", "M455.068 110.899L390.145 154.156C390.081 154.198 390.004 154.213 389.93 154.198C389.856 154.182 389.791 154.137 389.75 154.072C389.709 154.007 389.695 153.928 389.711 153.853C389.728 153.777 389.772 153.71 389.836 153.668L454.759 110.411C454.823 110.369 454.9 110.354 454.974 110.369C455.049 110.385 455.113 110.43 455.154 110.495C455.195 110.56 455.209 110.639 455.193 110.714C455.177 110.79 455.132 110.857 455.068 110.899Z");
    			attr_dev(path6, "fill", "#3F3D56");
    			add_location(path6, file$1, 102, 12, 4367);
    			attr_dev(path7, "id", "Path 585");
    			attr_dev(path7, "d", "M440.708 140.612L402.874 165.835C402.386 166.146 401.8 166.251 401.242 166.126C400.684 166.002 400.198 165.658 399.888 165.168C399.578 164.679 399.47 164.083 399.586 163.509C399.702 162.935 400.033 162.428 400.509 162.097L438.342 136.874C438.83 136.563 439.416 136.458 439.974 136.583C440.533 136.708 441.019 137.051 441.328 137.541C441.638 138.03 441.747 138.626 441.631 139.2C441.514 139.774 441.183 140.281 440.708 140.612Z");
    			attr_dev(path7, "fill", "white");
    			add_location(path7, file$1, 106, 12, 4889);
    			attr_dev(path8, "id", "Path 586");
    			attr_dev(path8, "d", "M465.072 126.695L400.149 169.951C400.085 169.994 400.008 170.009 399.934 169.993C399.86 169.977 399.795 169.932 399.754 169.867C399.713 169.803 399.699 169.724 399.715 169.648C399.731 169.572 399.776 169.506 399.84 169.463L464.763 126.206C464.827 126.164 464.904 126.149 464.978 126.165C465.052 126.18 465.117 126.226 465.158 126.29C465.199 126.355 465.213 126.434 465.197 126.51C465.181 126.586 465.136 126.652 465.072 126.695Z");
    			attr_dev(path8, "fill", "#3F3D56");
    			add_location(path8, file$1, 110, 12, 5410);
    			attr_dev(path9, "id", "Path 587");
    			attr_dev(path9, "d", "M450.711 156.406L412.877 181.629C412.389 181.94 411.803 182.045 411.245 181.92C410.687 181.796 410.201 181.452 409.891 180.962C409.581 180.473 409.473 179.877 409.589 179.303C409.705 178.729 410.036 178.222 410.511 177.891L448.345 152.668C448.833 152.357 449.419 152.252 449.977 152.377C450.536 152.502 451.022 152.845 451.331 153.335C451.641 153.824 451.75 154.42 451.634 154.994C451.518 155.568 451.186 156.075 450.711 156.406Z");
    			attr_dev(path9, "fill", "#F2F2F2");
    			add_location(path9, file$1, 114, 12, 5935);
    			attr_dev(path10, "id", "Path 588");
    			attr_dev(path10, "d", "M475.076 142.49L410.153 185.746C410.089 185.789 410.012 185.804 409.938 185.788C409.864 185.772 409.799 185.727 409.758 185.662C409.717 185.598 409.703 185.519 409.719 185.443C409.735 185.367 409.78 185.301 409.844 185.258L474.767 142.001C474.831 141.959 474.908 141.944 474.982 141.96C475.056 141.975 475.121 142.021 475.162 142.085C475.203 142.15 475.217 142.229 475.201 142.305C475.185 142.381 475.14 142.447 475.076 142.49Z");
    			attr_dev(path10, "fill", "#3F3D56");
    			add_location(path10, file$1, 118, 12, 6461);
    			attr_dev(g0, "id", "Group 20");
    			add_location(g0, file$1, 77, 10, 1510);
    			attr_dev(path11, "id", "Path 552");
    			attr_dev(path11, "d", "M229.521 120.961C229.947 121.16 230.357 121.395 230.746 121.662L269.683 104.618L271.072 94.0979L286.63 94L285.71 118.129L234.319 132.07C234.211 132.436 234.081 132.795 233.93 133.145C233.187 134.772 231.992 136.136 230.496 137.068C228.999 138 227.267 138.458 225.517 138.383C223.768 138.309 222.079 137.706 220.662 136.65C219.246 135.595 218.165 134.133 217.555 132.45C216.946 130.766 216.835 128.935 217.237 127.187C217.639 125.439 218.535 123.852 219.814 122.625C221.092 121.398 222.696 120.585 224.423 120.29C226.15 119.994 227.924 120.229 229.521 120.964V120.961Z");
    			attr_dev(path11, "fill", "#CAA0A6");
    			add_location(path11, file$1, 123, 10, 6998);
    			attr_dev(path12, "id", "Path 553");
    			attr_dev(path12, "d", "M286.918 342.546H276.275L271.212 300.443H286.919L286.918 342.546Z");
    			attr_dev(path12, "fill", "#CAA0A6");
    			add_location(path12, file$1, 127, 10, 7654);
    			attr_dev(path13, "id", "Path 554");
    			attr_dev(path13, "d", "M268.673 339.427H289.198V352.678H255.749C255.749 349.162 257.111 345.791 259.534 343.305C261.958 340.82 265.245 339.423 268.673 339.423V339.427Z");
    			attr_dev(path13, "fill", "#2F2E41");
    			add_location(path13, file$1, 131, 10, 7808);
    			attr_dev(path14, "id", "Path 555");
    			attr_dev(path14, "d", "M328.309 339.462L317.718 340.531L308.654 299.14L324.286 297.56L328.309 339.462Z");
    			attr_dev(path14, "fill", "#CAA0A6");
    			add_location(path14, file$1, 135, 10, 8041);
    			attr_dev(path15, "id", "Path 556");
    			attr_dev(path15, "d", "M309.851 338.198L330.278 336.134L331.544 349.325L298.257 352.688C297.921 349.189 298.954 345.697 301.129 342.98C303.303 340.262 306.441 338.542 309.852 338.198L309.851 338.198Z");
    			attr_dev(path15, "fill", "#2F2E41");
    			add_location(path15, file$1, 139, 10, 8209);
    			attr_dev(path16, "id", "Ellipse 84");
    			attr_dev(path16, "d", "M289.88 52.3914C301.656 52.3914 311.202 42.6007 311.202 30.5233C311.202 18.4459 301.656 8.65525 289.88 8.65525C278.105 8.65525 268.559 18.4459 268.559 30.5233C268.559 42.6007 278.105 52.3914 289.88 52.3914Z");
    			attr_dev(path16, "fill", "#CAA0A6");
    			add_location(path16, file$1, 143, 10, 8474);
    			attr_dev(path17, "id", "Path 557");
    			attr_dev(path17, "d", "M273.896 334.032C272.981 334.034 272.095 333.705 271.394 333.102C270.692 332.499 270.221 331.662 270.063 330.738C264.559 299.38 246.548 196.826 246.118 193.985C246.108 193.919 246.103 193.853 246.104 193.787V186.141C246.103 185.862 246.188 185.591 246.346 185.364L248.724 181.947C248.838 181.783 248.986 181.647 249.158 181.551C249.33 181.454 249.522 181.4 249.718 181.391C263.279 180.739 307.693 178.827 309.839 181.577C311.994 184.337 311.232 192.713 311.055 194.362L311.063 194.534L331.017 325.417C331.173 326.461 330.922 327.526 330.319 328.381C329.715 329.237 328.807 329.814 327.792 329.989L315.329 332.094C314.401 332.247 313.45 332.053 312.65 331.548C311.849 331.043 311.252 330.259 310.967 329.341C307.112 316.708 294.187 274.211 289.708 257.767C289.679 257.664 289.615 257.575 289.527 257.516C289.439 257.457 289.333 257.433 289.229 257.448C289.125 257.463 289.03 257.517 288.962 257.598C288.893 257.679 288.856 257.784 288.856 257.891C289.08 273.567 289.621 313.559 289.811 327.372L289.831 328.86C289.839 329.867 289.479 330.841 288.821 331.589C288.163 332.336 287.256 332.804 286.278 332.898L274.261 334.015C274.139 334.027 274.021 334.032 273.896 334.032Z");
    			attr_dev(path17, "fill", "#2F2E41");
    			add_location(path17, file$1, 147, 10, 8771);
    			attr_dev(path18, "id", "Path 99");
    			attr_dev(path18, "d", "M276.348 60.9905C272.628 63.2591 270.401 67.4278 269.123 71.6748C266.758 79.5287 265.334 87.6489 264.883 95.856L263.533 120.43L246.817 185.577C261.305 198.15 269.661 195.292 289.164 185.008C308.667 174.725 310.895 188.437 310.895 188.437L314.794 133.005L320.366 72.4325C319.115 70.8878 317.699 69.4919 316.145 68.2709C310.995 64.1629 305.004 61.3073 298.621 59.9192C292.239 58.5311 285.633 58.6469 279.301 60.2577L276.348 60.9905Z");
    			attr_dev(path18, "fill", "white");
    			add_location(path18, file$1, 151, 10, 10028);
    			attr_dev(path19, "id", "Path 558");
    			attr_dev(path19, "d", "M270.919 137.068C271.369 137.24 271.804 137.449 272.222 137.691L310.72 117.925L311.359 107.218L327.24 106.095L328.091 130.502L276.642 147.953C276.222 149.803 275.263 151.477 273.893 152.754C272.523 154.03 270.806 154.849 268.971 155.1C267.136 155.352 265.27 155.024 263.621 154.161C261.972 153.298 260.619 151.941 259.74 150.269C258.862 148.598 258.501 146.692 258.704 144.805C258.908 142.918 259.667 141.139 260.881 139.705C262.094 138.271 263.705 137.251 265.498 136.779C267.291 136.306 269.182 136.406 270.918 137.063L270.919 137.068Z");
    			attr_dev(path19, "fill", "#CAA0A6");
    			add_location(path19, file$1, 155, 10, 10544);
    			attr_dev(path20, "id", "Path 101");
    			attr_dev(path20, "d", "M320.088 72.7049C329.56 76.1337 331.229 113.282 331.229 113.282C320.085 106.996 306.713 117.282 306.713 117.282C306.713 117.282 303.927 107.567 300.584 94.995C299.575 91.4587 299.454 87.7179 300.233 84.1209C301.013 80.5238 302.666 77.1875 305.041 74.4224C305.041 74.4224 310.615 69.2744 320.088 72.7049Z");
    			attr_dev(path20, "fill", "white");
    			add_location(path20, file$1, 159, 10, 11170);
    			attr_dev(path21, "id", "Path 102");
    			attr_dev(path21, "d", "M308.998 36.3071C306.342 34.1275 302.717 38.0878 302.717 38.0878L300.592 18.4723C300.592 18.4723 287.31 20.1044 278.808 17.9274C270.306 15.7505 268.978 25.8294 268.978 25.8294C268.54 21.7582 268.451 17.6554 268.713 13.5683C269.244 8.66417 276.151 3.75919 288.371 0.489799C300.591 -2.77959 306.967 11.3887 306.967 11.3887C315.469 15.747 311.654 38.4867 308.998 36.3071Z");
    			attr_dev(path21, "fill", "#E6C412");
    			add_location(path21, file$1, 163, 10, 11560);
    			attr_dev(path22, "id", "Path 561_2");
    			attr_dev(path22, "d", "M564.959 226.973H391.003C390.34 226.974 389.705 227.244 389.236 227.725C388.767 228.205 388.504 228.857 388.503 229.537V350.436C388.504 351.115 388.767 351.767 389.236 352.248C389.705 352.728 390.34 352.999 391.003 352.999H564.959C565.32 352.999 565.677 352.919 566.005 352.763C566.334 352.608 566.625 352.382 566.859 352.1C566.879 352.078 566.898 352.054 566.914 352.029C567.064 351.841 567.184 351.631 567.273 351.406C567.398 351.098 567.463 350.767 567.462 350.433V229.537C567.461 228.856 567.197 228.204 566.728 227.724C566.258 227.243 565.622 226.973 564.959 226.973ZM566.747 350.436C566.748 350.793 566.645 351.143 566.452 351.441C566.281 351.703 566.048 351.917 565.776 352.064C565.523 352.198 565.243 352.268 564.959 352.267H391.003C390.529 352.267 390.075 352.074 389.741 351.73C389.406 351.387 389.217 350.921 389.217 350.436V229.537C389.217 229.051 389.406 228.586 389.741 228.242C390.075 227.899 390.529 227.706 391.003 227.705H564.959C565.433 227.705 565.887 227.898 566.223 228.242C566.558 228.585 566.747 229.051 566.747 229.537V350.436Z");
    			attr_dev(path22, "fill", "#3F3D56");
    			add_location(path22, file$1, 168, 12, 12053);
    			attr_dev(path23, "id", "Rectangle 99_2");
    			attr_dev(path23, "d", "M567.101 237.246H388.859V237.979H567.101V237.246Z");
    			attr_dev(path23, "fill", "#3F3D56");
    			add_location(path23, file$1, 172, 12, 13204);
    			attr_dev(path24, "id", "Ellipse 88_2");
    			attr_dev(path24, "d", "M394.932 234.667C396.116 234.667 397.075 233.683 397.075 232.469C397.075 231.255 396.116 230.27 394.932 230.27C393.748 230.27 392.788 231.255 392.788 232.469C392.788 233.683 393.748 234.667 394.932 234.667Z");
    			attr_dev(path24, "fill", "#3F3D56");
    			add_location(path24, file$1, 176, 12, 13356);
    			attr_dev(path25, "id", "Ellipse 89_2");
    			attr_dev(path25, "d", "M401.094 234.667C402.277 234.667 403.237 233.683 403.237 232.469C403.237 231.255 402.277 230.27 401.094 230.27C399.91 230.27 398.95 231.255 398.95 232.469C398.95 233.683 399.91 234.667 401.094 234.667Z");
    			attr_dev(path25, "fill", "#3F3D56");
    			add_location(path25, file$1, 180, 12, 13663);
    			attr_dev(path26, "id", "Ellipse 90_2");
    			attr_dev(path26, "d", "M407.255 234.667C408.439 234.667 409.399 233.683 409.399 232.469C409.399 231.255 408.439 230.27 407.255 230.27C406.072 230.27 405.112 231.255 405.112 232.469C405.112 233.683 406.072 234.667 407.255 234.667Z");
    			attr_dev(path26, "fill", "#3F3D56");
    			add_location(path26, file$1, 184, 12, 13965);
    			attr_dev(g1, "id", "linkedinWindow");
    			add_location(g1, file$1, 167, 10, 12017);
    			attr_dev(g2, "id", "Group 22");
    			add_location(g2, file$1, 76, 8, 1482);
    			attr_dev(path27, "id", "Path 561_3");
    			attr_dev(path27, "d", "M212.163 105.885H3.45846C2.66343 105.886 1.90117 106.21 1.339 106.786C0.776836 107.363 0.460712 108.145 0.460022 108.96V254.009C0.460712 254.825 0.776836 255.606 1.339 256.183C1.90117 256.76 2.66343 257.084 3.45846 257.085H212.163C212.597 257.085 213.025 256.988 213.419 256.802C213.812 256.615 214.162 256.344 214.443 256.005C214.467 255.979 214.488 255.951 214.508 255.921C214.689 255.697 214.835 255.446 214.942 255.177C215.093 254.807 215.17 254.41 215.169 254.009V108.96C215.168 108.556 215.09 108.156 214.939 107.782C214.788 107.409 214.566 107.07 214.287 106.784C214.008 106.498 213.677 106.272 213.312 106.118C212.948 105.963 212.558 105.884 212.163 105.885ZM214.309 254.009C214.31 254.438 214.186 254.858 213.955 255.216C213.749 255.53 213.47 255.788 213.143 255.964C212.84 256.124 212.504 256.207 212.163 256.207H3.45846C2.89067 256.206 2.34636 255.974 1.94487 255.563C1.54339 255.151 1.31753 254.592 1.31684 254.01V108.96C1.31753 108.378 1.54339 107.82 1.94487 107.408C2.34636 106.996 2.89067 106.764 3.45846 106.764H212.163C212.732 106.764 213.277 106.995 213.68 107.407C214.082 107.819 214.309 108.378 214.309 108.961V254.009Z");
    			attr_dev(path27, "fill", "#3F3D56");
    			add_location(path27, file$1, 191, 10, 14328);
    			attr_dev(path28, "id", "Rectangle 99_3");
    			attr_dev(path28, "d", "M214.735 118.209H0.887131V119.088H214.735V118.209Z");
    			attr_dev(path28, "fill", "#3F3D56");
    			add_location(path28, file$1, 195, 10, 15558);
    			attr_dev(path29, "id", "Ellipse 88_3");
    			attr_dev(path29, "d", "M8.17227 115.115C9.59238 115.115 10.7436 113.935 10.7436 112.478C10.7436 111.022 9.59238 109.841 8.17227 109.841C6.75217 109.841 5.60094 111.022 5.60094 112.478C5.60094 113.935 6.75217 115.115 8.17227 115.115Z");
    			attr_dev(path29, "fill", "#3F3D56");
    			add_location(path29, file$1, 199, 10, 15703);
    			attr_dev(path30, "id", "Ellipse 89_3");
    			attr_dev(path30, "d", "M15.5651 115.115C16.9852 115.115 18.1364 113.935 18.1364 112.478C18.1364 111.022 16.9852 109.841 15.5651 109.841C14.145 109.841 12.9937 111.022 12.9937 112.478C12.9937 113.935 14.145 115.115 15.5651 115.115Z");
    			attr_dev(path30, "fill", "#3F3D56");
    			add_location(path30, file$1, 203, 10, 16005);
    			attr_dev(path31, "id", "Ellipse 90_3");
    			attr_dev(path31, "d", "M22.9579 115.115C24.378 115.115 25.5292 113.935 25.5292 112.478C25.5292 111.022 24.378 109.841 22.9579 109.841C21.5378 109.841 20.3865 111.022 20.3865 112.478C20.3865 113.935 21.5378 115.115 22.9579 115.115Z");
    			attr_dev(path31, "fill", "#3F3D56");
    			add_location(path31, file$1, 207, 10, 16305);
    			attr_dev(rect0, "width", "75");
    			attr_dev(rect0, "height", "75");
    			attr_dev(rect0, "transform", "translate(70 148)");
    			attr_dev(rect0, "fill", "transparent");
    			add_location(rect0, file$1, 213, 14, 16699);
    			attr_dev(path32, "id", "Vector");
    			attr_dev(path32, "fill-rule", "evenodd");
    			attr_dev(path32, "clip-rule", "evenodd");
    			attr_dev(path32, "d", "M107.5 148C86.7812 148 70 164.781 70 185.5C70 202.094 80.7344 216.109 95.6406 221.078C97.5156 221.406 98.2188 220.281 98.2188 219.297C98.2188 218.406 98.1719 215.453 98.1719 212.312C88.75 214.047 86.3125 210.016 85.5625 207.906C85.1406 206.828 83.3125 203.5 81.7188 202.609C80.4062 201.906 78.5312 200.172 81.6719 200.125C84.625 200.078 86.7344 202.844 87.4375 203.969C90.8125 209.641 96.2031 208.047 98.3594 207.062C98.6875 204.625 99.6719 202.984 100.75 202.047C92.4062 201.109 83.6875 197.875 83.6875 183.531C83.6875 179.453 85.1406 176.078 87.5312 173.453C87.1562 172.516 85.8438 168.672 87.9062 163.516C87.9062 163.516 91.0469 162.531 98.2188 167.359C101.219 166.516 104.406 166.094 107.594 166.094C110.781 166.094 113.969 166.516 116.969 167.359C124.141 162.484 127.281 163.516 127.281 163.516C129.344 168.672 128.031 172.516 127.656 173.453C130.047 176.078 131.5 179.406 131.5 183.531C131.5 197.922 122.734 201.109 114.391 202.047C115.75 203.219 116.922 205.469 116.922 208.984C116.922 214 116.875 218.031 116.875 219.297C116.875 220.281 117.578 221.453 119.453 221.078C126.898 218.565 133.366 213.781 137.949 207.398C142.532 201.016 144.998 193.357 145 185.5C145 164.781 128.219 148 107.5 148Z");
    			attr_dev(path32, "fill", "white");
    			add_location(path32, file$1, 218, 14, 16858);
    			attr_dev(g3, "id", "github");
    			attr_dev(g3, "class", "svelte-cvyb");
    			add_location(g3, file$1, 212, 12, 16669);
    			attr_dev(a0, "href", "https://github.com/nhe23");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$1, 211, 10, 16605);
    			attr_dev(g4, "id", "githubWindow");
    			add_location(g4, file$1, 190, 8, 14296);
    			attr_dev(rect1, "width", "50");
    			attr_dev(rect1, "height", "50");
    			attr_dev(rect1, "transform", "translate(453 271)");
    			attr_dev(rect1, "fill", "transparent");
    			add_location(rect1, file$1, 231, 12, 18411);
    			attr_dev(path33, "id", "Vector_2");
    			attr_dev(path33, "d", "M492.583 271H463.417C457.665 271 453 275.665 453 281.417V310.583C453 316.335 457.665 321 463.417 321H492.583C498.337 321 503 316.335 503 310.583V281.417C503 275.665 498.337 271 492.583 271ZM469.667 310.583H463.417V287.667H469.667V310.583ZM466.542 285.025C464.529 285.025 462.896 283.379 462.896 281.35C462.896 279.321 464.529 277.675 466.542 277.675C468.554 277.675 470.187 279.321 470.187 281.35C470.187 283.379 468.556 285.025 466.542 285.025ZM494.667 310.583H488.417V298.908C488.417 291.892 480.083 292.423 480.083 298.908V310.583H473.833V287.667H480.083V291.344C482.992 285.956 494.667 285.558 494.667 296.502V310.583Z");
    			attr_dev(path33, "fill", "white");
    			add_location(path33, file$1, 236, 12, 18561);
    			attr_dev(g5, "id", "linkedin");
    			attr_dev(g5, "class", "svelte-cvyb");
    			add_location(g5, file$1, 230, 10, 18381);
    			attr_dev(a1, "href", "https://de.linkedin.com/in/nathan-herrmann-56802b1a1");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$1, 227, 8, 18271);
    			attr_dev(g6, "id", "illustration");
    			add_location(g6, file$1, 75, 6, 1452);
    			attr_dev(svg, "width", /*svgWidth*/ ctx[0]);
    			attr_dev(svg, "height", /*svgHeight*/ ctx[1]);
    			attr_dev(svg, "viewBox", "0 0 569 353");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-cvyb");
    			add_location(svg, file$1, 69, 4, 1305);
    			attr_dev(div1, "class", "illustrationContainer svelte-cvyb");
    			add_location(div1, file$1, 68, 2, 1265);
    			attr_dev(section, "class", "svelte-cvyb");
    			add_location(section, file$1, 63, 0, 1142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, h2);
    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, svg);
    			append_dev(svg, g6);
    			append_dev(g6, g2);
    			append_dev(g2, g0);
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
    			append_dev(g2, path11);
    			append_dev(g2, path12);
    			append_dev(g2, path13);
    			append_dev(g2, path14);
    			append_dev(g2, path15);
    			append_dev(g2, path16);
    			append_dev(g2, path17);
    			append_dev(g2, path18);
    			append_dev(g2, path19);
    			append_dev(g2, path20);
    			append_dev(g2, path21);
    			append_dev(g2, g1);
    			append_dev(g1, path22);
    			append_dev(g1, path23);
    			append_dev(g1, path24);
    			append_dev(g1, path25);
    			append_dev(g1, path26);
    			append_dev(g6, g4);
    			append_dev(g4, path27);
    			append_dev(g4, path28);
    			append_dev(g4, path29);
    			append_dev(g4, path30);
    			append_dev(g4, path31);
    			append_dev(g4, a0);
    			append_dev(a0, g3);
    			append_dev(g3, rect0);
    			append_dev(g3, path32);
    			append_dev(g6, a1);
    			append_dev(a1, g5);
    			append_dev(g5, rect1);
    			append_dev(g5, path33);

    			if (!mounted) {
    				dispose = listen_dev(window_1, "resize", /*handleResize*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*svgWidth*/ 1) {
    				attr_dev(svg, "width", /*svgWidth*/ ctx[0]);
    			}

    			if (dirty & /*svgHeight*/ 2) {
    				attr_dev(svg, "height", /*svgHeight*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, fade, {});
    					div0_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
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
    	validate_slots("Home", slots, []);
    	let windowWidth = window.innerWidth;

    	const handleResize = e => {
    		$$invalidate(3, windowWidth = e.target.innerWidth);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		windowWidth,
    		handleResize,
    		svgWidth,
    		svgHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("windowWidth" in $$props) $$invalidate(3, windowWidth = $$props.windowWidth);
    		if ("svgWidth" in $$props) $$invalidate(0, svgWidth = $$props.svgWidth);
    		if ("svgHeight" in $$props) $$invalidate(1, svgHeight = $$props.svgHeight);
    	};

    	let svgWidth;
    	let svgHeight;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*windowWidth*/ 8) {
    			 $$invalidate(0, svgWidth = windowWidth > 600
    			? 569
    			: windowWidth > 450
    				? 569 / 3 * 2
    				: windowWidth > 340 ? 569 / 20 * 11 : 569 / 3);
    		}

    		if ($$self.$$.dirty & /*windowWidth*/ 8) {
    			 $$invalidate(1, svgHeight = windowWidth > 600
    			? 353
    			: windowWidth > 450
    				? 353 / 3 * 2
    				: windowWidth > 340 ? 353 / 20 * 11 : 353 / 3);
    		}
    	};

    	return [svgWidth, svgHeight, handleResize];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Sections/About.svelte generated by Svelte v3.29.4 */

    const file$2 = "src/Sections/About.svelte";

    function create_fragment$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "This is about";
    			add_location(span, file$2, 3, 0, 18);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Sections/Projects.svelte generated by Svelte v3.29.4 */

    const file$3 = "src/Sections/Projects.svelte";

    function create_fragment$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Projects";
    			add_location(div, file$3, 5, 2, 22);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Sections/Contact.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/Sections/Contact.svelte";

    function create_fragment$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Contact";
    			add_location(span, file$4, 3, 0, 18);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Section.svelte generated by Svelte v3.29.4 */

    const file$5 = "src/Section.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let div;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			add_location(div, file$5, 19, 2, 268);
    			attr_dev(section, "class", "marker svelte-1rcbr80");
    			toggle_class(section, "blue", /*isBlue*/ ctx[1]);
    			add_location(section, file$5, 18, 0, 221);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(section, t);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { id: 0, isBlue: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$5.name
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

    const file$6 = "src/Rocket.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(path0, file$6, 68, 6, 1141);
    			attr_dev(path1, "id", "Vector_10");
    			attr_dev(path1, "d", "M453.006 535.105L452.999 495.104C452.998 489.581 457.474 485.103 462.997 485.102C468.519 485.1 472.996 489.577 472.998 495.1L473.005 535.101C473.007 540.624 468.53 545.102 463.007 545.103C457.487 545.104 453.007 540.63 453.006 535.105Z");
    			attr_dev(path1, "fill", path1_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path1, file$6, 72, 6, 1478);
    			attr_dev(path2, "id", "Vector_11");
    			attr_dev(path2, "d", "M312.995 555.106L313.002 650.898C313.002 656.421 308.525 660.898 303.002 660.898C297.481 660.9 293.002 656.423 293.002 650.899L292.995 555.107C292.994 549.584 297.471 545.107 302.994 545.107C308.515 545.105 312.993 549.583 312.995 555.106Z");
    			attr_dev(path2, "fill", path2_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path2, file$6, 76, 6, 1812);
    			attr_dev(path3, "id", "Vector_12");
    			attr_dev(path3, "d", "M369.563 611.674L369.57 707.466C369.571 712.989 365.094 717.467 359.571 717.467C354.05 717.468 349.57 712.991 349.57 707.468L349.563 611.676C349.563 606.153 354.04 601.675 359.563 601.675C365.084 601.675 369.562 606.153 369.563 611.674Z");
    			attr_dev(path3, "fill", path3_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path3, file$6, 80, 6, 2150);
    			attr_dev(path4, "id", "Vector_13");
    			attr_dev(path4, "d", "M412.998 650.898L413.005 555.106C413.006 549.583 417.482 545.106 423.006 545.106C428.527 545.106 433.005 549.584 433.005 555.106L432.998 650.898C432.998 656.421 428.521 660.898 422.997 660.898C417.475 660.898 412.997 656.421 412.998 650.898Z");
    			attr_dev(path4, "fill", path4_fill_value = /*flying*/ ctx[0] ? "black" : "transparent");
    			add_location(path4, file$6, 84, 6, 2485);
    			attr_dev(g0, "id", "directionLines");
    			attr_dev(g0, "filter", "url(#filter4_d)");
    			attr_dev(g0, "class", "svelte-1qewpt4");
    			toggle_class(g0, "flyingLines", /*flying*/ ctx[0]);
    			add_location(g0, file$6, 67, 4, 1059);
    			attr_dev(path5, "d", "M393.002 455.284L333.35 455.284C327.014 465.905 323.175 479.913 323.175 495.285C323.175 528.42 363.176 575.28 363.176 575.28C363.176 575.28 403.177 528.42 403.177 495.285C403.177 479.913 399.337 465.905 393.002 455.284Z");
    			attr_dev(path5, "fill", path5_fill_value = /*flying*/ ctx[0] ? "#FFDD78" : "transparent");
    			add_location(path5, file$6, 90, 6, 2908);
    			attr_dev(g1, "id", "Flame");
    			attr_dev(g1, "filter", "url(#filter3_d)");
    			attr_dev(g1, "class", "svelte-1qewpt4");
    			toggle_class(g1, "pulsatingFlame", /*flying*/ ctx[0]);
    			add_location(g1, file$6, 89, 4, 2832);
    			attr_dev(path6, "d", "M363.176 15.28C363.176 15.28 326.477 54.7083 297.542 115.279L428.81 115.279C399.875 54.7083 363.176 15.28 363.176 15.28Z");
    			attr_dev(path6, "fill", "#FF5249");
    			add_location(path6, file$6, 95, 6, 3259);
    			attr_dev(g2, "id", "Vector");
    			attr_dev(g2, "filter", "url(#filter0_d)");
    			add_location(g2, file$6, 94, 4, 3212);
    			attr_dev(path7, "d", "M428.81 115.279L297.542 115.279C278.705 154.679 263.17 203.038 263.17 255.279C263.17 303.42 272.859 351.646 289.778 395.279L436.574 395.279C447.894 366.083 457.037 331.993 461.025 295.04C462.418 282.107 463.182 268.827 463.182 255.279C463.182 203.038 447.647 154.679 428.81 115.279Z");
    			attr_dev(path7, "fill", "#F2F2F2");
    			add_location(path7, file$6, 100, 6, 3486);
    			attr_dev(g3, "id", "Vector_2");
    			attr_dev(g3, "filter", "url(#filter1_d)");
    			add_location(g3, file$6, 99, 4, 3437);
    			attr_dev(path8, "id", "Vector_3");
    			attr_dev(path8, "d", "M363.176 175.284C341.086 175.284 323.175 193.195 323.175 215.285C323.175 237.375 341.079 255.279 363.176 255.286C385.273 255.279 403.177 237.375 403.177 215.285C403.177 193.195 385.266 175.284 363.176 175.284Z");
    			attr_dev(path8, "fill", "#7BD8E8");
    			add_location(path8, file$6, 104, 4, 3826);
    			attr_dev(path9, "id", "Vector_4");
    			attr_dev(path9, "d", "M263.177 295.28C172.066 313.502 204.954 417.058 243.173 455.277C243.173 415.283 274.858 395.279 274.858 395.279L289.778 395.279C278.457 366.083 269.315 331.993 265.326 295.04L263.177 295.28Z");
    			attr_dev(path9, "fill", "#FF5249");
    			add_location(path9, file$6, 109, 6, 4146);
    			attr_dev(path10, "id", "Vector_5");
    			attr_dev(path10, "d", "M393.002 455.284H395.293C402.06 455.277 408.629 452.032 412.079 446.205C420.614 431.773 429.071 414.604 436.574 395.279L289.778 395.279C297.281 414.604 305.738 431.773 314.272 446.205C317.723 452.032 324.292 455.277 331.059 455.284H333.35L393.002 455.284Z");
    			attr_dev(path10, "fill", "#FF5249");
    			add_location(path10, file$6, 113, 6, 4409);
    			attr_dev(path11, "id", "Vector_6");
    			attr_dev(path11, "d", "M463.175 295.28L461.025 295.04C457.037 331.993 447.894 366.083 436.574 395.279H451.494C451.494 395.279 483.179 415.283 483.179 455.277C521.398 417.058 554.286 313.502 463.175 295.28Z");
    			attr_dev(path11, "fill", "#FF5249");
    			add_location(path11, file$6, 117, 6, 4737);
    			attr_dev(g4, "id", "Group");
    			attr_dev(g4, "filter", "url(#filter2_d)");
    			add_location(g4, file$6, 108, 4, 4100);
    			attr_dev(path12, "id", "Vector_7");
    			attr_dev(path12, "d", "M352.994 355.101C353.001 349.579 357.477 345.103 362.992 345.103C368.522 345.103 372.998 349.579 372.998 355.108C372.998 360.624 368.522 365.1 362.999 365.107C357.477 365.1 353.001 360.624 352.994 355.101Z");
    			attr_dev(path12, "fill", "black");
    			add_location(path12, file$6, 122, 4, 4999);
    			attr_dev(path13, "id", "Vector_8");
    			attr_dev(path13, "d", "M312.998 215.108C312.998 187.477 335.363 165.107 362.999 165.107C390.632 165.108 413 187.475 413.001 215.109C413.001 242.671 390.572 265.101 362.996 265.109C335.433 265.101 312.998 242.677 312.998 215.108ZM393 215.108C393 198.53 379.581 185.107 362.999 185.107C346.421 185.107 332.998 198.527 332.999 215.108C332.998 231.645 346.457 245.104 362.997 245.109C379.541 245.104 393.001 231.646 393 215.108Z");
    			attr_dev(path13, "fill", "black");
    			add_location(path13, file$6, 126, 4, 5267);
    			attr_dev(path14, "id", "Vector_14");
    			attr_dev(path14, "d", "M352.999 315.1L352.999 295.103C352.999 289.581 357.477 285.103 363 285.103C368.523 285.103 372.999 289.579 373 295.103L373 315.1C373 320.623 368.523 325.1 363 325.101C357.477 325.1 353 320.624 352.999 315.1Z");
    			attr_dev(path14, "fill", "black");
    			add_location(path14, file$6, 130, 4, 5731);
    			attr_dev(g5, "id", "Rocket");
    			attr_dev(g5, "clip-path", "url(#clip0)");
    			add_location(g5, file$6, 66, 2, 1015);
    			attr_dev(feFlood0, "flood-opacity", "0");
    			attr_dev(feFlood0, "result", "BackgroundImageFix");
    			add_location(feFlood0, file$6, 144, 6, 6208);
    			attr_dev(feColorMatrix0, "in", "SourceAlpha");
    			attr_dev(feColorMatrix0, "type", "matrix");
    			attr_dev(feColorMatrix0, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix0, file$6, 145, 6, 6272);
    			attr_dev(feOffset0, "dy", "4");
    			add_location(feOffset0, file$6, 149, 6, 6402);
    			attr_dev(feGaussianBlur0, "stdDeviation", "2");
    			add_location(feGaussianBlur0, file$6, 150, 6, 6428);
    			attr_dev(feColorMatrix1, "type", "matrix");
    			attr_dev(feColorMatrix1, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix1, file$6, 151, 6, 6470);
    			attr_dev(feBlend0, "mode", "normal");
    			attr_dev(feBlend0, "in2", "BackgroundImageFix");
    			attr_dev(feBlend0, "result", "effect1_dropShadow");
    			add_location(feBlend0, file$6, 154, 6, 6576);
    			attr_dev(feBlend1, "mode", "normal");
    			attr_dev(feBlend1, "in", "SourceGraphic");
    			attr_dev(feBlend1, "in2", "effect1_dropShadow");
    			attr_dev(feBlend1, "result", "shape");
    			add_location(feBlend1, file$6, 158, 6, 6685);
    			attr_dev(filter0, "id", "filter0_d");
    			attr_dev(filter0, "x", "276.36");
    			attr_dev(filter0, "y", "15.28");
    			attr_dev(filter0, "width", "173.633");
    			attr_dev(filter0, "height", "173.633");
    			attr_dev(filter0, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter0, "color-interpolation-filters", "sRGB");
    			add_location(filter0, file$6, 136, 4, 6018);
    			attr_dev(feFlood1, "flood-opacity", "0");
    			attr_dev(feFlood1, "result", "BackgroundImageFix");
    			add_location(feFlood1, file$6, 172, 6, 7012);
    			attr_dev(feColorMatrix2, "in", "SourceAlpha");
    			attr_dev(feColorMatrix2, "type", "matrix");
    			attr_dev(feColorMatrix2, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix2, file$6, 173, 6, 7076);
    			attr_dev(feOffset1, "dy", "4");
    			add_location(feOffset1, file$6, 177, 6, 7206);
    			attr_dev(feGaussianBlur1, "stdDeviation", "2");
    			add_location(feGaussianBlur1, file$6, 178, 6, 7232);
    			attr_dev(feColorMatrix3, "type", "matrix");
    			attr_dev(feColorMatrix3, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix3, file$6, 179, 6, 7274);
    			attr_dev(feBlend2, "mode", "normal");
    			attr_dev(feBlend2, "in2", "BackgroundImageFix");
    			attr_dev(feBlend2, "result", "effect1_dropShadow");
    			add_location(feBlend2, file$6, 182, 6, 7380);
    			attr_dev(feBlend3, "mode", "normal");
    			attr_dev(feBlend3, "in", "SourceGraphic");
    			attr_dev(feBlend3, "in2", "effect1_dropShadow");
    			attr_dev(feBlend3, "result", "shape");
    			add_location(feBlend3, file$6, 186, 6, 7489);
    			attr_dev(filter1, "id", "filter1_d");
    			attr_dev(filter1, "x", "149.66");
    			attr_dev(filter1, "y", "49.6454");
    			attr_dev(filter1, "width", "427.031");
    			attr_dev(filter1, "height", "427.031");
    			attr_dev(filter1, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter1, "color-interpolation-filters", "sRGB");
    			add_location(filter1, file$6, 164, 4, 6820);
    			attr_dev(feFlood2, "flood-opacity", "0");
    			attr_dev(feFlood2, "result", "BackgroundImageFix");
    			add_location(feFlood2, file$6, 200, 6, 7817);
    			attr_dev(feColorMatrix4, "in", "SourceAlpha");
    			attr_dev(feColorMatrix4, "type", "matrix");
    			attr_dev(feColorMatrix4, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix4, file$6, 201, 6, 7881);
    			attr_dev(feOffset2, "dy", "4");
    			add_location(feOffset2, file$6, 205, 6, 8011);
    			attr_dev(feGaussianBlur2, "stdDeviation", "2");
    			add_location(feGaussianBlur2, file$6, 206, 6, 8037);
    			attr_dev(feColorMatrix5, "type", "matrix");
    			attr_dev(feColorMatrix5, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix5, file$6, 207, 6, 8079);
    			attr_dev(feBlend4, "mode", "normal");
    			attr_dev(feBlend4, "in2", "BackgroundImageFix");
    			attr_dev(feBlend4, "result", "effect1_dropShadow");
    			add_location(feBlend4, file$6, 210, 6, 8185);
    			attr_dev(feBlend5, "mode", "normal");
    			attr_dev(feBlend5, "in", "SourceGraphic");
    			attr_dev(feBlend5, "in2", "effect1_dropShadow");
    			attr_dev(feBlend5, "result", "shape");
    			add_location(feBlend5, file$6, 214, 6, 8294);
    			attr_dev(filter2, "id", "filter2_d");
    			attr_dev(filter2, "x", "158.792");
    			attr_dev(filter2, "y", "283.701");
    			attr_dev(filter2, "width", "408.767");
    			attr_dev(filter2, "height", "220.172");
    			attr_dev(filter2, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter2, "color-interpolation-filters", "sRGB");
    			add_location(filter2, file$6, 192, 4, 7624);
    			attr_dev(feFlood3, "flood-opacity", "0");
    			attr_dev(feFlood3, "result", "BackgroundImageFix");
    			add_location(feFlood3, file$6, 228, 6, 8622);
    			attr_dev(feColorMatrix6, "in", "SourceAlpha");
    			attr_dev(feColorMatrix6, "type", "matrix");
    			attr_dev(feColorMatrix6, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix6, file$6, 229, 6, 8686);
    			attr_dev(feOffset3, "dy", "4");
    			add_location(feOffset3, file$6, 233, 6, 8816);
    			attr_dev(feGaussianBlur3, "stdDeviation", "2");
    			add_location(feGaussianBlur3, file$6, 234, 6, 8842);
    			attr_dev(feColorMatrix7, "type", "matrix");
    			attr_dev(feColorMatrix7, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix7, file$6, 235, 6, 8884);
    			attr_dev(feBlend6, "mode", "normal");
    			attr_dev(feBlend6, "in2", "BackgroundImageFix");
    			attr_dev(feBlend6, "result", "effect1_dropShadow");
    			add_location(feBlend6, file$6, 238, 6, 8990);
    			attr_dev(feBlend7, "mode", "normal");
    			attr_dev(feBlend7, "in", "SourceGraphic");
    			attr_dev(feBlend7, "in2", "effect1_dropShadow");
    			attr_dev(feBlend7, "result", "shape");
    			add_location(feBlend7, file$6, 242, 6, 9099);
    			attr_dev(filter3, "id", "filter3_d");
    			attr_dev(filter3, "x", "284.265");
    			attr_dev(filter3, "y", "425.458");
    			attr_dev(filter3, "width", "157.822");
    			attr_dev(filter3, "height", "157.822");
    			attr_dev(filter3, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter3, "color-interpolation-filters", "sRGB");
    			add_location(filter3, file$6, 220, 4, 8429);
    			attr_dev(feFlood4, "flood-opacity", "0");
    			attr_dev(feFlood4, "result", "BackgroundImageFix");
    			add_location(feFlood4, file$6, 256, 6, 9426);
    			attr_dev(feColorMatrix8, "in", "SourceAlpha");
    			attr_dev(feColorMatrix8, "type", "matrix");
    			attr_dev(feColorMatrix8, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			add_location(feColorMatrix8, file$6, 257, 6, 9490);
    			attr_dev(feOffset4, "dy", "4");
    			add_location(feOffset4, file$6, 261, 6, 9620);
    			attr_dev(feGaussianBlur4, "stdDeviation", "2");
    			add_location(feGaussianBlur4, file$6, 262, 6, 9646);
    			attr_dev(feColorMatrix9, "type", "matrix");
    			attr_dev(feColorMatrix9, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0");
    			add_location(feColorMatrix9, file$6, 263, 6, 9688);
    			attr_dev(feBlend8, "mode", "normal");
    			attr_dev(feBlend8, "in2", "BackgroundImageFix");
    			attr_dev(feBlend8, "result", "effect1_dropShadow");
    			add_location(feBlend8, file$6, 266, 6, 9794);
    			attr_dev(feBlend9, "mode", "normal");
    			attr_dev(feBlend9, "in", "SourceGraphic");
    			attr_dev(feBlend9, "in2", "effect1_dropShadow");
    			attr_dev(feBlend9, "result", "shape");
    			add_location(feBlend9, file$6, 270, 6, 9903);
    			attr_dev(filter4, "id", "filter4_d");
    			attr_dev(filter4, "x", "224.855");
    			attr_dev(filter4, "y", "480.96");
    			attr_dev(filter4, "width", "276.289");
    			attr_dev(filter4, "height", "248.649");
    			attr_dev(filter4, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter4, "color-interpolation-filters", "sRGB");
    			add_location(filter4, file$6, 248, 4, 9234);
    			attr_dev(rect, "width", "512.001");
    			attr_dev(rect, "height", "512.001");
    			attr_dev(rect, "fill", "white");
    			attr_dev(rect, "transform", "matrix(-0.707107 -0.707107 -0.707107 0.707107 725.04 363)");
    			add_location(rect, file$6, 277, 6, 10066);
    			attr_dev(clipPath, "id", "clip0");
    			add_location(clipPath, file$6, 276, 4, 10038);
    			add_location(defs, file$6, 135, 2, 6007);
    			attr_dev(svg, "width", "75");
    			attr_dev(svg, "height", "75");
    			attr_dev(svg, "viewBox", "0 0 726 726");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1qewpt4");
    			add_location(svg, file$6, 59, 0, 880);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rocket",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file$7 = "src/App.svelte";

    // (43:0) {#if scrollTop > 160}
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
    			attr_dev(div, "class", "toTopButton svelte-1btn6sb");
    			add_location(div, file$7, 43, 2, 1020);
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
    		source: "(43:0) {#if scrollTop > 160}",
    		ctx
    	});

    	return block;
    }

    // (49:0) <Section id="about" isBlue={false}>
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
    		source: "(49:0) <Section id=\\\"about\\\" isBlue={false}>",
    		ctx
    	});

    	return block;
    }

    // (53:0) <Section id="projects" isBlue={true}>
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
    		source: "(53:0) <Section id=\\\"projects\\\" isBlue={true}>",
    		ctx
    	});

    	return block;
    }

    // (57:0) <Section id="contact" isBlue={false}>
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
    		source: "(57:0) <Section id=\\\"contact\\\" isBlue={false}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
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
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(home, target, anchor);
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
    			destroy_component(nav, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(home, detaching);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
