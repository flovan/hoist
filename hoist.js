//  Hoist.js 0.0.1
//  https://github.com/flovan/hoist
//  (c) 2015-whateverthecurrentyearis Florian Vanthuyne
//  Hoist may be freely distributed under the MIT license.

(function(window){

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

		init: function () {
			var self = this,
				t;

			// Identify DOM elements
			this.container = document.querySelectorAll(this.containerSelector);
			this.items = document.querySelectorAll(this.settings.itemSelector);

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
				self.win.resize();
				clearTimeout(t);
			}, self.settings.repeatResize);

			// Set state to active
			this.active = true;
		},

		windowResizeHandler: function (e) {
			var iw = Math.max(
					document.body.offsetWidth || 0,
					document.documentElement.offsetWidth || 0,
					window.innerWidth || 0
				),
				max = this.items.length,
				c = 0,
				currItem = null,
				numCols = this.multipleBreaks ? this.getNumCols() : this.settings.columns,
				currColIndex = 0,
				leftOffset = 0;

			this.container.style.position = 'relative';

			// Attach a guard for smaller screens
			if (iw < this.settings.minWidth) {
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
					//leftOffset = this.columns[currColIndex].w;
					leftOffset += _.reduce(_.pluck(this.columns, 'w').slice(0, currColIndex), function (memo, num) { return memo + num; }, 0);
				}

				// Grab the next item
				currItem = $(this.items[c]);

				// Set item styles
				currItem.css({
					position: 'absolute',
					left: leftOffset + 'px',
					top: this.columns[currColIndex].h + 'px'
				});

				// Increase column height counter
				this.columns[currColIndex].h += Utils.outerHeight(currItem[0]);
				this.columns[currColIndex].w = Utils.outerWidth(currItem[0]);

				// Get the next column index
				if (typeof this.columns[currColIndex + 1] === 'undefined') {
					currColIndex = 0;
				} else if (this.columns[currColIndex].h > this.columns[currColIndex + 1].h) {
					currColIndex++;
				}

				// Increase loop counter
				c++;
			}

			// Sort column heights
			this.columns = _.sortBy(this.columns, 'h');

			// Make container fit the largest column
			this.container.css('height', this.columns.pop().h + 'px');
		},

		getNumCols: function () {
			var currentBreak = _.sortBy(_.filter(this.settings.columns.slice(0), function (bp) {
				return bp.breakPoint < window.innerWidth;
			}), 'breakPoint');

			return currentBreak.length ? currentBreak.pop().columns : 0;
		},

		resetItems: function () {
			// Remove the style attribute for a clean reset
			for (var i = 0, len = this.items.length; i < len; i++) {
				this.items[i].removeAttribute('style');
			}
			for (var i = 0, len = this.container.length; i < len; i++) {
				this.container[i].removeAttribute('style');
			}
		},

		// PUBLIC FUNCTIONS

		remove: function () {
			// Reset items and remove resize listener
			this.resetItems();
			
			try {
				window.removeEventListener('resize', this.windowResizeHandler.bind(this));
			} catch (e) {
				window.detachEvent('onresize', this.windowResizeHandler.bind(this));
			}
		},

		reset: function () {
			// Reset and parse items again
			this.resetItems();
			this.items = document.querySelectorAll(this.settings.itemSelector);

			// Trigger a resize
			this.windowResizeHandler.bind(this)
		}
	};

	// A simplified subset of Underscore.js functions
	// https://github.com/jashkenas/underscore

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

	window.Hoist = window.Hoist || Hoist;
}(window));