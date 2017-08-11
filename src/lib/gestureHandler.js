'use strict'

/**
 * GestureHandler "singleton" class using the modul pattern
 * provides 4 events: on start, update, change and end
 * directions -  contains an array of all occured gesture directions
 * on default the handler is disabled and must be enabled via enable()
 * REQUIRES: math.js
 **/
const GestureHandler = (function() {

// public variables and methods

  let modul = {};

	modul.mousebutton = 2;

	/**
	 * Add callbacks to the given events
	 **/
  modul.on = function on (event, callback) {
		if (event in events) {
			events[event].push(callback);
			return this;
		}
		return false;
  };


	/**
	 * Add the document event listener
	 **/
  modul.enable = function enable () {
		window.addEventListener("message", handleMessage, false);
		document.addEventListener('mousedown', handleMousedown, true);
  };


	/**
	 * Remove the event listeners and resets the handler
	 **/
	modul.disable = function disable () {
		window.removeEventListener("message", handleMessage, false);
		document.removeEventListener('mousedown', handleMousedown, true);
		document.removeEventListener('mousemove', handleMousemove, true);
		document.removeEventListener('contextmenu', handleContextmenu, true);
		document.removeEventListener('mouseout', handleMouseout, true);
		// reset gesture array and internal state
		directions = [];
		started = false;
  }

// private variables and methods

	// contains all gesture direction letters
	let directions = [];

	// internal status
	let started = false;

	// holds reference point to current point
	let referencePoint = {
		x: 0,
		y: 0
	};

	// holds all event callbacks added by on()
	let events = {
		'start': [],
		'update': [],
		'change': [],
		'end': []
	};


	/**
	 * Indicates the gesture start and should only be called once untill gesture end
	 * requires at least an object width clientX and clientY or any cursor event object
	 **/
  function start (x, y) {
		// dispatch all binded functions with the current x and y coordinates as parameter on start
		events['start'].forEach((callback) => callback(x, y));

		// change internal state
		started = true;

		// set the current point to the reference point
		referencePoint.x = x;
		referencePoint.y = y;
	}


	/**
	 * Indicates the gesture change and should be called every time the cursor position changes
	 * requires at least an object width clientX and clientY or any cursor event object
	 **/
	function update (x, y) {
		// calculate distance between the current point and the reference point
		let distance = getDistance(referencePoint.x, referencePoint.y, x, y);

		if (distance > 10) {
			// dispatch all binded functions with the current x and y coordinates as parameter on update
			events['update'].forEach((callback) => callback(x, y));

			let angle = getAngle(referencePoint.x, referencePoint.y, x, y),
					direction = getDirecion(angle);

			if (directions[directions.length - 1] !== direction) {
				// add new direction to gesture list
				directions.push(direction);

				// dispatch all binded functions with the directions array as parameter on change
				events['change'].forEach((callback) => callback(directions));
			}

			// set new reference point
			referencePoint.x = x;
			referencePoint.y = y;
		}
	}


	/**
	 * Indicates the gesture end and should be called to reset the gesture
	 **/
	function end () {
		// dispatch all binded functions on end
		events['end'].forEach((callback) => callback(directions));

		// reset gesture array and internal state
		directions = [];
		started = false;
	}


	/**
	 * Handles iframe messages which will start the gesture
	 **/
	function handleMessage (event)  {
		if (event.data.hasOwnProperty("screenX") && event.data.hasOwnProperty("screenY")) {
			let x = Math.round(event.data.screenX / window.devicePixelRatio - window.mozInnerScreenX),
					y = Math.round(event.data.screenY / window.devicePixelRatio - window.mozInnerScreenY);

			if (!started) {
				document.addEventListener('mousemove', handleMousemove, true);
				document.addEventListener('contextmenu', handleContextmenu, true);
				document.addEventListener('mouseup', handleMouseup, true);
				document.addEventListener('mouseout', handleMouseout, true);
				start(x, y);
			}
		}
	}


	/**
	 * Handles mousemove which will either start the gesture or update it
	 **/
	function handleMousemove (event) {
		if (event.buttons === modul.mousebutton) {
			if (!started) {
				document.addEventListener('contextmenu', handleContextmenu, true);
				document.addEventListener('mouseup', handleMouseup, true);
				document.addEventListener('mouseout', handleMouseout, true);
				start(event.clientX, event.clientY);
			}
			else {
				update(event.clientX, event.clientY);
			}
		}
	}


	/**
	 * Handles mousedown which will add the mousemove listener
	 **/
	function handleMousedown (event) {
		if (event.buttons === modul.mousebutton) {
			document.addEventListener('mousemove', handleMousemove, true);
			// prevent selection and middle click
			//if (event.buttons === 1 || event.buttons === 4) event.preventDefault();
		}
	}


	/**
	 * Handles context menu popup and removes all added listeners
	 **/
	function handleContextmenu (event) {
		if (started) {
			document.removeEventListener('mousemove', handleMousemove, true);
			document.removeEventListener('contextmenu', handleContextmenu, true);
			document.removeEventListener('mouseup', handleMouseup, true);
			document.removeEventListener('mouseout', handleMouseout, true);
			// prevent context menu
			//if (modul.mousebutton === 2)
      event.preventDefault();
			end();
		}
	}


	/**
	 * Handles context menu popup and removes all added listeners
	 **/
	function handleMouseup (event) {
		if (started) {
			document.removeEventListener('mousemove', handleMousemove, true);
			document.removeEventListener('contextmenu', handleContextmenu, true);
			document.removeEventListener('mouseup', handleMouseup, true);
			document.removeEventListener('mouseout', handleMouseout, true);
			//event.preventDefault();
			end();
		}
	}


	/**
	 * Handles mouse out and removes all added listeners
	 **/
	function handleMouseout (event) {
		if (started && event.relatedTarget === null) {
			document.removeEventListener("mousemove", handleMousemove, true);
			document.removeEventListener("mouseout", handleMouseout, true);
			document.removeEventListener('mouseup', handleMouseup, true);
			document.removeEventListener('contextmenu', handleContextmenu, true);
			end();
		}
	}

	// due to modul pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return modul;
})();
