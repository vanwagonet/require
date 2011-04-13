# require

require is a dynamic script, stylesheet, and image loader designed by Andy VanWagoner
([thetalecrafter](http://github.com/thetalecrafter))
to enable dependency driven web applications

## Features

  * Async require with onready callback
  * Nested requires (a file is not considered complete until all requires called by it complete )
  * Multiple files required in single call
  * Require by object name, get object passed to callback
  * Require images and stylesheets with onready callback
  * Async constructor (class) declaration with onready callback

## Usage

main file:

	require.setObjUrl('jQuery', function(name) {
		return name === 'jQuery' ? 'http://code.jquery.com/jquery-1.5.2.min.js' :
			'http://cdn-' + (name.length % 4) + '.example/plugins/' + name + '.js'; });
	require('jQuery.myplugin', function(myplugin) { /* both have loaded when this executes */ })

plugin file:

	require('jQuery', function(jQuery) {
		jQuery.myplugin = ...
	});

require css: Any requirement matching /\.css$/i will be treated as a css requirement.

	require('myplugin.css', function() { /* You can count on styles being available here */ });

require image: Any requirement matching /\.(?:gif|jpe?g|png)$/i will be treated as an image requirement.

	require('myplugin_bg.png', function() { /* You can count on the image being available here */ });

## Async Constructor Declaration Usage

require includes the define function, which allows you to define constructors (classes) which depend on scripts not yet loaded

	declare('my.ns.MyWidget', {
		requires: [ 'my.ns.BaseWidget', 'jQuery', 'otherStuff' ],
		base: 'my.ns.BaseWidget', // string will resolve to actual constructor once available
		initialize: function initialize() { /* actual init code for you widget here, called by constructor with constructor's parameters */ }
		// add your own properties and methods here
	}, function(MyWidget) { /* new MyWidget() instanceof my.ns.BaseWidget, (new MyWidget()).base === my.ns.BaseWidget.prototype */ });

## License 

(The MIT License)

Copyright (c) 2010 Andy VanWagoner

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

