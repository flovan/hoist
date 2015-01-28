![Hoist](https://raw.github.com/flovan/hoist/master/demo/img/hoist.gif)

# Hoist.js v1.0.1

A zero-dependency script to avoid gaps in fluid, breakpoint-aware columns.  
2KB minified and gzipped.

[&rarr; Demo page &larr;](http://htmlpreview.github.io/?https://github.com/flovan/hoist/blob/master/demo/index.html) (best viewed in a resizable browser)

## Example

````javascript
var h =  new Hoist('.row', {
	minWidth: 600,
	itemSelector: '.col',
	columns: [{
		breakPoint: 1200,
		columns: 4
	}, {
		breakPoint: 1000,
		columns: 3
	}, {
		breakPoint: 600,
		columns: 2
	}]
});

````

## API

**`var h = new Hoist([container], [opts])`**  

Create a new Hoist instance.  
`[container]` is a String selector (so either a class, id, or any "query-able" dom element).  
`[opts]` is an optional settings Object. These are the default values:
````javascript
{
	// Child selector
	itemSelector: '.block',
	// Total columns
	columns: 2,
	// When to start hoisting elements
	minWidth: 0,
	// Width in between columns
	gutterWidth: 0,
	// Wait in miliseconds between resize events
	repeatResize: 60
}
````

**`h.pause()`**

Ignores window resizes and pauses the hoisting of elements.

**`h.stop()`**

Removes any elements positioning and stops listening for resizes. This is basicly a kill-switch for Hoist instances.

**`h.start()`**

Starts a paused or stopped Hoist instance.

**`h.reset()`**

Resets known child elements, reparses and calculates the layout again. This is handy when your layout will be fed with new items dynamically by eg. endless scrolling.

**`h.setGutter([integer])`**

Set the gutter width of a Hoist instance to the passed in width.

## Browser support

IE 8+, Chrome 39+, Safari 8+, Opera 26+, FF 35+ 

> **Note:** Modern browser support will probably be better than listed above. If you tested an earlier version, feel free to send a PR with updated versions.

## TODO

* Allow % based gutters.

## Changelog

* **1.0.1**
  * Less harsh style clearing below minimum breakpoint
* **1.0.0**
  * API now exists of "start", "stop", "pause", "reset" and "setGutter"
  * Code cleanup
* **0.2.0**
  * IE8+ support
* **0.1.0**
  * Cleaned up, no more dependencies, working in latest Chrome
* **0.0.1**  
  * First commit, WIP

[Gif source](http://www.gifbay.com/gif/dost_thou_hoist-36535/)