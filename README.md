# require

require is a dynamic script and stylesheet loader designed by Andy VanWagoner
([thetalecrafter](http://github.com/thetalecrafter))
to enable dependency driven script and style loading

## Features

  * Async require with onready callback
  * Nested requires (a file is not considered complete until all requires called by it complete )
  * Multiple files required in single call
  * Require by object name
  * Require stylesheets with onready callback


## Usage

main file:

	require.setObjUrl('jQuery', 'http://code.jquery.com/jquery-1.4.2.min.js');
	require.setNsUrl('jQuery', function(name) { return 'http://cdn-' + ~~(Math.random()*4) + '.example/plugins/' + name + '.js'; });
	require('jQuery.myplugin', function() { /* both have loaded when this executes */ })

plugin file:

	require('jQuery', function() {
		jQuery.myplugin = ...
	});

equire css: Any requirement matching /\bcss\b/i will be treated as a css requirement.

	require('myplugin.css', function() { /* You can count on styles being available here */ });

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

