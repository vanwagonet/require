/*!
 * _.require v0.9.1
 *  Copyright 2010, Andy VanWagoner
 *  Released under the MIT, and BSD Licenses.
 **/
(function(_) { _ = _ || window;
	var obj_map = {}, ns_map = {}, root = [], reqs = {}, q = [], empty = function(){},
		CREATED = 0, REQUESTED = 1, LOADED = 2, EXECUTED = 3, COMPLETE = 4,
		inOrder = !!(window.opera || document.getBoxObjectFor || window.mozInnerScreenX >= 0),
		d = document, head = d.head || d.getElementsByTagName('head')[0] || d.documentElement;

	function warn(text) { return window.console && console.warn && console.warn(text); }

	function script(src, type, ready) { // create script tag and add to head
		var s = d.createElement('script'); s.type = type || 'text/javascript';
		s.src = require.build ? src + (src.indexOf('?') < 0 ? '?' : '&') + require.build : src;
		function cleanup() { return s.onload && (s.onload = s.onerror = s.onreadystatechange = null) || head.removeChild(s); }
		s.onload = function() { return cleanup() && ready(); }; // make sure event and cleanup happens only once
		s.onreadystatechange = function() { if (s.readyState === 'complete' || s.readyState === 'loaded') { s.onload(); } };
		s.onerror = function() { reqs[src].failed = true; s.onload(); warn('failed to load: ' + src); }
		return head.appendChild(s);
	}

	function Requirement(url) { // object to keep track of files required
		this.url = url; this.listeners = []; this.status = CREATED; this.children = [];
		return reqs[url] = this;
	}

	Requirement.prototype = {
		push: function push(child) { this.children.push(child); },
		check: function check() {
			var list = this.children, i = list.length, l;
			while (i) { if (list[--i].status !== COMPLETE) { return; } }
			this.complete();
		},
		complete: function complete(explicit) {
			if (this.status === COMPLETE || (this.failed && !explicit)) { return false; } // don't complete twice
			this.status = COMPLETE;
			for (var list = this.listeners, i = 0, l = list.length; i < l; ++i) { list[i].call(this); }
			this.listeners = null;
		},
		loaded: function loaded(xhr) {
			this.status = LOADED;
			if (q.push(this) === 1) { q[0].execute(); }
		},
		execute: function execute() {
			var r = this, type = 'text/javascript';
			script(this.url, type, function() { r.executed(); });
		},
		executed: function executed() {
			if (q.shift() !== this) { throw new Error('Script execution order broken.'); }
			if (!inOrder && q.length) { q[0].execute(); }
			this.status = EXECUTED;
			this.check();
		},
		request: function request(onready) {
			if (this.status === COMPLETE) { onready(); return; }
			this.listeners.push(onready);

			var p = q[0] || root; p.push(this);
			if (p !== root) { this.listeners.push(function() { return p.check(); }); }
			if (this.status >= REQUESTED) { return; }

			this.status = REQUESTED;
            if (inOrder) { q.push(this); }
			var r = this, type = inOrder ? 'text/javascript' : 'text/plain';
			script(this.url, type, function() { return inOrder ? r.executed() : r.loaded(); });
		}
	};

	function each(arr, fn) {
		if (typeof arr === 'string') { arr = [ arr ]; } // make sure we have an array
		var i = arr.length;
		while (i) { // update or create the requirement node
			var url = absolutize(resolve(arr[--i]));
			fn(reqs[url] || new Requirement(url));
		}
		return _;
	}
	
	function require(arr, onready) {
		if (typeof arr === 'string') { arr = [ arr ]; } // make sure we have an array
		var left = arr.length; if (!left && onready) { return onready.apply(_, arr); }
		function check() { if (!--left && onready) { onready.apply(_, arr); } }
		return each(arr, function(req) { return req.request(check); });
	} _.require = require;

	function resolve(name) { // get url for object by name, pass through urls
		if (/\/|\\|\?|#|\.js$/.test(name)) { return name; }
		if (obj_map[name]) { return obj_map[name](name); }
		var parts = name.split('.'), used = [ parts.pop() ], ns;
		while (parts.length) {
			if (ns_map[ns = parts.join('.')]) { return ns_map[ns](ns) + used.reverse().join('/') + '.js'; }
			used.push(parts.pop());
		}
		return used.reverse().join('/') + '.js';
	} require.resolve = resolve;

	var div; (div = d.createElement('div')).innerHTML = '<a></a>';
	function absolutize(url) { // relative to absolute url
		div.firstChild.href = url;
		if (div.canHaveHTML) { div.innerHTML = div.innerHTML; } // run through the parser for IE
		return div.firstChild.href;
	} require.absolutize = absolutize;


	function complete(arr) { // declare a class name or file complete
		return each(arr, function(req) { return req.complete(true); });
	} require.complete = complete;

	function executed(arr) { // declare a class name or file executed
		return each(arr, function(req) { return req.status < EXECUTED && (req.status = EXECUTED) && req.check(); });
	} require.executed = executed;

	function requested(arr) { // declare a class name or file requested
		return each(arr, function(req) {
			req.status = Math.max(req.status, REQUESTED);
			req.request(empty);
		});
	} require.requested = requested;

	function makeFn(str) { return (typeof str === 'function') ? str : function() { return str; }; }

	// set urls for objects and namespaces - url can be function that takes name and returns url
	function setObjUrl(name, url) { obj_map[name] = makeFn(url); return this; }
	function setNsUrl (name, url) { ns_map[name]  = makeFn(url); return this; }
	require.setObjUrl = setObjUrl; require.setNsUrl = setNsUrl;

	function addObjMap(o) { for (var k in o) { obj_map[k] = makeFn(o[k]); } return this; }
	function addNsMap (o) { for (var k in o) { ms_map[k]  = makeFn(o[k]); } return this; }
	require.addObjMap = addObjMap; require.addNsMap = addNsMap;

	function requireCss(href, onready) { // require css - only one url, no nested requires
		var s = document.createElement('link'); s.rel = 'stylesheet'; s.type = 'text/css';
		s.href = require.build ? href + (href.indexOf('?') < 0 ? '?' : '&') + require.build : href;
		if (typeof onready === 'function') {
			var load_t = setInterval(function() { return (s.sheet || s.styleSheet) && s.onload(); }, 100);
			s.onload = function() { clearInterval(load_t); s.onload = null; return onready.call(_, href); }
		}
		head.appendChild(s);
	} _.requireCss = requireCss;

	require.tree  = root; // make the required tree available
	require.build = 0;    // used to bust cache when a new site build occurs
})(window); // pass in namespace

