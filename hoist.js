//  Hoist.js 1.0.0
//  https://github.com/flovan/hoist
//  (c) 2015-whateverthecurrentyearis Florian Vanthuyne
//  Hoist may be freely distributed under the MIT license.

(function(window, document){

	///////////////////////////////////////////////////////////////////////////
	//                                                                       //
	// IE8(-) POLYFILLS                                                      //
	//                                                                       //
	///////////////////////////////////////////////////////////////////////////

	// Add a `hasOwnProperty()` method on window if there is none
	window.hasOwnProperty = window.hasOwnProperty || Object.prototype.hasOwnProperty;

	// Add `.bind()` to functions if there is none
	// https://github.com/enyo/functionbind
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") {
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}
	 
			var aArgs = Array.prototype.slice.call(arguments, 1),
				fToBind = this, 
				fNOP = function () {},
				fBound = function () {
					return fToBind.apply((this instanceof fNOP && oThis ? this : oThis), aArgs.concat(Array.prototype.slice.call(arguments)));
				};
	 
			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();
	 
			return fBound;
		};
	}

	///////////////////////////////////////////////////////////////////////////
	//                                                                       //
	// CONSTRUCTOR                                                           //
	//                                                                       //
	///////////////////////////////////////////////////////////////////////////

	var Hoist = function (container, opts) {

		// Shield for undefined container
		if (typeof container !== 'string') {
			console.error('Hoist constructor error: container selector needs to be a String.');
			return;
		}

		// PRIVATE VARS

		var
			_win               = null,
			_listenerCallback  =  null,
			_containerSelector = '#container',
			_container         = null,
			_items             = null,
			_columns           = null,
			_multipleBreaks    = false,
			_settings          = {
				itemSelector:   '.block',
				columns:        2,
				minWidth:       0,
				gutterWidth:    0,
				repeatResize:   60
			}
		;

		// PRIVATE FUNCTIONS

		// Initializes the class instance
		var _init = function () {
			var self = this,
				t;

			// Identify DOM elements
			_container = document.querySelectorAll(_containerSelector)[0];
			_items = document.querySelectorAll(_settings.itemSelector);

			// Throw a warning if the plugin won't actually be doing anything
			if (!_items.length) {
				console.warn('Hoist error: selector `' + _settings.itemSelector + '` did not match any elements.');
			}

			// Find out if this setup needs multiple breaks
			_multipleBreaks = (_settings.columns.constructor === Array);

			// Listen for and trigger resize
			_addWindowListener();
		};

		// Adds a resize listener to the window
		var _addWindowListener = function () {
			if (_listenerCallback === null) {
				_listenerCallback = throttle(_windowResizeHandler.bind(this), 50);

				try {
					window.addEventListener('resize', _listenerCallback);
				} catch (e) {
					window.attachEvent('onresize', _listenerCallback);
				}
			}

			_windowResizeHandler.apply(this);
		};

		// Removes the resize listener from the window
		var _removeWindowListener = function () {
			if (_listenerCallback !== null) {
				try {
					window.removeEventListener('resize', _listenerCallback);
				} catch (e) {
					window.detachEvent('onresize', _listenerCallback);
				}
				
				_listenerCallback = null;
			}
		};

		// A handler for window resizes
		var _windowResizeHandler = function (e) {
			var containerWidth = _container.clientWidth,
				max = _items.length,
				c = 0,
				currItem = null,
				numCols = _multipleBreaks ? _getNumCols() : _settings.columns,
				maxColWidth = Math.floor((containerWidth - (Math.max(0, (numCols-1))*_settings.gutterWidth)) / numCols),
				currColIndex = 0,
				smallestColIndex = 0,
				leftOffset = 0;

			// TODO: move this to a separate 'start' function
			_container.style.position = 'relative';

			// Attach a guard for smaller screens
			if (_getWindowWidth() < _settings.minWidth) {
				_resetItems();
				return;
			}

			// Prepare a height counter for each column
			_columns = [];
			while (numCols > 0) {
				_columns.push({w: 0, h: 0});
				numCols--;
			}

			// Loop over items
			while (c < max) {
				// Calculate the left offset
				leftOffset = 0;
				if (currColIndex > 0) {
					var colWidths = [],
						totalWidth = 0;

					for (var i = 0, len = _columns.length; i < len; i++) {
						colWidths.push(_columns[i].w);
					}
					colWidths = colWidths.slice(0, currColIndex);

					for (var i = 0, len = colWidths.length; i < len; i++) {
						leftOffset += colWidths[i];
					}
				}

				// Grab the next item
				currItem = _items[c];

				// Set item styles
				currItem.style.position = 'absolute';
				currItem.style.left = (currColIndex*_settings.gutterWidth + leftOffset) + 'px';
				currItem.style.top = _columns[currColIndex].h + 'px';
				currItem.style.width = maxColWidth + 'px';

				// Increase column height counter
				_columns[currColIndex].h += outerHeight(currItem);
				_columns[currColIndex].w = outerWidth(currItem);

				// Get the next column index
				currColIndex = _getSmallestCol();

				// Increase loop counter
				c++;
			}

			// Sort column heights
			_columns.sort(function (left, right) {
				return left.h > right.h ? 1 : -1;
			});

			// Make container fit the largest column
			_container.style.height = _columns.pop().h + 'px';
		};

		// Gets the number of columns based on the current breakpoint
		var _getNumCols = function () {
			var colSetting = null,
				ww = _getWindowWidth();
			for ( var i = 0, len = _settings.columns.length,
					  col; i < len; i++) {
				col = _settings.columns[i]
				if (col.breakPoint < ww && (colSetting === null || col.breakPoint > colSetting.breakPoint)) {
					colSetting = col;
				}
			}

			return !!colSetting ? colSetting.columns : 0;
		};

		// Finds the smallest column
		// TODO: Make sure only the smallest to the right is picked
		var _getSmallestCol = function () {
			var index;

			for (var i = 0, len = _columns.length, mem = null; i < len; i++) {
				if (mem === null) {
					mem = _columns[i];
					index = i;
				} else {
					if (mem.h > _columns[i].h) {
						index = i;
						mem = _columns[i];
					}
				}
			}
			return index;
		};

		// Resets the styles that were given to the elements and container
		var _resetItems = function () {
			for (var i = 0, len = _items.length, currItem; i < len; i++) {
				currItem = _items[i];
				_items[i].removeAttribute('style');
				/*currItem.style.position = null;
				currItem.style.left = null;
				currItem.style.top = null;
				currItem.style.width = null;*/
			}

			//_container.style.position = null;
			_container.removeAttribute('style');
		};

		// Gets the width of the window
		var _getWindowWidth = function () {
			return Math.max(
				document.body.offsetWidth || 0,
				document.documentElement.offsetWidth || 0,
				window.innerWidth || 0
			);
		};

		// PUBLIC FUNCTIONS

		// Pauses the hoisting of elements
		this.pause = function () {
			_removeWindowListener();
		};

		// Resets and stops hoisting elements
		this.stop = function () {
			_resetItems();
			_removeWindowListener();
		};

		// Starts hoisting elements
		this.start = function () {
			_resetItems();
			_addWindowListener();
		};

		// Resets and parses items, triggers a resize
		this.reset = function () {
			_resetItems();
			items = document.querySelectorAll(settings.itemSelector);
			_windowResizeHandler.apply(this);
		};

		// Set the gutter width of a Hoist instance
		this.setGutter = function (w) {
			if (w === undefined || w !== parseInt(w, 10)) {
				console.error('`setGutter()` requires an Integer value.');
				return;
			}

			settings.gutterWidth = w;
		};

		// Merge settings
		_containerSelector = container || _containerSelector;
		opts = opts || {};
		_settings = extend({}, _settings, opts);

		// Initialize
		_init();
	}

	///////////////////////////////////////////////////////////////////////////
	//                                                                       //
	// LIBS                                                                  //
	//                                                                       //
	// A simplified subset of Underscore.js functions                        //
	// https://github.com/jashkenas/underscore                               //
	//                                                                       //
	///////////////////////////////////////////////////////////////////////////

	// Get the current timestamp as integer
	var now = Date.now || function() {
		return new Date().getTime();
	};

	// Extends an object with another object
	var extend = function(obj) {
		if (!isObject(obj)) return obj;
		var source, prop;
		for (var i = 1, length = arguments.length; i < length; i++) {
			source = arguments[i];
			for (prop in source) {
				if (hasOwnProperty.call(source, prop)) {
					obj[prop] = source[prop];
				}
			}
		}
		return obj;
	};

	// Checks if a variable is an object
	var isObject = function(obj) {
		var type = typeof obj;
		return type === 'function' || type === 'object' && !!obj;
	};

	// Trigger the passed function only once during the
	// passed in wait period
	var throttle = function(func, wait, options) {
		var context, args, result;
		var timeout = null;
		var previous = 0;
		if (!options) options = {};
		var later = function() {
			previous = options.leading === false ? 0 : now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		};
		return function() {
			var rightNow = now();
			if (!previous && options.leading === false) previous = rightNow;
			var remaining = wait - (rightNow - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = rightNow;
				result = func.apply(context, args);
				if (!timeout) context = args = null;
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	};

	///////////////////////////////////////////////////////////////////////////
	//                                                                       //
	// UTILITIES                                                             //
	//                                                                       //
	///////////////////////////////////////////////////////////////////////////

	// Gets the value for a style property of an element
	var getStyleVal = function (el, styleProp) {	
		var propVal;

		if (el.currentStyle) {
			propVal = el.currentStyle[styleProp];
		}
		else if (window.getComputedStyle) {
			propVal = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
		}
		return propVal || 'auto';
	};

	// Measures an elements outer height, including margin
	var outerHeight = function (el) {
		var mt = getStyleVal(el, 'margin-top').split('px').shift(),
			mb = getStyleVal(el, 'margin-bottom').split('px').shift();

		mt = parseInt(mt === 'auto' ? 0 : mt);
		mb = parseInt(mb === 'auto' ? 0 : mb);

		return Math.round(el.clientHeight + mt + mb);
	};

	// Measures an elements outer width, including margin
	var outerWidth = function (el) {
		var ml = getStyleVal(el, 'margin-left').split('px').shift(),
			mr = getStyleVal(el, 'margin-rigth').split('px').shift();

		ml = parseInt(ml === 'auto' ? 0 : ml);
		mr = parseInt(mr === 'auto' ? 0 : mr);

		return Math.round(el.clientWidth + ml + mr);	
	};

	// Gets and converts a specific margin value to an integer
	var intMargin = function (side) {
		/*var opposite = ,
			sideA*/
	};

	window.Hoist = window.Hoist || Hoist;
}(window, document));