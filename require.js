/*!
 * _.require v0.20
 *  Copyright 2010, Andy VanWagoner
 *  Released under the MIT, and BSD Licenses.
 **/
(function(_, url_map, undefined) {
	var
		// requirement states
		REQUESTED = 1,
		LOADED    = 2,
		EXECUTED  = 3,
		COMPLETE  = 4,

		// literals used (IE performs better with variables than literals)
		MT = '',
		QM = '?',
		JS = 'js',
		AND = '&',
		DOT = '.',
		CSS = 'css',
		IMG = 'img',
		EXT = '.js',
		SOL = '/',
		LINK = 'link',
		SCRIPT = 'script',
		STRING = 'string',
		JSMIME = 'text/javascript',
		CSSREL = 'stylesheet',
		CSSMIME = 'text/css',
		FUNCTION = 'function',

		// regular expressions used
		is_url = /:|#|\?|\/|\.(?:css|js|gif|jpe?g|png)$/i,
		is_img = /\.(?:gif|jpe?g|png)$/i,
		is_css = /\.css$/i,

		// DOM shortcuts
		d = document,
		w = window,
		head = d.head || d.getElementsByTagName('head')[0],

		// require's variables
		_ = _ || w; // namespace that require is added to
		q = [],    // queue of scripts to execute
		root = [], // root of requirement tree
		reqs = {}, // map of all requirements by url 
		empty = function(){}, // no-op function
		url_map = url_map || {}; // map for object and namespace names to urls
		initproto = false, // am I initializing a prototype?

		inOrder = !!(w.opera || d.getBoxObjectFor || w.mozInnerScreenX >= 0),
		rtype = inOrder ? 'text/javascript' : 'text/plain';


	// functions to load scripts, styles, and images
	function add_b(url) { return require.build ? url + (url.indexOf(QM) < 0 ? QM : AND) + require.build : url; }
	function script(src, type, ready) { // create script tag and add to head
		var s = d.createElement(SCRIPT);
		s.type = type || JSMIME;
		s.src = add_b(src);
		function cleanup() { return s.onload && (s.onload = s.onerror = s.onreadystatechange = null) || head.removeChild(s); }
		s.onload = function() { return cleanup() && ready(); }; // make sure event and cleanup happens only once
		s.onreadystatechange = function() { return (s.readyState.length % 2) || s.onload(); }; // loaded and complete have even lengths
		s.onerror = function() { return (reqs[src].failed = true) && s.onload(); };
		return head.appendChild(s);
	}
	function link(req) { // create link and call complete on load
		var s = document.createElement(LINK);
		s.rel = CSSREL;
		s.type = CSSMIME;
		s.href = add_b(req.url);
		var load_t = setInterval(function() { return (s.sheet || s.styleSheet) && s.onload(); }, 200);
		s.onload = function() {
			clearInterval(load_t);
			load_t = s.onload = null;
			return complete(req);
		}
		return head.appendChild(s);
	}
	function img(req) { // create image and call complete on load
		var img = new Image();
		img.onload = function() { return (img.onload = null) || complete(req); };
		img.src = add_b(req.url);
		return img;
	}


	// function to keep track of files required
	function Requirement(url, type) { return reqs[url] = { url:url, listeners:[], status:0, children:[], type:type }; }
	function push(req, child) { return req.push ? req.push(child) : req.children.push(child); }
	function check(req) {
		var list = req.children, i = list.length, l;
		while (i) { if (list[--i].status !== COMPLETE) { return; } }
		complete(req);
	}
	function complete(req, explicit) {
		if (req.status === COMPLETE || (req.failed && !explicit)) { return; } // don't complete twice
		req.status = COMPLETE;
		for (var list=req.listeners, i=0, l=list.length; i < l; ++i) { list[i].call(req, req); }
		req.listeners = null;
	}
	function loaded(req, xhr) {
		req.status = LOADED;
		if (q.push(req) === 1) { execute(q[0]); }
	}
	function execute(req) { script(req.url, JSMIME, function() { executed(req); }); }
	function executed(req) {
		q.shift(); // === req otherwise script execution order broken
		if (!inOrder && q.length) { execute(q[0]); }
		req.status = EXECUTED;
		check(req);
	}
	function request(req, onready) {
		if (req.status === COMPLETE) { onready(); return false; }
		req.listeners.push(onready);

		var p = q[0] || root;
		push(p, req);
		if (q[0]) { req.listeners.push(function() { return check(p); }); }
		if (req.status >= REQUESTED) { return true; }
		req.status = REQUESTED;

		if (req.type === CSS) { return link(req); }
		if (req.type === IMG) { return img(req); }
		if (inOrder) { q.push(req); }
		return script(req.url, rtype, function() { return inOrder ? executed(req) : loaded(req); });
	}

	function each(arr, fn) {
		if (typeof arr === STRING) { arr = [ arr ]; } // make sure we have an array
		var i = arr.length, url, type;
		while (i) { // update or create the requirement node
			url  = absolutize(resolve(arr[--i])),
			type = is_css.test(arr[i]) ? CSS : (is_img.test(arr[i]) ? IMG : JS);
			fn(reqs[url] || Requirement(url, type));
		}
		return _;
	}

	function require(arr, onready) {
		if (typeof arr === STRING) { arr = [ arr ]; } // make sure we have an array
		var left = arr.length;
		if (!left && onready) { return onready.apply(_, findAll(arr)); }
		function check() { if (!--left && onready) { onready.apply(_, findAll(arr)); } }
		return each(arr, function(req) { return request(req, check); });
	} _.require = require;

	function resolve(name) { // get url for object by name, pass through urls
		if (is_url.test(name)) { return name; } // css and img should always be urls
		if (url_map[name]) { return url_map[name](name); }
		var parts = name.split(DOT), ns;
		while (--parts.length) {
			if (url_map[ns = parts.join(DOT)]) { return url_map[ns](name); }
		}
		if (url_map[MT]) { return url_map[MT](name); }
		return name.split(DOT).join(SOL) + DJS;
	} require.resolve = resolve;

	function findAll(names) { // resolve an array of strings to objects
		var objs = [], i, l = names.length;
		for (i=0; i < l; ++i) { objs[i] = find(names[i]); }
		return objs;
	} require.findAll = findAll;

	function find(name, create) { // resolve string to object
		if (typeof name !== STRING) { return name; }
		if (is_url.test(name)) { return undefined; }
		var o = w, a = name.split(DOT), i, l = a.length;
		for (i=0; i < l && o; ++i) { o = o[a[i]] || create && (o[a[i]] = {}); }
		return (i === l) ? o : undefined;
	} require.find = find;

	var div; (div = d.createElement('div')).innerHTML = '<a></a>';
	function absolutize(url) { // relative to absolute url
		div.firstChild.href = url;
		if (div.canHaveHTML) { div.innerHTML = div.innerHTML; } // run through the parser for IE
		return div.firstChild.href;
	} require.absolutize = absolutize;

	function complete_all(arr) { // declare a class name or file complete
		return each(arr, function(req) { return complete(req, true); });
	} require.complete = complete_all;

	function executed_all(arr) { // declare a class name or file executed
		return each(arr, function(req) { return req.status < EXECUTED && (req.status = EXECUTED) && check(req); });
	} require.executed = executed_all;

	function requested_all(arr) { // declare a class name or file requested
		return each(arr, function(req) {
			req.status = Math.max(req.status, REQUESTED);
			request(req, empty);
		});
	} require.requested = requested_all;


	// set urls for objects and namespaces - url can be function that takes name and returns url
	function makeFn(str) { return (typeof str === FUNCTION) ? str : function() { return str; }; }
	function setObjUrl(name, url) { url_map[name] = makeFn(url); return require; }
	function addObjMap(o) { for (var k in o) { url_map[k] = makeFn(o[k]); } return require; }
	require.setObjUrl = setObjUrl; require.addObjMap = addObjMap;

	require.tree  = root; // make the required tree available
	require.build = 0;    // used to bust cache when a new site build occurs

	/** async class system with requiring and auto resolving names to objects
	 * o.base: String || Function - The base class or name of base class,
	 * o.requires: String || Array - Names or Objects required before defining */
	function declare(name, o, onready) {
		return require(o.requires || [], function build_class() { // load dependencies, then define class
			var BaseClass = find(o.base) || declare.base || Object, proto, p, i, l;

			initproto = true;
			proto = new BaseClass(); // Create the prototype
			initproto = false;

			for (p in o) { proto[p] = o[p]; } // Add new members
			proto.base = BaseClass.prototype; // so you don't need to hardcode super() calls

			function Class() { // Create the class
				return (!initproto && this.initialize) ? this.initialize.apply(this, arguments) : this;
			} Class.prototype = proto;

			name = name.split(DOT); // Attach to namespace (create if necessary)
			var ns = find(name.slice(0, -1).join(DOT), true);
			Class.className = name.slice(-1)[0];
			ns[Class.className] = Class;

			if (onready) { onready(Class); } // call ready handler
		});
	} require.declare = (_.declare = declare);
})(window, {}); // pass in namespace, object map

