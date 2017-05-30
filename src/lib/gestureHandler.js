'use strict'

/**
 * GestureHandler class
 * provides 4 events: onStart, onUpdate, onChange, onEnd
 * directions -  contains an array of all occured gesture directions
 * enabled - returns a boolean whether or not the handler is enabled
 * on default the handler is disabled and must be enabled via enable()
 * REQUIRES: math.js
 **/
var GestureHandler = function GestureHandler () {
	this.directions = [];
	this.enabled = false;

	this._started = false;

	// holds reference point to current point
	this._referencePoint = {
		x: 0,
		y: 0
	};

	let self = this;

	this._onclick = function (event) {
		// on right click
		if (event.button === 2) {
			function mousemove (event) {
				// on right click
				if (event.buttons === 2) {
					if (!self._started) self._start(event);
					else self._update(event)
				}
			}

			function mouseout (event) {
				// if mouse moved out of tab container
				if (event.relatedTarget === null && self._started) {
					self._end();
					document.removeEventListener("mousemove", mousemove, true);
					document.removeEventListener("mouseout", mouseout, true);
					document.removeEventListener('contextmenu', contextmenu, true);
				}
			}

			function contextmenu (event) {
				if (self._started) {
					self._end();
					// prevent the context menu
					event.preventDefault();
				}
				document.removeEventListener("mousemove", mousemove, true);
				document.removeEventListener("mouseout", mouseout, true);
				document.removeEventListener('contextmenu', contextmenu, true);
			}

			document.addEventListener("mousemove", mousemove, true);
			document.addEventListener("mouseout", mouseout, true);
			document.addEventListener('contextmenu', contextmenu, true);
		}
	};
}

/**
 * fires on GestureHandler._start()
 **/
GestureHandler.prototype.onStart = null;

/**
 * fires on GestureHandler._update() when a new direction occurs
 **/
GestureHandler.prototype.onChange = null;

/**
 * fires on GestureHandler._update()
 **/
GestureHandler.prototype.onUpdate = null;

/**
 * fires on GestureHandler._end()
 **/
GestureHandler.prototype.onEnd = null;

/**
 * Indicates the gesture start and should only be called once untill gesture end
 * requires at least an object width clientX and clientY or any cursor event object
 **/
GestureHandler.prototype._start = function _start (event) {
	// run onStart methode if defined with the current x and y coordinates as parameter
	if (this.onStart) this.onStart(event.clientX, event.clientY);

	// change state
	this._started = true;

	// set the current point to the reference point
	this._referencePoint = {
		x: event.clientX,
		y: event.clientY
	};
}

/**
 * Indicates the gesture change and should be called every time the cursor position changes
 * requires at least an object width clientX and clientY or any cursor event object
 **/
GestureHandler.prototype._update = function _update (event) {
	// run onUpdate methode if defined with the current x and y coordinates as parameter
	if (this.onUpdate) this.onUpdate(event.clientX, event.clientY);

	// calculate distance between the current point and the reference point
	let distance = getDistance(this._referencePoint.x, this._referencePoint.y, event.clientX, event.clientY);

	if (distance > 10) {
		let angle = getAngle(this._referencePoint.x, this._referencePoint.y, event.clientX, event.clientY),
				direction = getDirecion(angle);

		if (this.directions[this.directions.length - 1] !== direction) {
			// add new direction to gesture list
			this.directions.push(direction);

			// run onChange methode if defined with the directions array as parameter
			if (this.onChange) this.onChange(this.directions);
		}

		// set new reference point
		this._referencePoint.x = event.clientX;
		this._referencePoint.y = event.clientY;
	}
}

/**
 * Indicates the gesture end and should be called to reset the gesture
 **/
GestureHandler.prototype._end = function _end () {
	// run onChange methode if defined with the directions array as parameter
	if (this.onEnd) this.onEnd(this.directions);

	// reset gesture array and state
	this.directions = [];
	this._started = false;
}

/**
 * Add the document event listener
 **/
GestureHandler.prototype.enable = function enable () {
	document.addEventListener("mousedown", this._onclick, true);
	this.enabled = true;
}

/**
 * Remove the document event listener and enables the object to get removed from gc
 **/
GestureHandler.prototype.disable = function disable () {
	document.removeEventListener("mousedown", this._onclick, true);
	this.enabled = false;
}
