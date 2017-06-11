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

	// internal counter for each update
	this._counter = 0;

	this._handler = {
		message: this._handleMessage.bind(this),
		mousedown: this._handleMousedown.bind(this),
		mousemove: this._handleMousemove.bind(this),
		contextmenu: this._handleContextmenu.bind(this),
		mouseout: this._handleMouseout.bind(this)
	};
}

/**
 * Add the document event listener
 **/
GestureHandler.prototype.enable = function enable () {
	window.addEventListener("message", this._handler.message, false);
	document.addEventListener('mousedown', this._handler.mousedown, true);
	this.enabled = true;
}

/**
 * Remove the event listeners and enables the object to get removed from gc
 **/
GestureHandler.prototype.disable = function disable () {
	window.removeEventListener("message", this._handler.message, false);
	document.removeEventListener('mousedown', this._handler.mousedown, true);
	this.enabled = false;
	// reset gesture array, state and counter
	this.directions = [];
	this._started = false;
	this._counter = 0;
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
GestureHandler.prototype._start = function _start (x, y) {
	// run onStart methode if defined with the current x and y coordinates as parameter
	if (this.onStart) this.onStart(x, y);

	// change state
	this._started = true;

	// set the current point to the reference point
	this._referencePoint = {
		x: x,
		y: y
	};
}

/**
 * Indicates the gesture change and should be called every time the cursor position changes
 * requires at least an object width clientX and clientY or any cursor event object
 **/
GestureHandler.prototype._update = function _update (x, y) {
	// run onUpdate methode if defined with the current x and y coordinates as parameter
	if (this.onUpdate && this._counter % 5 === 0) this.onUpdate(x, y);

	// calculate distance between the current point and the reference point
	let distance = getDistance(this._referencePoint.x, this._referencePoint.y, x, y);

	if (distance > 10) {
		let angle = getAngle(this._referencePoint.x, this._referencePoint.y, x, y),
				direction = getDirecion(angle);

		if (this.directions[this.directions.length - 1] !== direction) {
			// add new direction to gesture list
			this.directions.push(direction);

			// run onChange methode if defined with the directions array as parameter
			if (this.onChange) this.onChange(this.directions);
		}

		// set new reference point
		this._referencePoint.x = x;
		this._referencePoint.y = y;
	}

	// increment counter
	this._counter++;
}

/**
 * Indicates the gesture end and should be called to reset the gesture
 **/
GestureHandler.prototype._end = function _end () {
	// run onChange methode if defined with the directions array as parameter
	if (this.onEnd) this.onEnd(this.directions);

	// reset gesture array, state and counter
	this.directions = [];
	this._started = false;
	this._counter = 0;
}

/**
 * Handles iframe messages which will start the gesture
 **/
GestureHandler.prototype._handleMessage = function _handleMessage (event)  {
	if (event.data.hasOwnProperty("screenX") && event.data.hasOwnProperty("screenY")) {
		let x = Math.round(event.data.screenX  / window.devicePixelRatio - window.mozInnerScreenX),
				y = Math.round(event.data.screenY  / window.devicePixelRatio - window.mozInnerScreenY);

		if (this._started === false) {
			document.addEventListener('mousemove', this._handler.mousemove, true);
			document.addEventListener('contextmenu', this._handler.contextmenu, true);
			document.addEventListener('mouseout', this._handler.mouseout, true);
			this._start(x, y);
		}
		// not required since overlay div
		/*else {
			this._update(x, y);
		}*/
	}
}

/**
 * Handles mousemove which will either start the gesture or update it
 **/
GestureHandler.prototype._handleMousemove = function _handleMousemove (event) {
	if (event.buttons === 2) {
		if (this._started === false) {
			document.addEventListener('contextmenu', this._handler.contextmenu, true);
			document.addEventListener('mouseout', this._handler.mouseout, true);
			this._start(event.clientX, event.clientY);
		}
		else {
			this._update(event.clientX, event.clientY);
		}
	}
}

/**
 * Handles mousedown which will add the mousemove listener
 **/
GestureHandler.prototype._handleMousedown = function _handleMousedown (event) {
	if (event.button === 2) {
		document.addEventListener('mousemove', this._handler.mousemove, true);
	}
}

/**
 * Handles context menu popup and removes all added listeners
 **/
GestureHandler.prototype._handleContextmenu = function _handleContextmenu (event) {
	if (this._started === true) {
		document.removeEventListener('mousemove', this._handler.mousemove, true);
		document.removeEventListener('contextmenu', this._handler.contextmenu, true);
		document.removeEventListener('mouseout', this._handler.mouseout, true);
		event.preventDefault();
		this._end();
	}
}

/**
 * Handles mouse out and removes all added listeners
 **/
GestureHandler.prototype._handleMouseout = function _handleMouseout (event) {
	if (event.relatedTarget === null && this._started === true) {
		document.removeEventListener("mousemove", this._handler.mousemove, true);
		document.removeEventListener("mouseout", this._handler.mouseout, true);
		document.removeEventListener('contextmenu', this._handler.contextmenu, true);
		this._end();
	}
}
