
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    let diskdb = require('diskdb');
    let jwt = require('jsonwebtoken');
    class Client {

      constructor(master) {
        this.master = master;
        this.diskdb = diskdb.connect('/.CANDY/db', ['list']); 
      }

      get logged() {
        return (window.localStorage.getItem('cid') ? true : false)
      }

      addToList(ips) {
        let lines = Object.assign({}, ips.split(/\n/));
        let list = [];
        for(const line in lines) {
          let tmp = {
            ip: lines[line].split(':')[0],
            port: lines[line].split(':')[1], 
            user: lines[line].split(':')[2],
            pass: lines[line].split(':')[3], 
            status: 'unconfirmed',
            type: ''
          };
          if(lines[line].split(':')[1] == 22) {
            tmp.type = 'ssh';
          } else if(lines[line].split(':')[1] == 23) {
            tmp.type = 'telnet';
          } else {
            tmp.type = 'invalid';
          }
          list.push(tmp);
        }
        this.diskdb.list.save(list);
        return true
      }

      getList(type) {
        if(type == 'ssh' || type == 'telnet') {
          return this.diskdb.list.find({type})
        } else {
          return this.diskdb.list.find()
        }
      }

      get list() {
        return this.diskdb.list
      }

      isFloat(n) {
        return n === +n && n !== (n|0);
      }

      getTotalPageCount(type) {
        let fList = this.getList(type),
            itemsPerPage = 5;
        return this.isFloat(fList.length / itemsPerPage) ? ((fList.length / itemsPerPage) ^ 0) + 1 : fList.length / itemsPerPage
      }

      getListToPage(currentPage, type) {
        let fList = this.getList(type), 
            itemsPerPage = 5;

        /**
         * Starting position
         * @Calc (Current Page - 1) * Items Per Page
         * @Final 1 - 1 = 0    0 * 5 = 0 
         * @Final 10 - 1 = 9   9 * 5 = 45
         * 
         * Ending position
         * @Calc (Current Page - 1) * (Items Per Page + Items Per Page)
         * @Final 1 - 1 = 0    0 * 5 = 0    0 + 5 = 5
         * @Final 10 - 1 = 9   9 * 5 = 45   45 + 5 = 50
         * 
         */


        const startPos = (currentPage - 1) * itemsPerPage;
        const endingPos = (currentPage - 1) * (itemsPerPage) + itemsPerPage;
        let elements = [];
        for(let i=startPos; i<endingPos;i++) {
          if(fList[i] !== undefined) {
            elements.push(fList[i]);
          }
        }

        return elements
        
      }

      checkList(type) {
        let fList = this.list.find({ type, status: 'unconfirmed'}), 
            listToken = jwt.sign({data: JSON.stringify(fList)}, 'db//==Ap46oxzxZQ+6');
        this.master.emit('kinai:load:unconfirmed', listToken);
      }

      get uCount() {
        return this.list.count({status: 'unconfirmed'}).toString()
      }

    }

    /* src\components\includes\frame.svelte generated by Svelte v3.24.1 */
    const file = "src\\components\\includes\\frame.svelte";

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let span0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let span1;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let span2;
    	let p4;
    	let t9;
    	let p5;
    	let t11;
    	let h1;
    	let t13;
    	let div1;
    	let p6;
    	let i0;
    	let t14;
    	let p7;
    	let i1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			p0 = element("p");
    			p0.textContent = "0";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "SSH";
    			t3 = space();
    			span1 = element("span");
    			p2 = element("p");
    			p2.textContent = "0";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "Telnet";
    			t7 = space();
    			span2 = element("span");
    			p4 = element("p");
    			p4.textContent = `${/*_Client*/ ctx[0].uCount}`;
    			t9 = space();
    			p5 = element("p");
    			p5.textContent = "Unconfirmed";
    			t11 = space();
    			h1 = element("h1");
    			h1.textContent = "Kinai";
    			t13 = space();
    			div1 = element("div");
    			p6 = element("p");
    			i0 = element("i");
    			t14 = space();
    			p7 = element("p");
    			i1 = element("i");
    			attr_dev(p0, "class", "count svelte-pza65h");
    			add_location(p0, file, 124, 6, 2330);
    			attr_dev(p1, "class", "svelte-pza65h");
    			add_location(p1, file, 125, 6, 2360);
    			attr_dev(span0, "class", "svelte-pza65h");
    			add_location(span0, file, 123, 4, 2316);
    			attr_dev(p2, "class", "count svelte-pza65h");
    			add_location(p2, file, 128, 6, 2403);
    			attr_dev(p3, "class", "svelte-pza65h");
    			add_location(p3, file, 129, 6, 2433);
    			attr_dev(span1, "class", "svelte-pza65h");
    			add_location(span1, file, 127, 4, 2389);
    			attr_dev(p4, "class", "count svelte-pza65h");
    			add_location(p4, file, 132, 6, 2479);
    			attr_dev(p5, "class", "svelte-pza65h");
    			add_location(p5, file, 133, 6, 2526);
    			attr_dev(span2, "class", "svelte-pza65h");
    			add_location(span2, file, 131, 4, 2465);
    			attr_dev(div0, "class", "stats svelte-pza65h");
    			add_location(div0, file, 122, 2, 2291);
    			attr_dev(h1, "class", "logo svelte-pza65h");
    			add_location(h1, file, 136, 2, 2571);
    			attr_dev(i0, "class", "far fa-window-minimize");
    			add_location(i0, file, 139, 6, 2652);
    			attr_dev(p6, "class", "close svelte-pza65h");
    			add_location(p6, file, 138, 4, 2627);
    			attr_dev(i1, "class", "fa fa-times");
    			add_location(i1, file, 142, 6, 2734);
    			attr_dev(p7, "class", "minimize svelte-pza65h");
    			add_location(p7, file, 141, 4, 2706);
    			attr_dev(div1, "class", "right svelte-pza65h");
    			add_location(div1, file, 137, 2, 2602);
    			attr_dev(div2, "class", "frame-bar svelte-pza65h");
    			add_location(div2, file, 121, 0, 2264);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(span0, p0);
    			append_dev(span0, t1);
    			append_dev(span0, p1);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(span1, p2);
    			append_dev(span1, t5);
    			append_dev(span1, p3);
    			append_dev(div0, t7);
    			append_dev(div0, span2);
    			append_dev(span2, p4);
    			append_dev(span2, t9);
    			append_dev(span2, p5);
    			append_dev(div2, t11);
    			append_dev(div2, h1);
    			append_dev(div2, t13);
    			append_dev(div2, div1);
    			append_dev(div1, p6);
    			append_dev(p6, i0);
    			append_dev(div1, t14);
    			append_dev(div1, p7);
    			append_dev(p7, i1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	const _Client = new Client();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Frame> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Frame", $$slots, []);
    	$$self.$capture_state = () => ({ Client, _Client });
    	return [_Client];
    }

    class Frame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Frame",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\pages\dashboard.svelte generated by Svelte v3.24.1 */

    const file$1 = "src\\components\\pages\\dashboard.svelte";

    function create_fragment$1(ctx) {
    	let div14;
    	let div3;
    	let div0;
    	let i0;
    	let t0;
    	let p0;
    	let t2;
    	let span0;
    	let t4;
    	let div1;
    	let i1;
    	let t5;
    	let p1;
    	let t7;
    	let span1;
    	let t9;
    	let div2;
    	let i2;
    	let t10;
    	let p2;
    	let t12;
    	let span2;
    	let t14;
    	let div7;
    	let p3;
    	let t16;
    	let div4;
    	let p4;
    	let t18;
    	let div5;
    	let p5;
    	let t20;
    	let div6;
    	let p6;
    	let t22;
    	let div13;
    	let p7;
    	let t24;
    	let div12;
    	let div8;
    	let p8;
    	let t26;
    	let span3;
    	let t28;
    	let div9;
    	let p9;
    	let t30;
    	let span4;
    	let t32;
    	let div10;
    	let p10;
    	let t34;
    	let span5;
    	let t36;
    	let div11;
    	let p11;
    	let t38;
    	let span6;

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Total count";
    			t2 = space();
    			span0 = element("span");
    			span0.textContent = "0";
    			t4 = space();
    			div1 = element("div");
    			i1 = element("i");
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "SSH Bots";
    			t7 = space();
    			span1 = element("span");
    			span1.textContent = "0";
    			t9 = space();
    			div2 = element("div");
    			i2 = element("i");
    			t10 = space();
    			p2 = element("p");
    			p2.textContent = "Telnet Bots";
    			t12 = space();
    			span2 = element("span");
    			span2.textContent = "0";
    			t14 = space();
    			div7 = element("div");
    			p3 = element("p");
    			p3.textContent = "Binded Actions";
    			t16 = space();
    			div4 = element("div");
    			p4 = element("p");
    			p4.textContent = "Crypto BTC";
    			t18 = space();
    			div5 = element("div");
    			p5 = element("p");
    			p5.textContent = "Crypto XMR";
    			t20 = space();
    			div6 = element("div");
    			p6 = element("p");
    			p6.textContent = "Selfrep";
    			t22 = space();
    			div13 = element("div");
    			p7 = element("p");
    			p7.textContent = "Overview";
    			t24 = space();
    			div12 = element("div");
    			div8 = element("div");
    			p8 = element("p");
    			p8.textContent = "System status";
    			t26 = space();
    			span3 = element("span");
    			span3.textContent = "Online";
    			t28 = space();
    			div9 = element("div");
    			p9 = element("p");
    			p9.textContent = "Bot status";
    			t30 = space();
    			span4 = element("span");
    			span4.textContent = "Undetected";
    			t32 = space();
    			div10 = element("div");
    			p10 = element("p");
    			p10.textContent = "Pre-defined port";
    			t34 = space();
    			span5 = element("span");
    			span5.textContent = "3000";
    			t36 = space();
    			div11 = element("div");
    			p11 = element("p");
    			p11.textContent = "Current action";
    			t38 = space();
    			span6 = element("span");
    			span6.textContent = "Crypto XMR";
    			attr_dev(i0, "class", "fas fa-globe icon svelte-1oidwty");
    			add_location(i0, file$1, 184, 6, 3477);
    			attr_dev(p0, "class", "svelte-1oidwty");
    			add_location(p0, file$1, 185, 6, 3518);
    			attr_dev(span0, "class", "svelte-1oidwty");
    			add_location(span0, file$1, 186, 6, 3544);
    			attr_dev(div0, "class", "box svelte-1oidwty");
    			add_location(div0, file$1, 183, 4, 3452);
    			attr_dev(i1, "class", "fas fa-laptop-code icon svelte-1oidwty");
    			add_location(i1, file$1, 189, 6, 3601);
    			attr_dev(p1, "class", "svelte-1oidwty");
    			add_location(p1, file$1, 190, 6, 3648);
    			attr_dev(span1, "class", "svelte-1oidwty");
    			add_location(span1, file$1, 191, 6, 3671);
    			attr_dev(div1, "class", "box svelte-1oidwty");
    			add_location(div1, file$1, 188, 4, 3576);
    			attr_dev(i2, "class", "fas fa-microchip icon svelte-1oidwty");
    			add_location(i2, file$1, 194, 6, 3728);
    			attr_dev(p2, "class", "svelte-1oidwty");
    			add_location(p2, file$1, 195, 6, 3773);
    			attr_dev(span2, "class", "svelte-1oidwty");
    			add_location(span2, file$1, 196, 6, 3799);
    			attr_dev(div2, "class", "box svelte-1oidwty");
    			add_location(div2, file$1, 193, 4, 3703);
    			attr_dev(div3, "class", "stats svelte-1oidwty");
    			add_location(div3, file$1, 182, 2, 3427);
    			attr_dev(p3, "class", "svelte-1oidwty");
    			add_location(p3, file$1, 200, 4, 3866);
    			attr_dev(p4, "class", "svelte-1oidwty");
    			add_location(p4, file$1, 202, 6, 3921);
    			attr_dev(div4, "class", "action svelte-1oidwty");
    			add_location(div4, file$1, 201, 4, 3893);
    			attr_dev(p5, "class", "svelte-1oidwty");
    			add_location(p5, file$1, 205, 6, 3984);
    			attr_dev(div5, "class", "action svelte-1oidwty");
    			add_location(div5, file$1, 204, 4, 3956);
    			attr_dev(p6, "class", "svelte-1oidwty");
    			add_location(p6, file$1, 208, 6, 4047);
    			attr_dev(div6, "class", "action svelte-1oidwty");
    			add_location(div6, file$1, 207, 4, 4019);
    			attr_dev(div7, "class", "actions svelte-1oidwty");
    			add_location(div7, file$1, 199, 2, 3839);
    			attr_dev(p7, "class", "title svelte-1oidwty");
    			add_location(p7, file$1, 213, 4, 4117);
    			attr_dev(p8, "class", "svelte-1oidwty");
    			add_location(p8, file$1, 216, 8, 4207);
    			attr_dev(span3, "class", "text-green svelte-1oidwty");
    			add_location(span3, file$1, 217, 8, 4237);
    			attr_dev(div8, "class", "item svelte-1oidwty");
    			add_location(div8, file$1, 215, 6, 4179);
    			attr_dev(p9, "class", "svelte-1oidwty");
    			add_location(p9, file$1, 220, 8, 4325);
    			attr_dev(span4, "class", "text-green svelte-1oidwty");
    			add_location(span4, file$1, 221, 8, 4352);
    			attr_dev(div9, "class", "item svelte-1oidwty");
    			add_location(div9, file$1, 219, 6, 4297);
    			attr_dev(p10, "class", "svelte-1oidwty");
    			add_location(p10, file$1, 224, 8, 4444);
    			attr_dev(span5, "class", "text-dark svelte-1oidwty");
    			add_location(span5, file$1, 225, 8, 4477);
    			attr_dev(div10, "class", "item svelte-1oidwty");
    			add_location(div10, file$1, 223, 6, 4416);
    			attr_dev(p11, "class", "svelte-1oidwty");
    			add_location(p11, file$1, 228, 8, 4562);
    			attr_dev(span6, "class", "text-dark svelte-1oidwty");
    			add_location(span6, file$1, 229, 8, 4593);
    			attr_dev(div11, "class", "item svelte-1oidwty");
    			add_location(div11, file$1, 227, 6, 4534);
    			attr_dev(div12, "class", "items svelte-1oidwty");
    			add_location(div12, file$1, 214, 4, 4152);
    			attr_dev(div13, "class", "overview svelte-1oidwty");
    			add_location(div13, file$1, 212, 2, 4089);
    			attr_dev(div14, "class", "page-wrapper");
    			add_location(div14, file$1, 181, 0, 3397);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div3);
    			append_dev(div3, div0);
    			append_dev(div0, i0);
    			append_dev(div0, t0);
    			append_dev(div0, p0);
    			append_dev(div0, t2);
    			append_dev(div0, span0);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, i1);
    			append_dev(div1, t5);
    			append_dev(div1, p1);
    			append_dev(div1, t7);
    			append_dev(div1, span1);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, i2);
    			append_dev(div2, t10);
    			append_dev(div2, p2);
    			append_dev(div2, t12);
    			append_dev(div2, span2);
    			append_dev(div14, t14);
    			append_dev(div14, div7);
    			append_dev(div7, p3);
    			append_dev(div7, t16);
    			append_dev(div7, div4);
    			append_dev(div4, p4);
    			append_dev(div7, t18);
    			append_dev(div7, div5);
    			append_dev(div5, p5);
    			append_dev(div7, t20);
    			append_dev(div7, div6);
    			append_dev(div6, p6);
    			append_dev(div14, t22);
    			append_dev(div14, div13);
    			append_dev(div13, p7);
    			append_dev(div13, t24);
    			append_dev(div13, div12);
    			append_dev(div12, div8);
    			append_dev(div8, p8);
    			append_dev(div8, t26);
    			append_dev(div8, span3);
    			append_dev(div12, t28);
    			append_dev(div12, div9);
    			append_dev(div9, p9);
    			append_dev(div9, t30);
    			append_dev(div9, span4);
    			append_dev(div12, t32);
    			append_dev(div12, div10);
    			append_dev(div10, p10);
    			append_dev(div10, t34);
    			append_dev(div10, span5);
    			append_dev(div12, t36);
    			append_dev(div12, div11);
    			append_dev(div11, p11);
    			append_dev(div11, t38);
    			append_dev(div11, span6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
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

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", $$slots, []);
    	return [];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\components\pages\crypto.svelte generated by Svelte v3.24.1 */

    const file$2 = "src\\components\\pages\\crypto.svelte";

    function create_fragment$2(ctx) {
    	let p;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Dashboard";
    			t1 = space();
    			div = element("div");
    			attr_dev(p, "class", "title");
    			add_location(p, file$2, 7, 0, 46);
    			attr_dev(div, "class", "page-wrapper");
    			add_location(div, file$2, 8, 0, 78);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Crypto> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Crypto", $$slots, []);
    	return [];
    }

    class Crypto extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Crypto",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\pages\attack.svelte generated by Svelte v3.24.1 */

    const file$3 = "src\\components\\pages\\attack.svelte";

    function create_fragment$3(ctx) {
    	let p;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Attack";
    			t1 = space();
    			div = element("div");
    			attr_dev(p, "class", "title");
    			add_location(p, file$3, 7, 0, 46);
    			attr_dev(div, "class", "page-wrapper");
    			add_location(div, file$3, 8, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Attack> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Attack", $$slots, []);
    	return [];
    }

    class Attack extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Attack",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\pages\selfrep.svelte generated by Svelte v3.24.1 */

    const file$4 = "src\\components\\pages\\selfrep.svelte";

    function create_fragment$4(ctx) {
    	let p;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Dashboard";
    			t1 = space();
    			div = element("div");
    			attr_dev(p, "class", "title");
    			add_location(p, file$4, 7, 0, 46);
    			attr_dev(div, "class", "page-wrapper");
    			add_location(div, file$4, 8, 0, 78);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Selfrep> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Selfrep", $$slots, []);
    	return [];
    }

    class Selfrep extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Selfrep",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\pages\shell.svelte generated by Svelte v3.24.1 */

    const file$5 = "src\\components\\pages\\shell.svelte";

    function create_fragment$5(ctx) {
    	let p;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Dashboard";
    			t1 = space();
    			div = element("div");
    			attr_dev(p, "class", "title");
    			add_location(p, file$5, 7, 0, 46);
    			attr_dev(div, "class", "page-wrapper");
    			add_location(div, file$5, 8, 0, 78);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Shell> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Shell", $$slots, []);
    	return [];
    }

    class Shell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shell",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    function range(start,stop,step) {
    	if (stop == null) {
    		stop  = start;
    		start = 0;
    	}
    	if (!step) {
    		step = 1;
    	}
    	const len = (stop - start) / step;
    	return new Proxy({length: len}, {
    		get: (t, prop) => { 
    			return prop === 'length' ? t.length : 
    						 prop < t.length   ? start + (prop * step) : undefined;
    		}
    	});	
    }

    /* src\components\pages\manage.svelte generated by Svelte v3.24.1 */
    const file$6 = "src\\components\\pages\\manage.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (482:6) {:else}
    function create_else_block(ctx) {
    	let t;
    	let if_block_anchor;
    	let each_value_2 = /*myTelnetList*/ ctx[4];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let if_block = /*myTelnetList*/ ctx[4].length == 0 && create_if_block_9(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*myTelnetList*/ 16) {
    				each_value_2 = /*myTelnetList*/ ctx[4];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (/*myTelnetList*/ ctx[4].length == 0) {
    				if (if_block) ; else {
    					if_block = create_if_block_9(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(482:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (457:6) {#if active == 'ssh'}
    function create_if_block_7(ctx) {
    	let t;
    	let if_block_anchor;
    	let each_value_1 = /*mySSHList*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*mySSHList*/ ctx[3].length == 0 && create_if_block_8(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*mySSHList*/ 8) {
    				each_value_1 = /*mySSHList*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*mySSHList*/ ctx[3].length == 0) {
    				if (if_block) ; else {
    					if_block = create_if_block_8(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(457:6) {#if active == 'ssh'}",
    		ctx
    	});

    	return block;
    }

    // (483:8) {#each myTelnetList as telnet}
    function create_each_block_2(ctx) {
    	let div;
    	let i0;
    	let t0;
    	let p0;
    	let span0;
    	let t2;
    	let t3_value = /*telnet*/ ctx[21].ip + "";
    	let t3;
    	let t4;
    	let t5_value = /*telnet*/ ctx[21].port + "";
    	let t5;
    	let t6;
    	let p1;
    	let span1;
    	let t8;
    	let t9_value = /*telnet*/ ctx[21].user + "";
    	let t9;
    	let t10;
    	let t11_value = /*telnet*/ ctx[21].pass + "";
    	let t11;
    	let t12;
    	let p2;
    	let span2;
    	let t14;
    	let t15_value = /*telnet*/ ctx[21].status + "";
    	let t15;
    	let t16;
    	let p3;
    	let span3;
    	let t18;
    	let i1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i0 = element("i");
    			t0 = space();
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "IP";
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = text(":");
    			t5 = text(t5_value);
    			t6 = space();
    			p1 = element("p");
    			span1 = element("span");
    			span1.textContent = "Login";
    			t8 = space();
    			t9 = text(t9_value);
    			t10 = text(":");
    			t11 = text(t11_value);
    			t12 = space();
    			p2 = element("p");
    			span2 = element("span");
    			span2.textContent = "Status";
    			t14 = space();
    			t15 = text(t15_value);
    			t16 = space();
    			p3 = element("p");
    			span3 = element("span");
    			span3.textContent = "Actions";
    			t18 = space();
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-code-branch label icon text-green svelte-v1j1cx");
    			add_location(i0, file$6, 484, 12, 10823);
    			attr_dev(span0, "class", "svelte-v1j1cx");
    			add_location(span0, file$6, 486, 14, 10926);
    			attr_dev(p0, "class", "label svelte-v1j1cx");
    			add_location(p0, file$6, 485, 12, 10893);
    			attr_dev(span1, "class", "svelte-v1j1cx");
    			add_location(span1, file$6, 490, 14, 11051);
    			attr_dev(p1, "class", "label svelte-v1j1cx");
    			add_location(p1, file$6, 489, 12, 11018);
    			attr_dev(span2, "class", "svelte-v1j1cx");
    			add_location(span2, file$6, 494, 14, 11181);
    			attr_dev(p2, "class", "label svelte-v1j1cx");
    			add_location(p2, file$6, 493, 12, 11148);
    			attr_dev(span3, "class", "svelte-v1j1cx");
    			add_location(span3, file$6, 498, 14, 11298);
    			attr_dev(i1, "class", "far fa-trash-alt");
    			add_location(i1, file$6, 499, 14, 11334);
    			attr_dev(p3, "class", "label svelte-v1j1cx");
    			add_location(p3, file$6, 497, 12, 11265);
    			attr_dev(div, "class", "item svelte-v1j1cx");
    			add_location(div, file$6, 483, 10, 10791);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i0);
    			append_dev(div, t0);
    			append_dev(div, p0);
    			append_dev(p0, span0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(div, t6);
    			append_dev(div, p1);
    			append_dev(p1, span1);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			append_dev(p1, t10);
    			append_dev(p1, t11);
    			append_dev(div, t12);
    			append_dev(div, p2);
    			append_dev(p2, span2);
    			append_dev(p2, t14);
    			append_dev(p2, t15);
    			append_dev(div, t16);
    			append_dev(div, p3);
    			append_dev(p3, span3);
    			append_dev(p3, t18);
    			append_dev(p3, i1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*myTelnetList*/ 16 && t3_value !== (t3_value = /*telnet*/ ctx[21].ip + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*myTelnetList*/ 16 && t5_value !== (t5_value = /*telnet*/ ctx[21].port + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*myTelnetList*/ 16 && t9_value !== (t9_value = /*telnet*/ ctx[21].user + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*myTelnetList*/ 16 && t11_value !== (t11_value = /*telnet*/ ctx[21].pass + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*myTelnetList*/ 16 && t15_value !== (t15_value = /*telnet*/ ctx[21].status + "")) set_data_dev(t15, t15_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(483:8) {#each myTelnetList as telnet}",
    		ctx
    	});

    	return block;
    }

    // (504:8) {#if myTelnetList.length == 0}
    function create_if_block_9(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Your list is empty...";
    			attr_dev(h1, "class", "empty svelte-v1j1cx");
    			add_location(h1, file$6, 504, 10, 11471);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(504:8) {#if myTelnetList.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (458:8) {#each mySSHList as ssh}
    function create_each_block_1(ctx) {
    	let div;
    	let i0;
    	let t0;
    	let p0;
    	let span0;
    	let t2;
    	let t3_value = /*ssh*/ ctx[18].ip + "";
    	let t3;
    	let t4;
    	let t5_value = /*ssh*/ ctx[18].port + "";
    	let t5;
    	let t6;
    	let p1;
    	let span1;
    	let t8;
    	let t9_value = /*ssh*/ ctx[18].user + "";
    	let t9;
    	let t10;
    	let t11_value = /*ssh*/ ctx[18].pass + "";
    	let t11;
    	let t12;
    	let p2;
    	let span2;
    	let t14;
    	let t15_value = /*ssh*/ ctx[18].status + "";
    	let t15;
    	let t16;
    	let p3;
    	let span3;
    	let t18;
    	let i1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i0 = element("i");
    			t0 = space();
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "IP";
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = text(":");
    			t5 = text(t5_value);
    			t6 = space();
    			p1 = element("p");
    			span1 = element("span");
    			span1.textContent = "Login";
    			t8 = space();
    			t9 = text(t9_value);
    			t10 = text(":");
    			t11 = text(t11_value);
    			t12 = space();
    			p2 = element("p");
    			span2 = element("span");
    			span2.textContent = "Status";
    			t14 = space();
    			t15 = text(t15_value);
    			t16 = space();
    			p3 = element("p");
    			span3 = element("span");
    			span3.textContent = "Actions";
    			t18 = space();
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-code-branch label icon text-green svelte-v1j1cx");
    			toggle_class(i0, "unconfirmed", /*ssh*/ ctx[18].status == "unconfirmed");
    			add_location(i0, file$6, 459, 12, 9978);
    			attr_dev(span0, "class", "svelte-v1j1cx");
    			add_location(span0, file$6, 461, 14, 10131);
    			attr_dev(p0, "class", "label svelte-v1j1cx");
    			add_location(p0, file$6, 460, 12, 10098);
    			attr_dev(span1, "class", "svelte-v1j1cx");
    			add_location(span1, file$6, 465, 14, 10250);
    			attr_dev(p1, "class", "label svelte-v1j1cx");
    			add_location(p1, file$6, 464, 12, 10217);
    			attr_dev(span2, "class", "svelte-v1j1cx");
    			add_location(span2, file$6, 469, 14, 10381);
    			attr_dev(p2, "class", "label status svelte-v1j1cx");
    			add_location(p2, file$6, 468, 12, 10341);
    			attr_dev(span3, "class", "svelte-v1j1cx");
    			add_location(span3, file$6, 473, 14, 10495);
    			attr_dev(i1, "class", "far fa-trash-alt");
    			add_location(i1, file$6, 474, 14, 10531);
    			attr_dev(p3, "class", "label svelte-v1j1cx");
    			add_location(p3, file$6, 472, 12, 10462);
    			attr_dev(div, "class", "item svelte-v1j1cx");
    			add_location(div, file$6, 458, 10, 9946);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i0);
    			append_dev(div, t0);
    			append_dev(div, p0);
    			append_dev(p0, span0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(div, t6);
    			append_dev(div, p1);
    			append_dev(p1, span1);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			append_dev(p1, t10);
    			append_dev(p1, t11);
    			append_dev(div, t12);
    			append_dev(div, p2);
    			append_dev(p2, span2);
    			append_dev(p2, t14);
    			append_dev(p2, t15);
    			append_dev(div, t16);
    			append_dev(div, p3);
    			append_dev(p3, span3);
    			append_dev(p3, t18);
    			append_dev(p3, i1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*mySSHList*/ 8) {
    				toggle_class(i0, "unconfirmed", /*ssh*/ ctx[18].status == "unconfirmed");
    			}

    			if (dirty & /*mySSHList*/ 8 && t3_value !== (t3_value = /*ssh*/ ctx[18].ip + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*mySSHList*/ 8 && t5_value !== (t5_value = /*ssh*/ ctx[18].port + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*mySSHList*/ 8 && t9_value !== (t9_value = /*ssh*/ ctx[18].user + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*mySSHList*/ 8 && t11_value !== (t11_value = /*ssh*/ ctx[18].pass + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*mySSHList*/ 8 && t15_value !== (t15_value = /*ssh*/ ctx[18].status + "")) set_data_dev(t15, t15_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(458:8) {#each mySSHList as ssh}",
    		ctx
    	});

    	return block;
    }

    // (479:8) {#if mySSHList.length == 0}
    function create_if_block_8(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Your list is empty...";
    			attr_dev(h1, "class", "empty svelte-v1j1cx");
    			add_location(h1, file$6, 479, 10, 10665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(479:8) {#if mySSHList.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (509:8) {#if _Client.getTotalPageCount(active) > 1 && activePage == _Client.getTotalPageCount(active)}
    function create_if_block_6(ctx) {
    	let p;
    	let t_value = /*activePage*/ ctx[1] - 2 + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-v1j1cx");
    			add_location(p, file$6, 509, 10, 11686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					p,
    					"click",
    					function () {
    						if (is_function(/*nextPage*/ ctx[6](/*activePage*/ ctx[1] - 2))) /*nextPage*/ ctx[6](/*activePage*/ ctx[1] - 2).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*activePage*/ 2 && t_value !== (t_value = /*activePage*/ ctx[1] - 2 + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(509:8) {#if _Client.getTotalPageCount(active) > 1 && activePage == _Client.getTotalPageCount(active)}",
    		ctx
    	});

    	return block;
    }

    // (513:8) {#if activePage > 1}
    function create_if_block_5(ctx) {
    	let p;
    	let t_value = /*activePage*/ ctx[1] - 1 + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-v1j1cx");
    			add_location(p, file$6, 513, 10, 11809);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					p,
    					"click",
    					function () {
    						if (is_function(/*nextPage*/ ctx[6](/*activePage*/ ctx[1] - 1))) /*nextPage*/ ctx[6](/*activePage*/ ctx[1] - 1).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*activePage*/ 2 && t_value !== (t_value = /*activePage*/ ctx[1] - 1 + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(513:8) {#if activePage > 1}",
    		ctx
    	});

    	return block;
    }

    // (518:10) {#if activePage > 0}
    function create_if_block_3(ctx) {
    	let show_if = /*activePage*/ ctx[1] < /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1;
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*activePage, active*/ 3) show_if = /*activePage*/ ctx[1] < /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(518:10) {#if activePage > 0}",
    		ctx
    	});

    	return block;
    }

    // (519:12) {#if activePage < _Client.getTotalPageCount(active) - 1}
    function create_if_block_4(ctx) {
    	let p;
    	let t_value = /*i*/ ctx[15] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-v1j1cx");
    			toggle_class(p, "active", /*i*/ ctx[15] == /*activePage*/ ctx[1]);
    			add_location(p, file$6, 519, 14, 12181);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					p,
    					"click",
    					function () {
    						if (is_function(/*nextPage*/ ctx[6](/*i*/ ctx[15]))) /*nextPage*/ ctx[6](/*i*/ ctx[15]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*activePage, active*/ 3 && t_value !== (t_value = /*i*/ ctx[15] + "")) set_data_dev(t, t_value);

    			if (dirty & /*range, activePage, _Client, active*/ 515) {
    				toggle_class(p, "active", /*i*/ ctx[15] == /*activePage*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(519:12) {#if activePage < _Client.getTotalPageCount(active) - 1}",
    		ctx
    	});

    	return block;
    }

    // (517:8) {#each range(activePage, activePage == 1 ? activePage + 3 : (activePage + 2) > _Client.getTotalPageCount(active) ? activePage + 1 : activePage + 2, 1) as i}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*activePage*/ ctx[1] > 0 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*activePage*/ ctx[1] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(517:8) {#each range(activePage, activePage == 1 ? activePage + 3 : (activePage + 2) > _Client.getTotalPageCount(active) ? activePage + 1 : activePage + 2, 1) as i}",
    		ctx
    	});

    	return block;
    }

    // (525:8) {#if activePage == (_Client.getTotalPageCount(active) - 1)}
    function create_if_block_2(ctx) {
    	let p;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*activePage*/ ctx[1]);
    			attr_dev(p, "class", "svelte-v1j1cx");
    			toggle_class(p, "active", /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1);
    			add_location(p, file$6, 525, 10, 12389);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					p,
    					"click",
    					function () {
    						if (is_function(/*nextPage*/ ctx[6](/*activePage*/ ctx[1]))) /*nextPage*/ ctx[6](/*activePage*/ ctx[1]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*activePage*/ 2) set_data_dev(t, /*activePage*/ ctx[1]);

    			if (dirty & /*activePage, _Client, active*/ 515) {
    				toggle_class(p, "active", /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(525:8) {#if activePage == (_Client.getTotalPageCount(active) - 1)}",
    		ctx
    	});

    	return block;
    }

    // (529:8) {#if activePage == (_Client.getTotalPageCount(active) - 1)}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*activePage*/ ctx[1] + 1 + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-v1j1cx");
    			add_location(p, file$6, 529, 10, 12613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					p,
    					"click",
    					function () {
    						if (is_function(/*nextPage*/ ctx[6](/*activePage*/ ctx[1] + 1))) /*nextPage*/ ctx[6](/*activePage*/ ctx[1] + 1).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*activePage*/ 2 && t_value !== (t_value = /*activePage*/ ctx[1] + 1 + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(529:8) {#if activePage == (_Client.getTotalPageCount(active) - 1)}",
    		ctx
    	});

    	return block;
    }

    // (533:8) {#if activePage == _Client.getTotalPageCount(active)}
    function create_if_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*activePage*/ ctx[1]);
    			attr_dev(p, "class", "svelte-v1j1cx");
    			toggle_class(p, "active", /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]));
    			add_location(p, file$6, 533, 10, 12768);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*activePage*/ 2) set_data_dev(t, /*activePage*/ ctx[1]);

    			if (dirty & /*activePage, _Client, active*/ 515) {
    				toggle_class(p, "active", /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(533:8) {#if activePage == _Client.getTotalPageCount(active)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div10;
    	let div3;
    	let div0;
    	let p0;
    	let t1;
    	let div1;
    	let p1;
    	let t3;
    	let div2;
    	let p2;
    	let t5;
    	let div9;
    	let div6;
    	let div4;
    	let p3;
    	let t6;
    	let span;
    	let t7;
    	let t8;
    	let t9;
    	let div5;
    	let p4;
    	let i0;
    	let t10;
    	let div8;
    	let t11;
    	let div7;
    	let show_if_3 = /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) > 1 && /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]);
    	let t12;
    	let t13;
    	let t14;
    	let show_if_2 = /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1;
    	let t15;
    	let show_if_1 = /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1;
    	let t16;
    	let show_if = /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]);
    	let t17;
    	let div17;
    	let div15;
    	let div13;
    	let div11;
    	let p5;
    	let t19;
    	let div12;
    	let p6;
    	let i1;
    	let t20;
    	let div14;
    	let textarea;
    	let t21;
    	let div16;
    	let p7;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*active*/ ctx[0] == "ssh") return create_if_block_7;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = show_if_3 && create_if_block_6(ctx);
    	let if_block2 = /*activePage*/ ctx[1] > 1 && create_if_block_5(ctx);

    	let each_value = range(
    		/*activePage*/ ctx[1],
    		/*activePage*/ ctx[1] == 1
    		? /*activePage*/ ctx[1] + 3
    		: /*activePage*/ ctx[1] + 2 > /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0])
    			? /*activePage*/ ctx[1] + 1
    			: /*activePage*/ ctx[1] + 2,
    		1
    	);

    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block3 = show_if_2 && create_if_block_2(ctx);
    	let if_block4 = show_if_1 && create_if_block_1(ctx);
    	let if_block5 = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "SSH";
    			t1 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "Telnet";
    			t3 = space();
    			div2 = element("div");
    			p2 = element("p");
    			p2.textContent = "Check my List";
    			t5 = space();
    			div9 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			p3 = element("p");
    			t6 = text("List of ");
    			span = element("span");
    			t7 = text(/*active*/ ctx[0]);
    			t8 = text(" devices");
    			t9 = space();
    			div5 = element("div");
    			p4 = element("p");
    			i0 = element("i");
    			t10 = space();
    			div8 = element("div");
    			if_block0.c();
    			t11 = space();
    			div7 = element("div");
    			if (if_block1) if_block1.c();
    			t12 = space();
    			if (if_block2) if_block2.c();
    			t13 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t14 = space();
    			if (if_block3) if_block3.c();
    			t15 = space();
    			if (if_block4) if_block4.c();
    			t16 = space();
    			if (if_block5) if_block5.c();
    			t17 = space();
    			div17 = element("div");
    			div15 = element("div");
    			div13 = element("div");
    			div11 = element("div");
    			p5 = element("p");
    			p5.textContent = "Add bots";
    			t19 = space();
    			div12 = element("div");
    			p6 = element("p");
    			i1 = element("i");
    			t20 = space();
    			div14 = element("div");
    			textarea = element("textarea");
    			t21 = space();
    			div16 = element("div");
    			p7 = element("p");
    			p7.textContent = "Done";
    			attr_dev(p0, "class", "title svelte-v1j1cx");
    			add_location(p0, file$6, 437, 6, 9227);
    			attr_dev(div0, "class", "item svelte-v1j1cx");
    			toggle_class(div0, "active", /*active*/ ctx[0] == "ssh" ? true : false);
    			add_location(div0, file$6, 436, 4, 9124);
    			attr_dev(p1, "class", "title svelte-v1j1cx");
    			add_location(p1, file$6, 440, 6, 9378);
    			attr_dev(div1, "class", "item svelte-v1j1cx");
    			toggle_class(div1, "active", /*active*/ ctx[0] == "telnet" ? true : false);
    			add_location(div1, file$6, 439, 4, 9269);
    			attr_dev(p2, "class", "link svelte-v1j1cx");
    			add_location(p2, file$6, 443, 6, 9452);
    			attr_dev(div2, "class", "unready svelte-v1j1cx");
    			add_location(div2, file$6, 442, 4, 9423);
    			attr_dev(div3, "class", "switcher svelte-v1j1cx");
    			add_location(div3, file$6, 435, 2, 9096);
    			attr_dev(span, "class", "svelte-v1j1cx");
    			add_location(span, file$6, 449, 33, 9637);
    			attr_dev(p3, "class", "title svelte-v1j1cx");
    			add_location(p3, file$6, 449, 8, 9612);
    			attr_dev(div4, "class", "left svelte-v1j1cx");
    			add_location(div4, file$6, 448, 6, 9584);
    			attr_dev(i0, "class", "fas fa-plus icon add svelte-v1j1cx");
    			add_location(i0, file$6, 452, 63, 9778);
    			attr_dev(p4, "class", "font-awesome-sucks svelte-v1j1cx");
    			add_location(p4, file$6, 452, 8, 9723);
    			attr_dev(div5, "class", "right svelte-v1j1cx");
    			add_location(div5, file$6, 451, 6, 9694);
    			attr_dev(div6, "class", "head svelte-v1j1cx");
    			add_location(div6, file$6, 447, 4, 9558);
    			attr_dev(div7, "class", "pager svelte-v1j1cx");
    			add_location(div7, file$6, 507, 6, 11551);
    			attr_dev(div8, "class", "content svelte-v1j1cx");
    			add_location(div8, file$6, 455, 4, 9850);
    			attr_dev(div9, "class", "list svelte-v1j1cx");
    			add_location(div9, file$6, 446, 2, 9534);
    			attr_dev(div10, "class", "page-wrapper");
    			add_location(div10, file$6, 434, 0, 9066);
    			attr_dev(p5, "class", "title svelte-v1j1cx");
    			add_location(p5, file$6, 544, 8, 13038);
    			attr_dev(div11, "class", "left svelte-v1j1cx");
    			add_location(div11, file$6, 543, 6, 13010);
    			attr_dev(i1, "class", "fa fa-times");
    			add_location(i1, file$6, 548, 10, 13197);
    			attr_dev(p6, "class", "font-awesome-sucks close-modal svelte-v1j1cx");
    			add_location(p6, file$6, 547, 8, 13118);
    			attr_dev(div12, "class", "right svelte-v1j1cx");
    			add_location(div12, file$6, 546, 6, 13089);
    			attr_dev(div13, "class", "head svelte-v1j1cx");
    			add_location(div13, file$6, 542, 4, 12984);
    			attr_dev(textarea, "placeholder", "IP:PORT:USERNAME:PASSWORD");
    			attr_dev(textarea, "spellcheck", "false");
    			attr_dev(textarea, "class", "svelte-v1j1cx");
    			add_location(textarea, file$6, 553, 6, 13299);
    			attr_dev(div14, "class", "content svelte-v1j1cx");
    			add_location(div14, file$6, 552, 4, 13270);
    			attr_dev(div15, "class", "inner svelte-v1j1cx");
    			add_location(div15, file$6, 541, 2, 12959);
    			attr_dev(p7, "class", "svelte-v1j1cx");
    			add_location(p7, file$6, 557, 4, 13482);
    			attr_dev(div16, "class", "done svelte-v1j1cx");
    			attr_dev(div16, "id", "done");
    			add_location(div16, file$6, 556, 2, 13448);
    			attr_dev(div17, "class", "modal-wrapper svelte-v1j1cx");
    			attr_dev(div17, "id", "modal");
    			add_location(div17, file$6, 540, 0, 12917);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div3);
    			append_dev(div3, div0);
    			append_dev(div0, p0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, p1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, p2);
    			append_dev(div10, t5);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div4);
    			append_dev(div4, p3);
    			append_dev(p3, t6);
    			append_dev(p3, span);
    			append_dev(span, t7);
    			append_dev(p3, t8);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, p4);
    			append_dev(p4, i0);
    			append_dev(div9, t10);
    			append_dev(div9, div8);
    			if_block0.m(div8, null);
    			append_dev(div8, t11);
    			append_dev(div8, div7);
    			if (if_block1) if_block1.m(div7, null);
    			append_dev(div7, t12);
    			if (if_block2) if_block2.m(div7, null);
    			append_dev(div7, t13);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div7, null);
    			}

    			append_dev(div7, t14);
    			if (if_block3) if_block3.m(div7, null);
    			append_dev(div7, t15);
    			if (if_block4) if_block4.m(div7, null);
    			append_dev(div7, t16);
    			if (if_block5) if_block5.m(div7, null);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div15);
    			append_dev(div15, div13);
    			append_dev(div13, div11);
    			append_dev(div11, p5);
    			append_dev(div13, t19);
    			append_dev(div13, div12);
    			append_dev(div12, p6);
    			append_dev(p6, i1);
    			append_dev(div15, t20);
    			append_dev(div15, div14);
    			append_dev(div14, textarea);
    			set_input_value(textarea, /*altList*/ ctx[2]);
    			append_dev(div17, t21);
    			append_dev(div17, div16);
    			append_dev(div16, p7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div0,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[5]("ssh"))) /*setActive*/ ctx[5]("ssh").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div1,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[5]("telnet"))) /*setActive*/ ctx[5]("telnet").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(p2, "click", /*checkList*/ ctx[11], false, false, false),
    					listen_dev(
    						p4,
    						"click",
    						function () {
    							if (is_function(/*toggleModal*/ ctx[7])) /*toggleModal*/ ctx[7].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						p6,
    						"click",
    						function () {
    							if (is_function(/*toggleModal*/ ctx[7])) /*toggleModal*/ ctx[7].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[13]),
    					listen_dev(
    						textarea,
    						"keyup",
    						function () {
    							if (is_function(/*isDone*/ ctx[8])) /*isDone*/ ctx[8].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(p7, "click", /*addToList*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*active*/ 1) {
    				toggle_class(div0, "active", /*active*/ ctx[0] == "ssh" ? true : false);
    			}

    			if (dirty & /*active*/ 1) {
    				toggle_class(div1, "active", /*active*/ ctx[0] == "telnet" ? true : false);
    			}

    			if (dirty & /*active*/ 1) set_data_dev(t7, /*active*/ ctx[0]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div8, t11);
    				}
    			}

    			if (dirty & /*active, activePage*/ 3) show_if_3 = /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) > 1 && /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]);

    			if (show_if_3) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(div7, t12);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*activePage*/ ctx[1] > 1) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					if_block2.m(div7, t13);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*range, activePage, _Client, active, nextPage*/ 579) {
    				each_value = range(
    					/*activePage*/ ctx[1],
    					/*activePage*/ ctx[1] == 1
    					? /*activePage*/ ctx[1] + 3
    					: /*activePage*/ ctx[1] + 2 > /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0])
    						? /*activePage*/ ctx[1] + 1
    						: /*activePage*/ ctx[1] + 2,
    					1
    				);

    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div7, t14);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*activePage, active*/ 3) show_if_2 = /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1;

    			if (show_if_2) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_2(ctx);
    					if_block3.c();
    					if_block3.m(div7, t15);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*activePage, active*/ 3) show_if_1 = /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]) - 1;

    			if (show_if_1) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					if_block4.m(div7, t16);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (dirty & /*activePage, active*/ 3) show_if = /*activePage*/ ctx[1] == /*_Client*/ ctx[9].getTotalPageCount(/*active*/ ctx[0]);

    			if (show_if) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block(ctx);
    					if_block5.c();
    					if_block5.m(div7, null);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (dirty & /*altList*/ 4) {
    				set_input_value(textarea, /*altList*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div17);
    			mounted = false;
    			run_all(dispose);
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
    	let { master } = $$props;

    	let active = "ssh",
    		activePage = 1,
    		isModalOpened = false,
    		altList = "",
    		_Client = new Client(master);

    	const addToList = () => {
    		_Client.addToList(altList);
    		$$invalidate(2, altList = "");
    		toggleModal();
    	};

    	const checkList = () => {
    		_Client.checkList(active);
    	};

    	let mySSHList = [], myTelnetList = [];
    	const writable_props = ["master"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Manage> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Manage", $$slots, []);

    	function textarea_input_handler() {
    		altList = this.value;
    		$$invalidate(2, altList);
    	}

    	$$self.$$set = $$props => {
    		if ("master" in $$props) $$invalidate(12, master = $$props.master);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		Client,
    		master,
    		active,
    		activePage,
    		isModalOpened,
    		altList,
    		_Client,
    		addToList,
    		checkList,
    		mySSHList,
    		myTelnetList,
    		setActive,
    		nextPage,
    		toggleModal,
    		isDone
    	});

    	$$self.$inject_state = $$props => {
    		if ("master" in $$props) $$invalidate(12, master = $$props.master);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("activePage" in $$props) $$invalidate(1, activePage = $$props.activePage);
    		if ("isModalOpened" in $$props) $$invalidate(14, isModalOpened = $$props.isModalOpened);
    		if ("altList" in $$props) $$invalidate(2, altList = $$props.altList);
    		if ("_Client" in $$props) $$invalidate(9, _Client = $$props._Client);
    		if ("mySSHList" in $$props) $$invalidate(3, mySSHList = $$props.mySSHList);
    		if ("myTelnetList" in $$props) $$invalidate(4, myTelnetList = $$props.myTelnetList);
    		if ("setActive" in $$props) $$invalidate(5, setActive = $$props.setActive);
    		if ("nextPage" in $$props) $$invalidate(6, nextPage = $$props.nextPage);
    		if ("toggleModal" in $$props) $$invalidate(7, toggleModal = $$props.toggleModal);
    		if ("isDone" in $$props) $$invalidate(8, isDone = $$props.isDone);
    	};

    	let setActive;
    	let nextPage;
    	let toggleModal;
    	let isDone;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*active*/ 1) {
    			 $$invalidate(6, nextPage = page => {
    				Math.abs(_Client.getTotalPageCount(active) - 2);
    				$$invalidate(1, activePage = page);
    			});
    		}

    		if ($$self.$$.dirty & /*isModalOpened*/ 16384) {
    			 $$invalidate(7, toggleModal = () => {
    				document.getElementById("modal").style.display = isModalOpened ? "none" : "block";
    				$$invalidate(14, isModalOpened = !isModalOpened);
    			});
    		}

    		if ($$self.$$.dirty & /*altList*/ 4) {
    			 $$invalidate(8, isDone = () => {
    				document.getElementById("done").style.display = altList.length > 0 ? "block" : "none";
    			});
    		}

    		if ($$self.$$.dirty & /*activePage*/ 2) {
    			 $$invalidate(3, mySSHList = _Client.getListToPage(activePage, "ssh"));
    		}

    		if ($$self.$$.dirty & /*activePage*/ 2) {
    			 $$invalidate(4, myTelnetList = _Client.getListToPage(activePage, "telnet"));
    		}
    	};

    	 $$invalidate(5, setActive = list => {
    		$$invalidate(0, active = list);
    	});

    	return [
    		active,
    		activePage,
    		altList,
    		mySSHList,
    		myTelnetList,
    		setActive,
    		nextPage,
    		toggleModal,
    		isDone,
    		_Client,
    		addToList,
    		checkList,
    		master,
    		textarea_input_handler
    	];
    }

    class Manage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { master: 12 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Manage",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*master*/ ctx[12] === undefined && !("master" in props)) {
    			console.warn("<Manage> was created without expected prop 'master'");
    		}
    	}

    	get master() {
    		throw new Error("<Manage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set master(value) {
    		throw new Error("<Manage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\dashboard.svelte generated by Svelte v3.24.1 */
    const file$7 = "src\\components\\dashboard.svelte";

    // (229:32) 
    function create_if_block_5$1(ctx) {
    	let manage;
    	let current;

    	manage = new Manage({
    			props: { master: /*master*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(manage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(manage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const manage_changes = {};
    			if (dirty & /*master*/ 1) manage_changes.master = /*master*/ ctx[0];
    			manage.$set(manage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(manage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(manage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(manage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(229:32) ",
    		ctx
    	});

    	return block;
    }

    // (227:31) 
    function create_if_block_4$1(ctx) {
    	let shell;
    	let current;

    	shell = new Shell({
    			props: { master: /*master*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const shell_changes = {};
    			if (dirty & /*master*/ 1) shell_changes.master = /*master*/ ctx[0];
    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(227:31) ",
    		ctx
    	});

    	return block;
    }

    // (225:33) 
    function create_if_block_3$1(ctx) {
    	let selfrep;
    	let current;

    	selfrep = new Selfrep({
    			props: { master: /*master*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(selfrep.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(selfrep, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const selfrep_changes = {};
    			if (dirty & /*master*/ 1) selfrep_changes.master = /*master*/ ctx[0];
    			selfrep.$set(selfrep_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selfrep.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selfrep.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selfrep, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(225:33) ",
    		ctx
    	});

    	return block;
    }

    // (223:32) 
    function create_if_block_2$1(ctx) {
    	let attack;
    	let current;

    	attack = new Attack({
    			props: { master: /*master*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(attack.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(attack, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const attack_changes = {};
    			if (dirty & /*master*/ 1) attack_changes.master = /*master*/ ctx[0];
    			attack.$set(attack_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attack.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attack.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(attack, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(223:32) ",
    		ctx
    	});

    	return block;
    }

    // (221:32) 
    function create_if_block_1$1(ctx) {
    	let crypto;
    	let current;

    	crypto = new Crypto({
    			props: { master: /*master*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(crypto.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(crypto, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const crypto_changes = {};
    			if (dirty & /*master*/ 1) crypto_changes.master = /*master*/ ctx[0];
    			crypto.$set(crypto_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(crypto.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(crypto.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(crypto, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(221:32) ",
    		ctx
    	});

    	return block;
    }

    // (219:2) {#if active == 'dashboard'}
    function create_if_block$1(ctx) {
    	let dashboard;
    	let current;

    	dashboard = new Dashboard({
    			props: { master: /*master*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dashboard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dashboard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dashboard_changes = {};
    			if (dirty & /*master*/ 1) dashboard_changes.master = /*master*/ ctx[0];
    			dashboard.$set(dashboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dashboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dashboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dashboard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(219:2) {#if active == 'dashboard'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let framebar;
    	let t0;
    	let div3;
    	let div2;
    	let div0;
    	let span0;
    	let i0;
    	let t1;
    	let p0;
    	let t3;
    	let span1;
    	let i1;
    	let t4;
    	let p1;
    	let t6;
    	let span2;
    	let i2;
    	let t7;
    	let p2;
    	let t9;
    	let span3;
    	let i3;
    	let t10;
    	let p3;
    	let t12;
    	let span4;
    	let i4;
    	let t13;
    	let p4;
    	let t15;
    	let span5;
    	let i5;
    	let t16;
    	let p5;
    	let t18;
    	let div1;
    	let i6;
    	let t19;
    	let p6;
    	let t21;
    	let span6;
    	let t23;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	framebar = new Frame({ $$inline: true });

    	const if_block_creators = [
    		create_if_block$1,
    		create_if_block_1$1,
    		create_if_block_2$1,
    		create_if_block_3$1,
    		create_if_block_4$1,
    		create_if_block_5$1
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*active*/ ctx[1] == "dashboard") return 0;
    		if (/*active*/ ctx[1] == "crypto") return 1;
    		if (/*active*/ ctx[1] == "attack") return 2;
    		if (/*active*/ ctx[1] == "selfrep") return 3;
    		if (/*active*/ ctx[1] == "shell") return 4;
    		if (/*active*/ ctx[1] == "manage") return 5;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			create_component(framebar.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			i0 = element("i");
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Dashboard";
    			t3 = space();
    			span1 = element("span");
    			i1 = element("i");
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Crypto";
    			t6 = space();
    			span2 = element("span");
    			i2 = element("i");
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Attack";
    			t9 = space();
    			span3 = element("span");
    			i3 = element("i");
    			t10 = space();
    			p3 = element("p");
    			p3.textContent = "Selfrep";
    			t12 = space();
    			span4 = element("span");
    			i4 = element("i");
    			t13 = space();
    			p4 = element("p");
    			p4.textContent = "Shell";
    			t15 = space();
    			span5 = element("span");
    			i5 = element("i");
    			t16 = space();
    			p5 = element("p");
    			p5.textContent = "Manage";
    			t18 = space();
    			div1 = element("div");
    			i6 = element("i");
    			t19 = space();
    			p6 = element("p");
    			p6.textContent = "Account";
    			t21 = space();
    			span6 = element("span");
    			span6.textContent = "Lifetime";
    			t23 = space();
    			if (if_block) if_block.c();
    			attr_dev(i0, "class", "fas fa-chart-line item-icon svelte-a5iwd2");
    			add_location(i0, file$7, 166, 8, 3300);
    			attr_dev(p0, "class", "menu-item svelte-a5iwd2");
    			toggle_class(p0, "hidden", /*active*/ ctx[1] != "dashboard" ? true : false);
    			add_location(p0, file$7, 167, 8, 3353);
    			attr_dev(span0, "class", "menu-item-wrapper svelte-a5iwd2");
    			toggle_class(span0, "active", /*active*/ ctx[1] == "dashboard" ? true : false);
    			toggle_class(span0, "min", /*active*/ ctx[1] != "dashboard" ? true : false);
    			add_location(span0, file$7, 161, 6, 3084);
    			attr_dev(i1, "class", "fab fa-bitcoin item-icon svelte-a5iwd2");
    			add_location(i1, file$7, 174, 8, 3671);
    			attr_dev(p1, "class", "menu-item svelte-a5iwd2");
    			toggle_class(p1, "hidden", /*active*/ ctx[1] != "crypto" ? true : false);
    			add_location(p1, file$7, 175, 8, 3721);
    			attr_dev(span1, "class", "menu-item-wrapper svelte-a5iwd2");
    			toggle_class(span1, "active", /*active*/ ctx[1] == "crypto" ? true : false);
    			toggle_class(span1, "min", /*active*/ ctx[1] != "crypto" ? true : false);
    			add_location(span1, file$7, 169, 6, 3463);
    			attr_dev(i2, "class", "fas fa-robot item-icon svelte-a5iwd2");
    			add_location(i2, file$7, 182, 8, 4032);
    			attr_dev(p2, "class", "menu-item svelte-a5iwd2");
    			toggle_class(p2, "hidden", /*active*/ ctx[1] != "attack" ? true : false);
    			add_location(p2, file$7, 183, 8, 4080);
    			attr_dev(span2, "class", "menu-item-wrapper svelte-a5iwd2");
    			toggle_class(span2, "active", /*active*/ ctx[1] == "attack" ? true : false);
    			toggle_class(span2, "min", /*active*/ ctx[1] != "attack" ? true : false);
    			add_location(span2, file$7, 177, 6, 3825);
    			attr_dev(i3, "class", "far fa-clone item-icon svelte-a5iwd2");
    			add_location(i3, file$7, 190, 8, 4392);
    			attr_dev(p3, "class", "menu-item svelte-a5iwd2");
    			toggle_class(p3, "hidden", /*active*/ ctx[1] != "selfrep" ? true : false);
    			add_location(p3, file$7, 191, 8, 4440);
    			attr_dev(span3, "class", "menu-item-wrapper svelte-a5iwd2");
    			toggle_class(span3, "active", /*active*/ ctx[1] == "selfrep" ? true : false);
    			toggle_class(span3, "min", /*active*/ ctx[1] != "selfrep" ? true : false);
    			add_location(span3, file$7, 185, 6, 4184);
    			attr_dev(i4, "class", "fas fa-terminal item-icon svelte-a5iwd2");
    			add_location(i4, file$7, 198, 8, 4750);
    			attr_dev(p4, "class", "menu-item svelte-a5iwd2");
    			toggle_class(p4, "hidden", /*active*/ ctx[1] != "shell" ? true : false);
    			add_location(p4, file$7, 199, 8, 4801);
    			attr_dev(span4, "class", "menu-item-wrapper svelte-a5iwd2");
    			toggle_class(span4, "active", /*active*/ ctx[1] == "shell" ? true : false);
    			toggle_class(span4, "min", /*active*/ ctx[1] != "shell" ? true : false);
    			add_location(span4, file$7, 193, 6, 4546);
    			attr_dev(i5, "class", "far fa-plus-square item-icon svelte-a5iwd2");
    			add_location(i5, file$7, 206, 8, 5108);
    			attr_dev(p5, "class", "menu-item svelte-a5iwd2");
    			toggle_class(p5, "hidden", /*active*/ ctx[1] != "manage" ? true : false);
    			add_location(p5, file$7, 207, 8, 5162);
    			attr_dev(span5, "class", "menu-item-wrapper svelte-a5iwd2");
    			toggle_class(span5, "active", /*active*/ ctx[1] == "manage" ? true : false);
    			toggle_class(span5, "min", /*active*/ ctx[1] != "manage" ? true : false);
    			add_location(span5, file$7, 201, 6, 4903);
    			attr_dev(div0, "class", "menu-bar svelte-a5iwd2");
    			add_location(div0, file$7, 160, 4, 3054);
    			attr_dev(i6, "class", "far fa-user icon svelte-a5iwd2");
    			add_location(i6, file$7, 212, 6, 5310);
    			attr_dev(p6, "class", "svelte-a5iwd2");
    			add_location(p6, file$7, 213, 6, 5350);
    			attr_dev(span6, "class", "license-end svelte-a5iwd2");
    			add_location(span6, file$7, 214, 6, 5372);
    			attr_dev(div1, "class", "user-bar svelte-a5iwd2");
    			add_location(div1, file$7, 211, 4, 5280);
    			attr_dev(div2, "class", "menu svelte-a5iwd2");
    			add_location(div2, file$7, 159, 2, 3030);
    			attr_dev(div3, "class", "wrapper svelte-a5iwd2");
    			add_location(div3, file$7, 158, 0, 3005);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(framebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(span0, i0);
    			append_dev(span0, t1);
    			append_dev(span0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(span1, i1);
    			append_dev(span1, t4);
    			append_dev(span1, p1);
    			append_dev(div0, t6);
    			append_dev(div0, span2);
    			append_dev(span2, i2);
    			append_dev(span2, t7);
    			append_dev(span2, p2);
    			append_dev(div0, t9);
    			append_dev(div0, span3);
    			append_dev(span3, i3);
    			append_dev(span3, t10);
    			append_dev(span3, p3);
    			append_dev(div0, t12);
    			append_dev(div0, span4);
    			append_dev(span4, i4);
    			append_dev(span4, t13);
    			append_dev(span4, p4);
    			append_dev(div0, t15);
    			append_dev(div0, span5);
    			append_dev(span5, i5);
    			append_dev(span5, t16);
    			append_dev(span5, p5);
    			append_dev(div2, t18);
    			append_dev(div2, div1);
    			append_dev(div1, i6);
    			append_dev(div1, t19);
    			append_dev(div1, p6);
    			append_dev(div1, t21);
    			append_dev(div1, span6);
    			append_dev(div3, t23);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div3, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						span0,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[2]("dashboard"))) /*setActive*/ ctx[2]("dashboard").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span1,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[2]("crypto"))) /*setActive*/ ctx[2]("crypto").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span2,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[2]("attack"))) /*setActive*/ ctx[2]("attack").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span3,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[2]("selfrep"))) /*setActive*/ ctx[2]("selfrep").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span4,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[2]("shell"))) /*setActive*/ ctx[2]("shell").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span5,
    						"click",
    						function () {
    							if (is_function(/*setActive*/ ctx[2]("manage"))) /*setActive*/ ctx[2]("manage").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*active*/ 2) {
    				toggle_class(p0, "hidden", /*active*/ ctx[1] != "dashboard" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span0, "active", /*active*/ ctx[1] == "dashboard" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span0, "min", /*active*/ ctx[1] != "dashboard" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(p1, "hidden", /*active*/ ctx[1] != "crypto" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span1, "active", /*active*/ ctx[1] == "crypto" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span1, "min", /*active*/ ctx[1] != "crypto" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(p2, "hidden", /*active*/ ctx[1] != "attack" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span2, "active", /*active*/ ctx[1] == "attack" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span2, "min", /*active*/ ctx[1] != "attack" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(p3, "hidden", /*active*/ ctx[1] != "selfrep" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span3, "active", /*active*/ ctx[1] == "selfrep" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span3, "min", /*active*/ ctx[1] != "selfrep" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(p4, "hidden", /*active*/ ctx[1] != "shell" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span4, "active", /*active*/ ctx[1] == "shell" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span4, "min", /*active*/ ctx[1] != "shell" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(p5, "hidden", /*active*/ ctx[1] != "manage" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span5, "active", /*active*/ ctx[1] == "manage" ? true : false);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(span5, "min", /*active*/ ctx[1] != "manage" ? true : false);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(framebar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(framebar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(framebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			run_all(dispose);
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
    	let { master } = $$props;
    	let active = "manage";
    	const writable_props = ["master"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("master" in $$props) $$invalidate(0, master = $$props.master);
    	};

    	$$self.$capture_state = () => ({
    		FrameBar: Frame,
    		Dashboard,
    		Crypto,
    		Attack,
    		Selfrep,
    		Shell,
    		Manage,
    		master,
    		active,
    		setActive
    	});

    	$$self.$inject_state = $$props => {
    		if ("master" in $$props) $$invalidate(0, master = $$props.master);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("setActive" in $$props) $$invalidate(2, setActive = $$props.setActive);
    	};

    	let setActive;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(2, setActive = page => {
    		$$invalidate(1, active = page);
    	});

    	return [master, active, setActive];
    }

    class Dashboard_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { master: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard_1",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*master*/ ctx[0] === undefined && !("master" in props)) {
    			console.warn("<Dashboard> was created without expected prop 'master'");
    		}
    	}

    	get master() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set master(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */

    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

    var parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];

    var parseuri = function parseuri(str) {
        var src = str,
            b = str.indexOf('['),
            e = str.indexOf(']');

        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }

        var m = re.exec(str || ''),
            uri = {},
            i = 14;

        while (i--) {
            uri[parts[i]] = m[i] || '';
        }

        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }

        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);

        return uri;
    };

    function pathNames(obj, path) {
        var regx = /\/{2,9}/g,
            names = path.replace(regx, "/").split("/");

        if (path.substr(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.substr(path.length - 1, 1) == '/') {
            names.splice(names.length - 1, 1);
        }

        return names;
    }

    function queryKey(uri, query) {
        var data = {};

        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });

        return data;
    }

    /**
     * Helpers.
     */

    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, 'day');
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, 'hour');
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, 'minute');
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common = setup;

    var browser = createCommonjsModule(function (module, exports) {
    /* eslint-env browser */

    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    var url_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.url = void 0;

    const debug = browser("socket.io-client:url");
    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                debug("protocol-less url %s", uri);
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            debug("parse %s", uri);
            obj = parseuri(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }
    exports.url = url;
    });

    var hasCors = createCommonjsModule(function (module) {
    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

    try {
      module.exports = typeof XMLHttpRequest !== 'undefined' &&
        'withCredentials' in new XMLHttpRequest();
    } catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
      module.exports = false;
    }
    });

    var globalThis_browser = (() => {
      if (typeof self !== "undefined") {
        return self;
      } else if (typeof window !== "undefined") {
        return window;
      } else {
        return Function("return this")();
      }
    })();

    // browser shim for xmlhttprequest module




    var xmlhttprequest = function(opts) {
      const xdomain = opts.xdomain;

      // scheme must be same when usign XDomainRequest
      // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
      const xscheme = opts.xscheme;

      // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
      // https://github.com/Automattic/engine.io-client/pull/217
      const enablesXDR = opts.enablesXDR;

      // XMLHttpRequest can be disabled on IE
      try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
          return new XMLHttpRequest();
        }
      } catch (e) {}

      // Use XDomainRequest for IE8 if enablesXDR is true
      // because loading bar keeps flashing when using jsonp-polling
      // https://github.com/yujiosaka/socke.io-ie8-loading-example
      try {
        if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
          return new XDomainRequest();
        }
      } catch (e) {}

      if (!xdomain) {
        try {
          return new globalThis_browser[["Active"].concat("Object").join("X")](
            "Microsoft.XMLHTTP"
          );
        } catch (e) {}
      }
    };

    const PACKET_TYPES = Object.create(null); // no Map = no polyfill
    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";

    const PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach(key => {
      PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });

    const ERROR_PACKET = { type: "error", data: "parser error" };

    var commons = {
      PACKET_TYPES,
      PACKET_TYPES_REVERSE,
      ERROR_PACKET
    };

    const { PACKET_TYPES: PACKET_TYPES$1 } = commons;

    const withNativeBlob =
      typeof Blob === "function" ||
      (typeof Blob !== "undefined" &&
        Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer = typeof ArrayBuffer === "function";

    // ArrayBuffer.isView method is not defined in IE10
    const isView = obj => {
      return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj && obj.buffer instanceof ArrayBuffer;
    };

    const encodePacket = ({ type, data }, supportsBinary, callback) => {
      if (withNativeBlob && data instanceof Blob) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(data, callback);
        }
      } else if (
        withNativeArrayBuffer &&
        (data instanceof ArrayBuffer || isView(data))
      ) {
        if (supportsBinary) {
          return callback(data instanceof ArrayBuffer ? data : data.buffer);
        } else {
          return encodeBlobAsBase64(new Blob([data]), callback);
        }
      }
      // plain string
      return callback(PACKET_TYPES$1[type] + (data || ""));
    };

    const encodeBlobAsBase64 = (data, callback) => {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const content = fileReader.result.split(",")[1];
        callback("b" + content);
      };
      return fileReader.readAsDataURL(data);
    };

    var encodePacket_browser = encodePacket;

    var base64Arraybuffer = createCommonjsModule(function (module, exports) {
    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */
    (function(chars){

      exports.encode = function(arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64 = "";

        for (i = 0; i < len; i+=3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
          base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
          base64 += chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
      };

      exports.decode =  function(base64) {
        var bufferLength = base64.length * 0.75,
        len = base64.length, i, p = 0,
        encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i+=4) {
          encoded1 = chars.indexOf(base64[i]);
          encoded2 = chars.indexOf(base64[i+1]);
          encoded3 = chars.indexOf(base64[i+2]);
          encoded4 = chars.indexOf(base64[i+3]);

          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
      };
    })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
    });

    const { PACKET_TYPES_REVERSE: PACKET_TYPES_REVERSE$1, ERROR_PACKET: ERROR_PACKET$1 } = commons;

    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";

    let base64decoder;
    if (withNativeArrayBuffer$1) {
      base64decoder = base64Arraybuffer;
    }

    const decodePacket = (encodedPacket, binaryType) => {
      if (typeof encodedPacket !== "string") {
        return {
          type: "message",
          data: mapBinary(encodedPacket, binaryType)
        };
      }
      const type = encodedPacket.charAt(0);
      if (type === "b") {
        return {
          type: "message",
          data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
      }
      const packetType = PACKET_TYPES_REVERSE$1[type];
      if (!packetType) {
        return ERROR_PACKET$1;
      }
      return encodedPacket.length > 1
        ? {
            type: PACKET_TYPES_REVERSE$1[type],
            data: encodedPacket.substring(1)
          }
        : {
            type: PACKET_TYPES_REVERSE$1[type]
          };
    };

    const decodeBase64Packet = (data, binaryType) => {
      if (base64decoder) {
        const decoded = base64decoder.decode(data);
        return mapBinary(decoded, binaryType);
      } else {
        return { base64: true, data }; // fallback for old browsers
      }
    };

    const mapBinary = (data, binaryType) => {
      switch (binaryType) {
        case "blob":
          return data instanceof ArrayBuffer ? new Blob([data]) : data;
        case "arraybuffer":
        default:
          return data; // assuming the data is already an ArrayBuffer
      }
    };

    var decodePacket_browser = decodePacket;

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

    const encodePayload = (packets, callback) => {
      // some packets may be added to the array while encoding, so the initial length must be saved
      const length = packets.length;
      const encodedPackets = new Array(length);
      let count = 0;

      packets.forEach((packet, i) => {
        // force base64 encoding for binary packets
        encodePacket_browser(packet, false, encodedPacket => {
          encodedPackets[i] = encodedPacket;
          if (++count === length) {
            callback(encodedPackets.join(SEPARATOR));
          }
        });
      });
    };

    const decodePayload = (encodedPayload, binaryType) => {
      const encodedPackets = encodedPayload.split(SEPARATOR);
      const packets = [];
      for (let i = 0; i < encodedPackets.length; i++) {
        const decodedPacket = decodePacket_browser(encodedPackets[i], binaryType);
        packets.push(decodedPacket);
        if (decodedPacket.type === "error") {
          break;
        }
      }
      return packets;
    };

    var lib = {
      protocol: 4,
      encodePacket: encodePacket_browser,
      encodePayload,
      decodePacket: decodePacket_browser,
      decodePayload
    };

    var componentEmitter = createCommonjsModule(function (module) {
    /**
     * Expose `Emitter`.
     */

    {
      module.exports = Emitter;
    }

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };
    });

    const debug = browser("engine.io-client:transport");

    class Transport extends componentEmitter {
      /**
       * Transport abstract constructor.
       *
       * @param {Object} options.
       * @api private
       */
      constructor(opts) {
        super();

        this.opts = opts;
        this.query = opts.query;
        this.readyState = "";
        this.socket = opts.socket;
      }

      /**
       * Emits an error.
       *
       * @param {String} str
       * @return {Transport} for chaining
       * @api public
       */
      onError(msg, desc) {
        const err = new Error(msg);
        err.type = "TransportError";
        err.description = desc;
        this.emit("error", err);
        return this;
      }

      /**
       * Opens the transport.
       *
       * @api public
       */
      open() {
        if ("closed" === this.readyState || "" === this.readyState) {
          this.readyState = "opening";
          this.doOpen();
        }

        return this;
      }

      /**
       * Closes the transport.
       *
       * @api private
       */
      close() {
        if ("opening" === this.readyState || "open" === this.readyState) {
          this.doClose();
          this.onClose();
        }

        return this;
      }

      /**
       * Sends multiple packets.
       *
       * @param {Array} packets
       * @api private
       */
      send(packets) {
        if ("open" === this.readyState) {
          this.write(packets);
        } else {
          // this might happen if the transport was silently closed in the beforeunload event handler
          debug("transport is not open, discarding packets");
        }
      }

      /**
       * Called upon open
       *
       * @api private
       */
      onOpen() {
        this.readyState = "open";
        this.writable = true;
        this.emit("open");
      }

      /**
       * Called with data.
       *
       * @param {String} data
       * @api private
       */
      onData(data) {
        const packet = lib.decodePacket(data, this.socket.binaryType);
        this.onPacket(packet);
      }

      /**
       * Called with a decoded packet.
       */
      onPacket(packet) {
        this.emit("packet", packet);
      }

      /**
       * Called upon close.
       *
       * @api private
       */
      onClose() {
        this.readyState = "closed";
        this.emit("close");
      }
    }

    var transport = Transport;

    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */

    var encode = function (obj) {
      var str = '';

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (str.length) str += '&';
          str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
      }

      return str;
    };

    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */

    var decode = function(qs){
      var qry = {};
      var pairs = qs.split('&');
      for (var i = 0, l = pairs.length; i < l; i++) {
        var pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return qry;
    };

    var parseqs = {
    	encode: encode,
    	decode: decode
    };

    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
      , length = 64
      , map = {}
      , seed = 0
      , i = 0
      , prev;

    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode$1(num) {
      var encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }

    /**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */
    function decode$1(str) {
      var decoded = 0;

      for (i = 0; i < str.length; i++) {
        decoded = decoded * length + map[str.charAt(i)];
      }

      return decoded;
    }

    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
      var now = encode$1(+new Date());

      if (now !== prev) return seed = 0, prev = now;
      return now +'.'+ encode$1(seed++);
    }

    //
    // Map each character to its index.
    //
    for (; i < length; i++) map[alphabet[i]] = i;

    //
    // Expose the `yeast`, `encode` and `decode` functions.
    //
    yeast.encode = encode$1;
    yeast.decode = decode$1;
    var yeast_1 = yeast;

    const debug$1 = browser("engine.io-client:polling");

    class Polling extends transport {
      /**
       * Transport name.
       */
      get name() {
        return "polling";
      }

      /**
       * Opens the socket (triggers polling). We write a PING message to determine
       * when the transport is open.
       *
       * @api private
       */
      doOpen() {
        this.poll();
      }

      /**
       * Pauses polling.
       *
       * @param {Function} callback upon buffers are flushed and transport is paused
       * @api private
       */
      pause(onPause) {
        const self = this;

        this.readyState = "pausing";

        function pause() {
          debug$1("paused");
          self.readyState = "paused";
          onPause();
        }

        if (this.polling || !this.writable) {
          let total = 0;

          if (this.polling) {
            debug$1("we are currently polling - waiting to pause");
            total++;
            this.once("pollComplete", function() {
              debug$1("pre-pause polling complete");
              --total || pause();
            });
          }

          if (!this.writable) {
            debug$1("we are currently writing - waiting to pause");
            total++;
            this.once("drain", function() {
              debug$1("pre-pause writing complete");
              --total || pause();
            });
          }
        } else {
          pause();
        }
      }

      /**
       * Starts polling cycle.
       *
       * @api public
       */
      poll() {
        debug$1("polling");
        this.polling = true;
        this.doPoll();
        this.emit("poll");
      }

      /**
       * Overloads onData to detect payloads.
       *
       * @api private
       */
      onData(data) {
        const self = this;
        debug$1("polling got data %s", data);
        const callback = function(packet, index, total) {
          // if its the first message we consider the transport open
          if ("opening" === self.readyState && packet.type === "open") {
            self.onOpen();
          }

          // if its a close packet, we close the ongoing requests
          if ("close" === packet.type) {
            self.onClose();
            return false;
          }

          // otherwise bypass onData and handle the message
          self.onPacket(packet);
        };

        // decode payload
        lib.decodePayload(data, this.socket.binaryType).forEach(callback);

        // if an event did not trigger closing
        if ("closed" !== this.readyState) {
          // if we got data we're not polling
          this.polling = false;
          this.emit("pollComplete");

          if ("open" === this.readyState) {
            this.poll();
          } else {
            debug$1('ignoring poll - transport state "%s"', this.readyState);
          }
        }
      }

      /**
       * For polling, send a close packet.
       *
       * @api private
       */
      doClose() {
        const self = this;

        function close() {
          debug$1("writing close packet");
          self.write([{ type: "close" }]);
        }

        if ("open" === this.readyState) {
          debug$1("transport open - closing");
          close();
        } else {
          // in case we're trying to close while
          // handshaking is in progress (GH-164)
          debug$1("transport not open - deferring close");
          this.once("open", close);
        }
      }

      /**
       * Writes a packets payload.
       *
       * @param {Array} data packets
       * @param {Function} drain callback
       * @api private
       */
      write(packets) {
        this.writable = false;

        lib.encodePayload(packets, data => {
          this.doWrite(data, () => {
            this.writable = true;
            this.emit("drain");
          });
        });
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "https" : "http";
        let port = "";

        // cache busting is forced
        if (false !== this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        if (!this.supportsBinary && !query.sid) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("https" === schema && Number(this.opts.port) !== 443) ||
            ("http" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }
    }

    var polling = Polling;

    var pick = (obj, ...attr) => {
      return attr.reduce((acc, k) => {
        if (obj.hasOwnProperty(k)) {
          acc[k] = obj[k];
        }
        return acc;
      }, {});
    };

    var util = {
    	pick: pick
    };

    /* global attachEvent */




    const { pick: pick$1 } = util;


    const debug$2 = browser("engine.io-client:polling-xhr");

    /**
     * Empty function
     */

    function empty$1() {}

    const hasXHR2 = (function() {
      const xhr = new xmlhttprequest({ xdomain: false });
      return null != xhr.responseType;
    })();

    class XHR extends polling {
      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @api public
       */
      constructor(opts) {
        super(opts);

        if (typeof location !== "undefined") {
          const isSSL = "https:" === location.protocol;
          let port = location.port;

          // some user agents have empty `location.port`
          if (!port) {
            port = isSSL ? 443 : 80;
          }

          this.xd =
            (typeof location !== "undefined" &&
              opts.hostname !== location.hostname) ||
            port !== opts.port;
          this.xs = opts.secure !== isSSL;
        }
        /**
         * XHR supports binary
         */
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
      }

      /**
       * Creates a request.
       *
       * @param {String} method
       * @api private
       */
      request(opts = {}) {
        Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
        return new Request(this.uri(), opts);
      }

      /**
       * Sends data.
       *
       * @param {String} data to send.
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        const req = this.request({
          method: "POST",
          data: data
        });
        const self = this;
        req.on("success", fn);
        req.on("error", function(err) {
          self.onError("xhr post error", err);
        });
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        debug$2("xhr poll");
        const req = this.request();
        const self = this;
        req.on("data", function(data) {
          self.onData(data);
        });
        req.on("error", function(err) {
          self.onError("xhr poll error", err);
        });
        this.pollXhr = req;
      }
    }

    class Request extends componentEmitter {
      /**
       * Request constructor
       *
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts) {
        super();
        this.opts = opts;

        this.method = opts.method || "GET";
        this.uri = uri;
        this.async = false !== opts.async;
        this.data = undefined !== opts.data ? opts.data : null;

        this.create();
      }

      /**
       * Creates the XHR object and sends the request.
       *
       * @api private
       */
      create() {
        const opts = pick$1(
          this.opts,
          "agent",
          "enablesXDR",
          "pfx",
          "key",
          "passphrase",
          "cert",
          "ca",
          "ciphers",
          "rejectUnauthorized",
          "autoUnref"
        );
        opts.xdomain = !!this.opts.xd;
        opts.xscheme = !!this.opts.xs;

        const xhr = (this.xhr = new xmlhttprequest(opts));
        const self = this;

        try {
          debug$2("xhr open %s: %s", this.method, this.uri);
          xhr.open(this.method, this.uri, this.async);
          try {
            if (this.opts.extraHeaders) {
              xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
              for (let i in this.opts.extraHeaders) {
                if (this.opts.extraHeaders.hasOwnProperty(i)) {
                  xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                }
              }
            }
          } catch (e) {}

          if ("POST" === this.method) {
            try {
              xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
            } catch (e) {}
          }

          try {
            xhr.setRequestHeader("Accept", "*/*");
          } catch (e) {}

          // ie6 check
          if ("withCredentials" in xhr) {
            xhr.withCredentials = this.opts.withCredentials;
          }

          if (this.opts.requestTimeout) {
            xhr.timeout = this.opts.requestTimeout;
          }

          if (this.hasXDR()) {
            xhr.onload = function() {
              self.onLoad();
            };
            xhr.onerror = function() {
              self.onError(xhr.responseText);
            };
          } else {
            xhr.onreadystatechange = function() {
              if (4 !== xhr.readyState) return;
              if (200 === xhr.status || 1223 === xhr.status) {
                self.onLoad();
              } else {
                // make sure the `error` event handler that's user-set
                // does not throw in the same tick and gets caught here
                setTimeout(function() {
                  self.onError(typeof xhr.status === "number" ? xhr.status : 0);
                }, 0);
              }
            };
          }

          debug$2("xhr data %s", this.data);
          xhr.send(this.data);
        } catch (e) {
          // Need to defer since .create() is called directly from the constructor
          // and thus the 'error' event can only be only bound *after* this exception
          // occurs.  Therefore, also, we cannot throw here at all.
          setTimeout(function() {
            self.onError(e);
          }, 0);
          return;
        }

        if (typeof document !== "undefined") {
          this.index = Request.requestsCount++;
          Request.requests[this.index] = this;
        }
      }

      /**
       * Called upon successful response.
       *
       * @api private
       */
      onSuccess() {
        this.emit("success");
        this.cleanup();
      }

      /**
       * Called if we have data.
       *
       * @api private
       */
      onData(data) {
        this.emit("data", data);
        this.onSuccess();
      }

      /**
       * Called upon error.
       *
       * @api private
       */
      onError(err) {
        this.emit("error", err);
        this.cleanup(true);
      }

      /**
       * Cleans up house.
       *
       * @api private
       */
      cleanup(fromError) {
        if ("undefined" === typeof this.xhr || null === this.xhr) {
          return;
        }
        // xmlhttprequest
        if (this.hasXDR()) {
          this.xhr.onload = this.xhr.onerror = empty$1;
        } else {
          this.xhr.onreadystatechange = empty$1;
        }

        if (fromError) {
          try {
            this.xhr.abort();
          } catch (e) {}
        }

        if (typeof document !== "undefined") {
          delete Request.requests[this.index];
        }

        this.xhr = null;
      }

      /**
       * Called upon load.
       *
       * @api private
       */
      onLoad() {
        const data = this.xhr.responseText;
        if (data !== null) {
          this.onData(data);
        }
      }

      /**
       * Check if it has XDomainRequest.
       *
       * @api private
       */
      hasXDR() {
        return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
      }

      /**
       * Aborts the request.
       *
       * @api public
       */
      abort() {
        this.cleanup();
      }
    }

    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */

    Request.requestsCount = 0;
    Request.requests = {};

    if (typeof document !== "undefined") {
      if (typeof attachEvent === "function") {
        attachEvent("onunload", unloadHandler);
      } else if (typeof addEventListener === "function") {
        const terminationEvent = "onpagehide" in globalThis_browser ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }

    function unloadHandler() {
      for (let i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
          Request.requests[i].abort();
        }
      }
    }

    var pollingXhr = XHR;
    var Request_1 = Request;
    pollingXhr.Request = Request_1;

    const rNewline = /\n/g;
    const rEscapedNewline = /\\n/g;

    /**
     * Global JSONP callbacks.
     */

    let callbacks;

    class JSONPPolling extends polling {
      /**
       * JSONP Polling constructor.
       *
       * @param {Object} opts.
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.query = this.query || {};

        // define global callbacks array if not present
        // we do this here (lazily) to avoid unneeded global pollution
        if (!callbacks) {
          // we need to consider multiple engines in the same page
          callbacks = globalThis_browser.___eio = globalThis_browser.___eio || [];
        }

        // callback identifier
        this.index = callbacks.length;

        // add callback to jsonp global
        const self = this;
        callbacks.push(function(msg) {
          self.onData(msg);
        });

        // append to query string
        this.query.j = this.index;
      }

      /**
       * JSONP only supports binary as base64 encoded strings
       */
      get supportsBinary() {
        return false;
      }

      /**
       * Closes the socket.
       *
       * @api private
       */
      doClose() {
        if (this.script) {
          // prevent spurious errors from being emitted when the window is unloaded
          this.script.onerror = () => {};
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        if (this.form) {
          this.form.parentNode.removeChild(this.form);
          this.form = null;
          this.iframe = null;
        }

        super.doClose();
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        const self = this;
        const script = document.createElement("script");

        if (this.script) {
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        script.async = true;
        script.src = this.uri();
        script.onerror = function(e) {
          self.onError("jsonp poll error", e);
        };

        const insertAt = document.getElementsByTagName("script")[0];
        if (insertAt) {
          insertAt.parentNode.insertBefore(script, insertAt);
        } else {
          (document.head || document.body).appendChild(script);
        }
        this.script = script;

        const isUAgecko =
          "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);

        if (isUAgecko) {
          setTimeout(function() {
            const iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            document.body.removeChild(iframe);
          }, 100);
        }
      }

      /**
       * Writes with a hidden iframe.
       *
       * @param {String} data to send
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        const self = this;
        let iframe;

        if (!this.form) {
          const form = document.createElement("form");
          const area = document.createElement("textarea");
          const id = (this.iframeId = "eio_iframe_" + this.index);

          form.className = "socketio";
          form.style.position = "absolute";
          form.style.top = "-1000px";
          form.style.left = "-1000px";
          form.target = id;
          form.method = "POST";
          form.setAttribute("accept-charset", "utf-8");
          area.name = "d";
          form.appendChild(area);
          document.body.appendChild(form);

          this.form = form;
          this.area = area;
        }

        this.form.action = this.uri();

        function complete() {
          initIframe();
          fn();
        }

        function initIframe() {
          if (self.iframe) {
            try {
              self.form.removeChild(self.iframe);
            } catch (e) {
              self.onError("jsonp polling iframe removal error", e);
            }
          }

          try {
            // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
            const html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
            iframe = document.createElement(html);
          } catch (e) {
            iframe = document.createElement("iframe");
            iframe.name = self.iframeId;
            iframe.src = "javascript:0";
          }

          iframe.id = self.iframeId;

          self.form.appendChild(iframe);
          self.iframe = iframe;
        }

        initIframe();

        // escape \n to prevent it from being converted into \r\n by some UAs
        // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
        data = data.replace(rEscapedNewline, "\\\n");
        this.area.value = data.replace(rNewline, "\\n");

        try {
          this.form.submit();
        } catch (e) {}

        if (this.iframe.attachEvent) {
          this.iframe.onreadystatechange = function() {
            if (self.iframe.readyState === "complete") {
              complete();
            }
          };
        } else {
          this.iframe.onload = complete;
        }
      }
    }

    var pollingJsonp = JSONPPolling;

    var websocketConstructor_browser = {
      WebSocket: globalThis_browser.WebSocket || globalThis_browser.MozWebSocket,
      usingBrowserWebSocket: true,
      defaultBinaryType: "arraybuffer"
    };

    const { pick: pick$2 } = util;
    const {
      WebSocket,
      usingBrowserWebSocket,
      defaultBinaryType
    } = websocketConstructor_browser;

    const debug$3 = browser("engine.io-client:websocket");

    // detect ReactNative environment
    const isReactNative =
      typeof navigator !== "undefined" &&
      typeof navigator.product === "string" &&
      navigator.product.toLowerCase() === "reactnative";

    class WS extends transport {
      /**
       * WebSocket transport constructor.
       *
       * @api {Object} connection options
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.supportsBinary = !opts.forceBase64;
      }

      /**
       * Transport name.
       *
       * @api public
       */
      get name() {
        return "websocket";
      }

      /**
       * Opens socket.
       *
       * @api private
       */
      doOpen() {
        if (!this.check()) {
          // let probe timeout
          return;
        }

        const uri = this.uri();
        const protocols = this.opts.protocols;

        // React Native only supports the 'headers' option, and will print a warning if anything else is passed
        const opts = isReactNative
          ? {}
          : pick$2(
              this.opts,
              "agent",
              "perMessageDeflate",
              "pfx",
              "key",
              "passphrase",
              "cert",
              "ca",
              "ciphers",
              "rejectUnauthorized",
              "localAddress",
              "protocolVersion",
              "origin",
              "maxPayload",
              "family",
              "checkServerIdentity"
            );

        if (this.opts.extraHeaders) {
          opts.headers = this.opts.extraHeaders;
        }

        try {
          this.ws =
            usingBrowserWebSocket && !isReactNative
              ? protocols
                ? new WebSocket(uri, protocols)
                : new WebSocket(uri)
              : new WebSocket(uri, protocols, opts);
        } catch (err) {
          return this.emit("error", err);
        }

        this.ws.binaryType = this.socket.binaryType || defaultBinaryType;

        this.addEventListeners();
      }

      /**
       * Adds event listeners to the socket
       *
       * @api private
       */
      addEventListeners() {
        this.ws.onopen = () => {
          if (this.opts.autoUnref) {
            this.ws._socket.unref();
          }
          this.onOpen();
        };
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onmessage = ev => this.onData(ev.data);
        this.ws.onerror = e => this.onError("websocket error", e);
      }

      /**
       * Writes data to socket.
       *
       * @param {Array} array of packets.
       * @api private
       */
      write(packets) {
        const self = this;
        this.writable = false;

        // encodePacket efficient as it uses WS framing
        // no need for encodePayload
        let total = packets.length;
        let i = 0;
        const l = total;
        for (; i < l; i++) {
          (function(packet) {
            lib.encodePacket(packet, self.supportsBinary, function(data) {
              // always create a new object (GH-437)
              const opts = {};
              if (!usingBrowserWebSocket) {
                if (packet.options) {
                  opts.compress = packet.options.compress;
                }

                if (self.opts.perMessageDeflate) {
                  const len =
                    "string" === typeof data
                      ? Buffer.byteLength(data)
                      : data.length;
                  if (len < self.opts.perMessageDeflate.threshold) {
                    opts.compress = false;
                  }
                }
              }

              // Sometimes the websocket has already been closed but the browser didn't
              // have a chance of informing us about it yet, in that case send will
              // throw an error
              try {
                if (usingBrowserWebSocket) {
                  // TypeError is thrown when passing the second argument on Safari
                  self.ws.send(data);
                } else {
                  self.ws.send(data, opts);
                }
              } catch (e) {
                debug$3("websocket closed before onclose event");
              }

              --total || done();
            });
          })(packets[i]);
        }

        function done() {
          self.emit("flush");

          // fake drain
          // defer to next tick to allow Socket to clear writeBuffer
          setTimeout(function() {
            self.writable = true;
            self.emit("drain");
          }, 0);
        }
      }

      /**
       * Called upon close
       *
       * @api private
       */
      onClose() {
        transport.prototype.onClose.call(this);
      }

      /**
       * Closes socket.
       *
       * @api private
       */
      doClose() {
        if (typeof this.ws !== "undefined") {
          this.ws.close();
          this.ws = null;
        }
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "wss" : "ws";
        let port = "";

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("wss" === schema && Number(this.opts.port) !== 443) ||
            ("ws" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // append timestamp to URI
        if (this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        // communicate binary support capabilities
        if (!this.supportsBinary) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }

      /**
       * Feature detection for WebSocket.
       *
       * @return {Boolean} whether this transport is available.
       * @api public
       */
      check() {
        return (
          !!WebSocket &&
          !("__initialize" in WebSocket && this.name === WS.prototype.name)
        );
      }
    }

    var websocket = WS;

    var polling_1 = polling$1;
    var websocket_1 = websocket;

    /**
     * Polling transport polymorphic constructor.
     * Decides on xhr vs jsonp based on feature detection.
     *
     * @api private
     */

    function polling$1(opts) {
      let xhr;
      let xd = false;
      let xs = false;
      const jsonp = false !== opts.jsonp;

      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;

        // some user agents have empty `location.port`
        if (!port) {
          port = isSSL ? 443 : 80;
        }

        xd = opts.hostname !== location.hostname || port !== opts.port;
        xs = opts.secure !== isSSL;
      }

      opts.xdomain = xd;
      opts.xscheme = xs;
      xhr = new xmlhttprequest(opts);

      if ("open" in xhr && !opts.forceJSONP) {
        return new pollingXhr(opts);
      } else {
        if (!jsonp) throw new Error("JSONP disabled");
        return new pollingJsonp(opts);
      }
    }

    var transports = {
    	polling: polling_1,
    	websocket: websocket_1
    };

    const debug$4 = browser("engine.io-client:socket");




    class Socket extends componentEmitter {
      /**
       * Socket constructor.
       *
       * @param {String|Object} uri or options
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts = {}) {
        super();

        if (uri && "object" === typeof uri) {
          opts = uri;
          uri = null;
        }

        if (uri) {
          uri = parseuri(uri);
          opts.hostname = uri.host;
          opts.secure = uri.protocol === "https" || uri.protocol === "wss";
          opts.port = uri.port;
          if (uri.query) opts.query = uri.query;
        } else if (opts.host) {
          opts.hostname = parseuri(opts.host).host;
        }

        this.secure =
          null != opts.secure
            ? opts.secure
            : typeof location !== "undefined" && "https:" === location.protocol;

        if (opts.hostname && !opts.port) {
          // if no port is specified manually, use the protocol default
          opts.port = this.secure ? "443" : "80";
        }

        this.hostname =
          opts.hostname ||
          (typeof location !== "undefined" ? location.hostname : "localhost");
        this.port =
          opts.port ||
          (typeof location !== "undefined" && location.port
            ? location.port
            : this.secure
            ? 443
            : 80);

        this.transports = opts.transports || ["polling", "websocket"];
        this.readyState = "";
        this.writeBuffer = [];
        this.prevBufferLen = 0;

        this.opts = Object.assign(
          {
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            jsonp: true,
            timestampParam: "t",
            rememberUpgrade: false,
            rejectUnauthorized: true,
            perMessageDeflate: {
              threshold: 1024
            },
            transportOptions: {}
          },
          opts
        );

        this.opts.path = this.opts.path.replace(/\/$/, "") + "/";

        if (typeof this.opts.query === "string") {
          this.opts.query = parseqs.decode(this.opts.query);
        }

        // set on handshake
        this.id = null;
        this.upgrades = null;
        this.pingInterval = null;
        this.pingTimeout = null;

        // set on heartbeat
        this.pingTimeoutTimer = null;

        if (typeof addEventListener === "function") {
          addEventListener(
            "beforeunload",
            () => {
              if (this.transport) {
                // silently close the transport
                this.transport.removeAllListeners();
                this.transport.close();
              }
            },
            false
          );
          if (this.hostname !== "localhost") {
            this.offlineEventListener = () => {
              this.onClose("transport close");
            };
            addEventListener("offline", this.offlineEventListener, false);
          }
        }

        this.open();
      }

      /**
       * Creates transport of the given type.
       *
       * @param {String} transport name
       * @return {Transport}
       * @api private
       */
      createTransport(name) {
        debug$4('creating transport "%s"', name);
        const query = clone(this.opts.query);

        // append engine.io protocol identifier
        query.EIO = lib.protocol;

        // transport name
        query.transport = name;

        // session id if we already have one
        if (this.id) query.sid = this.id;

        const opts = Object.assign(
          {},
          this.opts.transportOptions[name],
          this.opts,
          {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          }
        );

        debug$4("options: %j", opts);

        return new transports[name](opts);
      }

      /**
       * Initializes transport to use and starts probe.
       *
       * @api private
       */
      open() {
        let transport;
        if (
          this.opts.rememberUpgrade &&
          Socket.priorWebsocketSuccess &&
          this.transports.indexOf("websocket") !== -1
        ) {
          transport = "websocket";
        } else if (0 === this.transports.length) {
          // Emit error on next tick so it can be listened to
          const self = this;
          setTimeout(function() {
            self.emit("error", "No transports available");
          }, 0);
          return;
        } else {
          transport = this.transports[0];
        }
        this.readyState = "opening";

        // Retry with the next transport if the transport is disabled (jsonp: false)
        try {
          transport = this.createTransport(transport);
        } catch (e) {
          debug$4("error while creating transport: %s", e);
          this.transports.shift();
          this.open();
          return;
        }

        transport.open();
        this.setTransport(transport);
      }

      /**
       * Sets the current transport. Disables the existing one (if any).
       *
       * @api private
       */
      setTransport(transport) {
        debug$4("setting transport %s", transport.name);
        const self = this;

        if (this.transport) {
          debug$4("clearing existing transport %s", this.transport.name);
          this.transport.removeAllListeners();
        }

        // set up transport
        this.transport = transport;

        // set up transport listeners
        transport
          .on("drain", function() {
            self.onDrain();
          })
          .on("packet", function(packet) {
            self.onPacket(packet);
          })
          .on("error", function(e) {
            self.onError(e);
          })
          .on("close", function() {
            self.onClose("transport close");
          });
      }

      /**
       * Probes a transport.
       *
       * @param {String} transport name
       * @api private
       */
      probe(name) {
        debug$4('probing transport "%s"', name);
        let transport = this.createTransport(name, { probe: 1 });
        let failed = false;
        const self = this;

        Socket.priorWebsocketSuccess = false;

        function onTransportOpen() {
          if (self.onlyBinaryUpgrades) {
            const upgradeLosesBinary =
              !this.supportsBinary && self.transport.supportsBinary;
            failed = failed || upgradeLosesBinary;
          }
          if (failed) return;

          debug$4('probe transport "%s" opened', name);
          transport.send([{ type: "ping", data: "probe" }]);
          transport.once("packet", function(msg) {
            if (failed) return;
            if ("pong" === msg.type && "probe" === msg.data) {
              debug$4('probe transport "%s" pong', name);
              self.upgrading = true;
              self.emit("upgrading", transport);
              if (!transport) return;
              Socket.priorWebsocketSuccess = "websocket" === transport.name;

              debug$4('pausing current transport "%s"', self.transport.name);
              self.transport.pause(function() {
                if (failed) return;
                if ("closed" === self.readyState) return;
                debug$4("changing transport and sending upgrade packet");

                cleanup();

                self.setTransport(transport);
                transport.send([{ type: "upgrade" }]);
                self.emit("upgrade", transport);
                transport = null;
                self.upgrading = false;
                self.flush();
              });
            } else {
              debug$4('probe transport "%s" failed', name);
              const err = new Error("probe error");
              err.transport = transport.name;
              self.emit("upgradeError", err);
            }
          });
        }

        function freezeTransport() {
          if (failed) return;

          // Any callback called by transport should be ignored since now
          failed = true;

          cleanup();

          transport.close();
          transport = null;
        }

        // Handle any error that happens while probing
        function onerror(err) {
          const error = new Error("probe error: " + err);
          error.transport = transport.name;

          freezeTransport();

          debug$4('probe transport "%s" failed because of error: %s', name, err);

          self.emit("upgradeError", error);
        }

        function onTransportClose() {
          onerror("transport closed");
        }

        // When the socket is closed while we're probing
        function onclose() {
          onerror("socket closed");
        }

        // When the socket is upgraded while we're probing
        function onupgrade(to) {
          if (transport && to.name !== transport.name) {
            debug$4('"%s" works - aborting "%s"', to.name, transport.name);
            freezeTransport();
          }
        }

        // Remove all listeners on the transport and on self
        function cleanup() {
          transport.removeListener("open", onTransportOpen);
          transport.removeListener("error", onerror);
          transport.removeListener("close", onTransportClose);
          self.removeListener("close", onclose);
          self.removeListener("upgrading", onupgrade);
        }

        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);

        this.once("close", onclose);
        this.once("upgrading", onupgrade);

        transport.open();
      }

      /**
       * Called when connection is deemed open.
       *
       * @api public
       */
      onOpen() {
        debug$4("socket open");
        this.readyState = "open";
        Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
        this.emit("open");
        this.flush();

        // we check for `readyState` in case an `open`
        // listener already closed the socket
        if (
          "open" === this.readyState &&
          this.opts.upgrade &&
          this.transport.pause
        ) {
          debug$4("starting upgrade probes");
          let i = 0;
          const l = this.upgrades.length;
          for (; i < l; i++) {
            this.probe(this.upgrades[i]);
          }
        }
      }

      /**
       * Handles a packet.
       *
       * @api private
       */
      onPacket(packet) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug$4('socket receive: type "%s", data "%s"', packet.type, packet.data);

          this.emit("packet", packet);

          // Socket is live - any packet counts
          this.emit("heartbeat");

          switch (packet.type) {
            case "open":
              this.onHandshake(JSON.parse(packet.data));
              break;

            case "ping":
              this.resetPingTimeout();
              this.sendPacket("pong");
              this.emit("pong");
              break;

            case "error":
              const err = new Error("server error");
              err.code = packet.data;
              this.onError(err);
              break;

            case "message":
              this.emit("data", packet.data);
              this.emit("message", packet.data);
              break;
          }
        } else {
          debug$4('packet received with socket readyState "%s"', this.readyState);
        }
      }

      /**
       * Called upon handshake completion.
       *
       * @param {Object} handshake obj
       * @api private
       */
      onHandshake(data) {
        this.emit("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this.upgrades = this.filterUpgrades(data.upgrades);
        this.pingInterval = data.pingInterval;
        this.pingTimeout = data.pingTimeout;
        this.onOpen();
        // In case open handler closes socket
        if ("closed" === this.readyState) return;
        this.resetPingTimeout();
      }

      /**
       * Sets and resets ping timeout timer based on server pings.
       *
       * @api private
       */
      resetPingTimeout() {
        clearTimeout(this.pingTimeoutTimer);
        this.pingTimeoutTimer = setTimeout(() => {
          this.onClose("ping timeout");
        }, this.pingInterval + this.pingTimeout);
        if (this.opts.autoUnref) {
          this.pingTimeoutTimer.unref();
        }
      }

      /**
       * Called on `drain` event
       *
       * @api private
       */
      onDrain() {
        this.writeBuffer.splice(0, this.prevBufferLen);

        // setting prevBufferLen = 0 is very important
        // for example, when upgrading, upgrade packet is sent over,
        // and a nonzero prevBufferLen could cause problems on `drain`
        this.prevBufferLen = 0;

        if (0 === this.writeBuffer.length) {
          this.emit("drain");
        } else {
          this.flush();
        }
      }

      /**
       * Flush write buffers.
       *
       * @api private
       */
      flush() {
        if (
          "closed" !== this.readyState &&
          this.transport.writable &&
          !this.upgrading &&
          this.writeBuffer.length
        ) {
          debug$4("flushing %d packets in socket", this.writeBuffer.length);
          this.transport.send(this.writeBuffer);
          // keep track of current length of writeBuffer
          // splice writeBuffer and callbackBuffer on `drain`
          this.prevBufferLen = this.writeBuffer.length;
          this.emit("flush");
        }
      }

      /**
       * Sends a message.
       *
       * @param {String} message.
       * @param {Function} callback function.
       * @param {Object} options.
       * @return {Socket} for chaining.
       * @api public
       */
      write(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      send(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      /**
       * Sends a packet.
       *
       * @param {String} packet type.
       * @param {String} data.
       * @param {Object} options.
       * @param {Function} callback function.
       * @api private
       */
      sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
          fn = data;
          data = undefined;
        }

        if ("function" === typeof options) {
          fn = options;
          options = null;
        }

        if ("closing" === this.readyState || "closed" === this.readyState) {
          return;
        }

        options = options || {};
        options.compress = false !== options.compress;

        const packet = {
          type: type,
          data: data,
          options: options
        };
        this.emit("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn) this.once("flush", fn);
        this.flush();
      }

      /**
       * Closes the connection.
       *
       * @api private
       */
      close() {
        const self = this;

        if ("opening" === this.readyState || "open" === this.readyState) {
          this.readyState = "closing";

          if (this.writeBuffer.length) {
            this.once("drain", function() {
              if (this.upgrading) {
                waitForUpgrade();
              } else {
                close();
              }
            });
          } else if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        }

        function close() {
          self.onClose("forced close");
          debug$4("socket closing - telling transport to close");
          self.transport.close();
        }

        function cleanupAndClose() {
          self.removeListener("upgrade", cleanupAndClose);
          self.removeListener("upgradeError", cleanupAndClose);
          close();
        }

        function waitForUpgrade() {
          // wait for upgrade to finish since we can't send packets while pausing a transport
          self.once("upgrade", cleanupAndClose);
          self.once("upgradeError", cleanupAndClose);
        }

        return this;
      }

      /**
       * Called upon transport error
       *
       * @api private
       */
      onError(err) {
        debug$4("socket error %j", err);
        Socket.priorWebsocketSuccess = false;
        this.emit("error", err);
        this.onClose("transport error", err);
      }

      /**
       * Called upon transport close.
       *
       * @api private
       */
      onClose(reason, desc) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug$4('socket close with reason: "%s"', reason);
          const self = this;

          // clear timers
          clearTimeout(this.pingIntervalTimer);
          clearTimeout(this.pingTimeoutTimer);

          // stop event from firing again for transport
          this.transport.removeAllListeners("close");

          // ensure transport won't stay open
          this.transport.close();

          // ignore further transport communication
          this.transport.removeAllListeners();

          if (typeof removeEventListener === "function") {
            removeEventListener("offline", this.offlineEventListener, false);
          }

          // set ready state
          this.readyState = "closed";

          // clear session id
          this.id = null;

          // emit close event
          this.emit("close", reason, desc);

          // clean buffers after, so users can still
          // grab the buffers on `close` event
          self.writeBuffer = [];
          self.prevBufferLen = 0;
        }
      }

      /**
       * Filters upgrades, returning only those matching client transports.
       *
       * @param {Array} server upgrades
       * @api private
       *
       */
      filterUpgrades(upgrades) {
        const filteredUpgrades = [];
        let i = 0;
        const j = upgrades.length;
        for (; i < j; i++) {
          if (~this.transports.indexOf(upgrades[i]))
            filteredUpgrades.push(upgrades[i]);
        }
        return filteredUpgrades;
      }
    }

    Socket.priorWebsocketSuccess = false;

    /**
     * Protocol version.
     *
     * @api public
     */

    Socket.protocol = lib.protocol; // this is an int

    function clone(obj) {
      const o = {};
      for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = obj[i];
        }
      }
      return o;
    }

    var socket = Socket;

    var lib$1 = (uri, opts) => new socket(uri, opts);

    /**
     * Expose deps for legacy compatibility
     * and standalone browser access.
     */

    var Socket_1 = socket;
    var protocol = socket.protocol; // this is an int
    var Transport$1 = transport;
    var transports$1 = transports;
    var parser = lib;
    lib$1.Socket = Socket_1;
    lib$1.protocol = protocol;
    lib$1.Transport = Transport$1;
    lib$1.transports = transports$1;
    lib$1.parser = parser;

    var isBinary_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasBinary = exports.isBinary = void 0;
    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    exports.isBinary = isBinary;
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }
    exports.hasBinary = hasBinary;
    });

    var binary = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reconstructPacket = exports.deconstructPacket = void 0;

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    exports.deconstructPacket = deconstructPacket;
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary_1.isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        packet.attachments = undefined; // no longer useful
        return packet;
    }
    exports.reconstructPacket = reconstructPacket;
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }
    });

    var dist = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;



    const debug = browser("socket.io-parser");
    /**
     * Protocol version.
     *
     * @public
     */
    exports.protocol = 5;
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType = exports.PacketType || (exports.PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            debug("encoding packet %j", obj);
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (isBinary_1.hasBinary(obj)) {
                    obj.type =
                        obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK;
                    return this.encodeAsBinary(obj);
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data);
            }
            debug("encoded %j as %s", obj, str);
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = binary.deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    exports.Encoder = Encoder;
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends componentEmitter {
        constructor() {
            super();
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                packet = this.decodeString(obj);
                if (packet.type === PacketType.BINARY_EVENT ||
                    packet.type === PacketType.BINARY_ACK) {
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emit("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emit("decoded", packet);
                }
            }
            else if (isBinary_1.isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emit("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            debug("decoded %s as %j", str, p);
            return p;
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return typeof payload === "object";
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || typeof payload === "object";
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return Array.isArray(payload) && payload.length > 0;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
            }
        }
    }
    exports.Decoder = Decoder;
    function tryParse(str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return false;
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = binary.reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }
    });

    var on_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.on = void 0;
    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }
    exports.on = on;
    });

    var typedEvents = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StrictEventEmitter = void 0;

    /**
     * Strictly typed version of an `EventEmitter`. A `TypedEventEmitter` takes type
     * parameters for mappings of event names to event data types, and strictly
     * types method calls to the `EventEmitter` according to these event maps.
     *
     * @typeParam ListenEvents - `EventsMap` of user-defined events that can be
     * listened to with `on` or `once`
     * @typeParam EmitEvents - `EventsMap` of user-defined events that can be
     * emitted with `emit`
     * @typeParam ReservedEvents - `EventsMap` of reserved events, that can be
     * emitted by socket.io with `emitReserved`, and can be listened to with
     * `listen`.
     */
    class StrictEventEmitter extends componentEmitter {
        /**
         * Adds the `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */
        on(ev, listener) {
            super.on(ev, listener);
            return this;
        }
        /**
         * Adds a one-time `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */
        once(ev, listener) {
            super.once(ev, listener);
            return this;
        }
        /**
         * Emits an event.
         *
         * @param ev Name of the event
         * @param args Values to send to listeners of this event
         */
        emit(ev, ...args) {
            super.emit(ev, ...args);
            return this;
        }
        /**
         * Emits a reserved event.
         *
         * This method is `protected`, so that only a class extending
         * `StrictEventEmitter` can emit its own reserved events.
         *
         * @param ev Reserved event name
         * @param args Arguments to emit along with the event
         */
        emitReserved(ev, ...args) {
            super.emit(ev, ...args);
            return this;
        }
        /**
         * Returns the listeners listening to an event.
         *
         * @param event Event name
         * @returns Array of listeners subscribed to `event`
         */
        listeners(event) {
            return super.listeners(event);
        }
    }
    exports.StrictEventEmitter = StrictEventEmitter;
    });

    var socket$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Socket = void 0;



    const debug = browser("socket.io-client:socket");
    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    class Socket extends typedEvents.StrictEventEmitter {
        /**
         * `Socket` constructor.
         *
         * @public
         */
        constructor(io, nsp, opts) {
            super();
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            this.ids = 0;
            this.acks = {};
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.connected = false;
            this.disconnected = true;
            this.flags = {};
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                on_1.on(io, "open", this.onopen.bind(this)),
                on_1.on(io, "packet", this.onpacket.bind(this)),
                on_1.on(io, "error", this.onerror.bind(this)),
                on_1.on(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @public
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for connect()
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @return self
         * @public
         */
        emit(ev, ...args) {
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev + '" is a reserved event name');
            }
            args.unshift(ev);
            const packet = {
                type: dist.PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                debug("emitting packet with ack id %d", this.ids);
                this.acks[this.ids] = args.pop();
                packet.id = this.ids++;
            }
            const isTransportWritable = this.io.engine &&
                this.io.engine.transport &&
                this.io.engine.transport.writable;
            const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) {
                debug("discard packet as the transport is not currently writable");
            }
            else if (this.connected) {
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            debug("transport is open - connecting");
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this.packet({ type: dist.PacketType.CONNECT, data });
                });
            }
            else {
                this.packet({ type: dist.PacketType.CONNECT, data: this.auth });
            }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                this.emitReserved("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @private
         */
        onclose(reason) {
            debug("close (%s)", reason);
            this.connected = false;
            this.disconnected = true;
            delete this.id;
            this.emitReserved("disconnect", reason);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case dist.PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        const id = packet.data.sid;
                        this.onconnect(id);
                    }
                    else {
                        this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case dist.PacketType.EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case dist.PacketType.CONNECT_ERROR:
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    this.emitReserved("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            debug("emitting event %j", args);
            if (null != packet.id) {
                debug("attaching ack callback to event");
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                debug("sending ack %j", args);
                self.packet({
                    type: dist.PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if ("function" === typeof ack) {
                debug("calling ack %s with %j", packet.id, packet.data);
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
            }
            else {
                debug("bad ack %s", packet.id);
            }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id) {
            debug("socket connected with id %s", id);
            this.id = id;
            this.connected = true;
            this.disconnected = false;
            this.emitReserved("connect");
            this.emitBuffered();
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => this.packet(packet));
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            debug("server disconnect (%s)", this.nsp);
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */
        disconnect() {
            if (this.connected) {
                debug("performing disconnect (%s)", this.nsp);
                this.packet({ type: dist.PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAny() {
            return this._anyListeners || [];
        }
    }
    exports.Socket = Socket;
    });

    /**
     * Expose `Backoff`.
     */

    var backo2 = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand =  Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
      this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
      this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
      this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
      this.jitter = jitter;
    };

    var manager = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Manager = void 0;






    const debug = browser("socket.io-client:manager");
    class Manager extends typedEvents.StrictEventEmitter {
        constructor(uri, opts) {
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor(opts.randomizationFactor || 0.5);
            this.backoff = new backo2({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || dist;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            debug("readyState %s", this._readyState);
            if (~this._readyState.indexOf("open"))
                return this;
            debug("opening %s", this.uri);
            this.engine = lib$1(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on_1.on(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            // emit `error`
            const errorSub = on_1.on(socket, "error", (err) => {
                debug("error");
                self.cleanup();
                self._readyState = "closed";
                this.emitReserved("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });
            if (false !== this._timeout) {
                const timeout = this._timeout;
                debug("connect attempt will timeout after %d", timeout);
                if (timeout === 0) {
                    openSubDestroy(); // prevents a race condition with the 'open' event
                }
                // set timer
                const timer = setTimeout(() => {
                    debug("connect attempt timed out after %d", timeout);
                    openSubDestroy();
                    socket.close();
                    socket.emit("error", new Error("timeout"));
                }, timeout);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            debug("open");
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(on_1.on(socket, "ping", this.onping.bind(this)), on_1.on(socket, "data", this.ondata.bind(this)), on_1.on(socket, "error", this.onerror.bind(this)), on_1.on(socket, "close", this.onclose.bind(this)), on_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            this.emitReserved("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            debug("error", err);
            this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket = this.nsps[nsp];
            if (!socket) {
                socket = new socket$1.Socket(this, nsp, opts);
                this.nsps[nsp] = socket;
            }
            return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    debug("socket %s is still active, skipping close", nsp);
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            debug("writing packet %j", packet);
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            debug("cleanup");
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            debug("disconnect");
            this.skipReconnect = true;
            this._reconnecting = false;
            if ("opening" === this._readyState) {
                // `onclose` will not fire because
                // an open event never happened
                this.cleanup();
            }
            this.backoff.reset();
            this._readyState = "closed";
            if (this.engine)
                this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason) {
            debug("onclose");
            this.cleanup();
            this.backoff.reset();
            this._readyState = "closed";
            this.emitReserved("close", reason);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                debug("reconnect failed");
                this.backoff.reset();
                this.emitReserved("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                debug("will wait %dms before reconnect attempt", delay);
                this._reconnecting = true;
                const timer = setTimeout(() => {
                    if (self.skipReconnect)
                        return;
                    debug("attempting reconnect");
                    this.emitReserved("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            debug("reconnect attempt error");
                            self._reconnecting = false;
                            self.reconnect();
                            this.emitReserved("reconnect_error", err);
                        }
                        else {
                            debug("reconnect success");
                            self.onreconnect();
                        }
                    });
                }, delay);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            this.emitReserved("reconnect", attempt);
        }
    }
    exports.Manager = Manager;
    });

    var build = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Socket = exports.io = exports.Manager = exports.protocol = void 0;



    Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket$1.Socket; } });
    const debug = browser("socket.io-client");
    /**
     * Module exports.
     */
    module.exports = exports = lookup;
    /**
     * Managers cache.
     */
    const cache = (exports.managers = {});
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = url_1.url(uri, opts.path);
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            debug("ignoring socket cache for %s", source);
            io = new manager.Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                debug("new io instance for %s", source);
                cache[id] = new manager.Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    exports.io = lookup;
    /**
     * Protocol version.
     *
     * @public
     */

    Object.defineProperty(exports, "protocol", { enumerable: true, get: function () { return dist.protocol; } });
    /**
     * `connect`.
     *
     * @param {String} uri
     * @public
     */
    exports.connect = lookup;
    /**
     * Expose constructors for standalone build.
     *
     * @public
     */
    var manager_2 = manager;
    Object.defineProperty(exports, "Manager", { enumerable: true, get: function () { return manager_2.Manager; } });
    exports.default = lookup;
    });

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$8 = "src\\App.svelte";

    function create_fragment$8(ctx) {
    	let main;
    	let dashboard;
    	let t0;
    	let div;
    	let i;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let current;

    	dashboard = new Dashboard_1({
    			props: { master: /*master*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(dashboard.$$.fragment);
    			t0 = space();
    			div = element("div");
    			i = element("i");
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Can't connect to master server!";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Retrying...";
    			add_location(main, file$8, 61, 0, 1066);
    			attr_dev(i, "class", "far fa-frown icon svelte-6e9jlp");
    			add_location(i, file$8, 66, 1, 1172);
    			attr_dev(p0, "class", "svelte-6e9jlp");
    			add_location(p0, file$8, 67, 1, 1207);
    			attr_dev(p1, "class", "status svelte-6e9jlp");
    			add_location(p1, file$8, 68, 1, 1248);
    			attr_dev(div, "class", "cant-connect svelte-6e9jlp");
    			toggle_class(div, "hidden", /*masterStatus*/ ctx[1]);
    			add_location(div, file$8, 65, 0, 1114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(dashboard, main, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dashboard_changes = {};
    			if (dirty & /*master*/ 1) dashboard_changes.master = /*master*/ ctx[0];
    			dashboard.$set(dashboard_changes);

    			if (dirty & /*masterStatus*/ 2) {
    				toggle_class(div, "hidden", /*masterStatus*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dashboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dashboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(dashboard);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
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
    	let master, masterStatus = false;
    	master = build.io("http://localhost:4000", { withCredentials: false });

    	master.on("connect", () => {
    		$$invalidate(1, masterStatus = true);
    	}).on("disconnect", () => {
    		$$invalidate(1, masterStatus = false);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Dashboard: Dashboard_1, io: build.io, master, masterStatus });

    	$$self.$inject_state = $$props => {
    		if ("master" in $$props) $$invalidate(0, master = $$props.master);
    		if ("masterStatus" in $$props) $$invalidate(1, masterStatus = $$props.masterStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(1, masterStatus = true);
    	return [master, masterStatus];
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

    const fs = require('fs');


    if (!fs.existsSync('/.CANDY')){
      fs.mkdirSync('/.CANDY');
    }

    if (!fs.existsSync('/.CANDY/db')){
      fs.mkdirSync('/.CANDY/db');
    }

    const app = new App({
      target: document.getElementById('root'),
      props: {
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
