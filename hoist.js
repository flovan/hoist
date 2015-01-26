//  Hoist.js 0.2.0
//  https://github.com/flovan/hoist
//  (c) 2015-whateverthecurrentyearis Florian Vanthuyne
//  Hoist may be freely distributed under the MIT license.

(function(window, document){

	///////////////////////////////////////////////////////////////////////////
	//                                                                       //
	// IE8(-) polyfills                                                      //
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
	// Constructor                                                           //
	//                                                                       //
	///////////////////////////////////////////////////////////////////////////

	var Hoist = function (container, opts) {
		if (typeof container !== 'string') {
			console.error('Hoist constructor error: container selector needs to be a String.');
		}

		this.containerSelector = container || this.containerSelector;

		// Merge settings
		opts = opts || {};
		this.settings = extend({}, this.settings, opts);

		// Expose API
		this.remove = this.remove;
		this.reset = this.reset;

		// Initialize
		this.init();
	}

	///////////////////////////////////////////////////////////////////////////
	//                                                                       //
	// Prototype                                                             //
	//                                                                       //
	///////////////////////////////////////////////////////////////////////////

	Hoist.prototype = {

		// PRIVATE VARS

		win: null,
		containerSelector: '#container',
		container: null,
		items: null,
		columns: null,
		active: false,
		multipleBreaks: false,
		settings: {
			itemSelector: '.block',
			columns: 2,
			minWidth: 0,
			repeatResize: 60
		},

		// PRIVATE FUNCTIONS

		// Initializes the class instance
		init: function () {
			var self = this,
				t;

			// Identify DOM elements
			this.container = document.querySelectorAll(this.containerSelector)[0];
			this.items = document.querySelectorAll(this.settings.itemSelector);

			// Throw a warning if the plugin won't actually be doing anything
			if (!this.items.length) {
				console.warn('Hoist error: selector `' + this.settings.itemSelector + '` did not match any elements.');
			}

			// Find out if this setup needs multiple breaks
			this.multipleBreaks = (this.settings.columns.constructor === Array);

			// Listen for and trigger resize
			try {
				window.addEventListener('resize', throttle(this.windowResizeHandler.bind(this), 50));
			} catch (e) {
				window.attachEvent('onresize', throttle(this.windowResizeHandler.bind(this), 50));
			}
			this.windowResizeHandler.apply(this);

			// Trigger another offset resize for the webfonts
			t = setTimeout(function () {
				self.windowResizeHandler.apply(self);
				clearTimeout(t);
			}, self.settings.repeatResize);

			// Set state to active
			this.active = true;
		},

		// A handler for window resizes
		windowResizeHandler: function (e) {
			var ww = this.getWindowWidth(),
				max = this.items.length,
				c = 0,
				currItem = null,
				numCols = this.multipleBreaks ? this.getNumCols() : this.settings.columns,
				currColIndex = 0,
				smallestColIndex = 0,
				leftOffset = 0;

			// TODO: move this to a separate 'start' function
			this.container.style.position = 'relative';

			// Attach a guard for smaller screens
			if (ww < this.settings.minWidth) {
				this.resetItems();
				return;
			}

			// Prepare a height counter for each column
			this.columns = [];
			while (numCols > 0) {
				this.columns.push({w: 0, h: 0});
				numCols--;
			}

			// Loop over items
			while (c < max) {
				// Calculate the left offset
				leftOffset = 0;
				if (currColIndex > 0) {
					var colWidths = [],
						totalWidth = 0;

					for (var i = 0, len = this.columns.length; i < len; i++) {
						colWidths.push(this.columns[i].w);
					}
					colWidths = colWidths.slice(0, currColIndex);

					for (var i = 0, len = colWidths.length; i < len; i++) {
						leftOffset += colWidths[i];
					}
				}

				// Grab the next item
				currItem = this.items[c];

				// Set item styles
				currItem.style.position = 'absolute';
				currItem.style.left = leftOffset + 'px';
				currItem.style.top = this.columns[currColIndex].h + 'px';

				// Increase column height counter
				this.columns[currColIndex].h += outerHeight(currItem);
				this.columns[currColIndex].w = outerWidth(currItem);

				// Get the next column index
				currColIndex = this.getSmallestCol();

				// Increase loop counter
				c++;
			}

			// Sort column heights
			this.columns.sort(function (left, right) {
				return left.h > right.h ? 1 : -1;
			});

			// Make container fit the largest column
			this.container.style.height = this.columns.pop().h + 'px';
		},

		// Gets the number of columns based on the current breakpoint
		getNumCols: function () {
			var colSetting = null,
				ww = this.getWindowWidth();
			for ( var i = 0, len = this.settings.columns.length,
					  col; i < len; i++) {
				col = this.settings.columns[i]
				if (col.breakPoint < ww && (colSetting === null || col.breakPoint > colSetting.breakPoint)) {
					colSetting = col;
				}
			}

			return !!colSetting ? colSetting.columns : 0;
		},

		// Finds the smallest column
		// TODO: Make sure only the smallest to the right is picked
		getSmallestCol: function () {
			var index;

			for (var i = 0, len = this.columns.length, mem = null; i < len; i++) {
				if (mem === null) {
					mem = this.columns[i];
					index = i;
				} else {
					if (mem.h > this.columns[i].h) {
						index = i;
						mem = this.columns[i];
					}
				}
			}
			return index;
		},

		// Resets the styles that were given to the elements and container
		resetItems: function () {
			for (var i = 0, len = this.items.length; i < len; i++) {
				this.items[i].removeAttribute('style');
			}

			this.container.removeAttribute('style');
		},

		// Gets the width of the window
		getWindowWidth: function () {
			return Math.max(
				document.body.offsetWidth || 0,
				document.documentElement.offsetWidth || 0,
				window.innerWidth || 0
			);
		},

		// PUBLIC FUNCTIONS

		// Removes all functionality from a Hoist instance
		// TODO: replace by "start", "stop" and "pause"
		remove: function () {
			this.resetItems();
			
			try {
				window.removeEventListener('resize', this.windowResizeHandler.bind(this));
			} catch (e) {
				window.detachEvent('onresize', this.windowResizeHandler.bind(this));
			}
		},

		// Resets and parses items, triggers a resize
		reset: function () {
			this.resetItems();
			this.items = document.querySelectorAll(this.settings.itemSelector);
			this.windowResizeHandler.apply(this);
		}
	};

	///////////////////////////////////////////////////////////////////////////
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
	// Some Utility functions                                                //
	//                                                                       //
	///////////////////////////////////////////////////////////////////////////

	// Gets the value for a style property of an element
	var getStyleVal = function (el, styleProp)
	{	
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