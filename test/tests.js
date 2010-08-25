(function(){
	function $(id) { return document.getElementById(id); }

	var tests = {};
	function createTest(name) {
		var div = $(name) || document.body.appendChild(document.createElement('div'));
		div.id = name.replace(/\s+/g, '_');
		div.className = 'test';
		div.innerHTML = name;
		div.assert = function(pass){ div.className += (pass ? ' pass' : ' fail'); };
		return (tests[name] = div);
	}

	// test harness is in place
	createTest('initialize').assert(true);

	// test name to url resolution
	require.addObjMap({ 'test.resolve.fn':function(n) { return 'fn'; }, 'test.resolve.url':'url' });
	require.addNsMap({ 'test.resolve':function(n) { return 'ns/'; } });
	createTest('resolve name by string').assert(require.resolve('test.resolve.url') === 'url');
	createTest('resolve name by function').assert(require.resolve('test.resolve.fn') === 'fn');
	createTest('resolve name by namespace function 1').assert(require.resolve('test.resolve.js.name') === 'ns/js/name.js');
	createTest('resolve name by namespace function 2').assert(require.resolve('test.resolve.css.name') === 'ns/css/name.css');

	// test requiring css files
	var test_css_1 = createTest('require css 1');
	require('test-css-1.css', function(href){
		test_css_1.assert(href === 'test-css-1.css' && $('require_css_1').offsetHeight == 25);
	});

	// test auto resolving object
	var test_js_1 = createTest('require js 1');
	require.setObjUrl('test.require.js.1', 'test-js-1.js');
	require('test.require.js.1', function(obj){
		test_js_1.assert(test.require.js['1'] === 1);
	});
})();
