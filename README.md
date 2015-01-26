![Hoist](https://raw.github.com/flovan/hoist/master/demo/img/hoist.gif)

#Hoist.js v0.2.0

A vanilla script to avoid gaps in fluid, breakpoint-aware columns.
2KB minified and gzipped.

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
`[opts]` is an optional settings Object. These are the defaults:
````javascript
{
	// Child selector
	itemSelector: '.block',
	// Total columns
	columns: 2,
	// When to start hoisting elements
	minWidth: 0,
	// Wait in miliseconds between resize events
	repeatResize: 60
}
````

**`h.reset()`**

Resets known child elements, reparses and calculates the layout again. This is handy when your layout will be fed with new items dynamically by eg. endless scrolling.

**`h.remove()`**

Resets known children and removes the resize listener. Basically this acts as a killswitch for a Hoist instance.

## Browser support

IE 8+, Chrome 39+, Safari 8+, Opera 26+, FF 35+ 

> **Note:** Modern browser support will probably be better than listed above. If you tested an earlier version, feel free to send a PR with updated versions.

## TODO

* "stop", "pauze" and "start" instead of "remove"
* Option to specify gutters (% or px)

## Changelog

* **0.2.0**
  * IE8+ support
* **0.1.0**
  * Cleaned up, no more dependencies, working in latest Chrome
* **0.0.1**  
  * First commit, WIP

[Gif source](http://www.gifbay.com/gif/dost_thou_hoist-36535/)