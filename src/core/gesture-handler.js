'use strict'

/**
 * GestureHandler "singleton" class using the module pattern
 * the handler behaves different depending on whether it's injected in a frame or not
 * frame: detects gesture start, move, end and sends an indication message
 * main page: detects whole gesture including frame indication messages and reports it to the background script
 * provides 4 events: on start, update, change and end
 * on default the handler is disabled and must be enabled via enable()
 * REQUIRES: contentCommons.js
 **/
const GestureHandler = (function() {

// public variables and methods

  const module = {};

	/**
	 * Add callbacks to the given events
	 **/
  module.on = function on (event, callback) {
    // if event does not exist or function already applied skip it
		if (event in events && !events[event].includes(callback))
      events[event].push(callback);
		return this;
  };


  /**
   * applies necessary settings
   **/
  module.applySettings = function applySettings (Settings) {
    mouseButton = Number(Settings.Gesture.mouseButton);
    suppressionKey = Settings.Gesture.suppressionKey;
    distanceSensitivity = Settings.Gesture.distanceSensitivity;
    distanceThreshold = Settings.Gesture.distanceThreshold;
    timeoutActive = Settings.Gesture.Timeout.active;
    timeoutDuration = Settings.Gesture.Timeout.duration;
  }


	/**
	 * Add the event listeners
	 **/
  module.enable = function enable () {
		if (inIframe()) {
      window.addEventListener('pointerdown', handleFrameMousedown, true);
      window.addEventListener('pointermove', handleFrameMousemove, true);
      window.addEventListener('pointerup', handleFrameMouseup, true);
      window.addEventListener('dragstart', handleDragstart, true);
    }
    else {
      browser.runtime.onMessage.addListener(handleMessage);
      window.addEventListener('pointerdown', handleMousedown, true);
    }
  };


	/**
	 * Remove the event listeners and resets the handler
	 **/
	module.disable = function disable () {
    if (inIframe()) {
      window.removeEventListener('pointerdown', handleFrameMousedown, true);
      window.removeEventListener('pointermove', handleFrameMousemove, true);
      window.removeEventListener('pointerup', handleFrameMouseup, true);
      window.removeEventListener('dragstart', handleDragstart, true);
    }
    else {
  		browser.runtime.onMessage.removeListener(handleMessage);
  		window.removeEventListener('pointerdown', handleMousedown, true);
  		window.removeEventListener('pointermove', handleMousemove, true);
      window.removeEventListener('pointerup', handleMouseup, true);
  		window.removeEventListener('contextmenu', handleContextmenu, true);
  		window.removeEventListener('pointerout', handleMouseout, true);
      window.removeEventListener('dragstart', handleDragstart, true);
      // reset gesture array, internal state and target data
  		directions = [];
  		state = "passive";
      targetData = {};
    }
  }


  /**
   * Cancel the gesture controller and dispatch abort callbacks
   **/
  module.cancel = function cancel () {
    if (state !== "cancelled") {
      // dispatch all binded functions on abort
      events['abort'].forEach((callback) => callback());
      // cancel or reset the controller
      if (state === "active") {
        state = "cancelled";
        directions = [];
      }
      else if (state === "pending") reset();
    }
  };

// private variables and methods

  // setting properties
  let mouseButton = 2,
      suppressionKey = "",
      distanceThreshold = 10,
      distanceSensitivity = 10,
      timeoutActive = false,
      timeoutDuration = 1;

	// contains all gesture direction letters
	let directions = [];

	// internal state: passive, pending, active, cancelled
	let state = "passive";

	// holds reference point to current point
	const referencePoint = {
		x: 0,
		y: 0
	};

  // contains the timeout identifier
  let timeout = null;

  // contains relevant data of the target element
  let targetData = {};

	// holds all event callbacks added by on()
	const events = {
		'start': [],
		'update': [],
		'change': [],
    'abort': [],
		'end': []
	};


  /**
   * initializes the gesture to the "pending" state, where it's unclear if the user is starting a gesture or not
	 * requires the current x and y coordinates
	 **/
	function init (x, y) {
    // set the initial point
    referencePoint.x = x;
    referencePoint.y = y;

    // change internal state
    state = "pending";

    // add gesture detection listeners
		window.addEventListener('pointermove', handleMousemove, true);
    window.addEventListener('dragstart', handleDragstart, true);
    window.addEventListener('contextmenu', handleContextmenu, true);
    window.addEventListener('pointerup', handleMouseup, true);
    window.addEventListener('pointerout', handleMouseout, true);
	}


	/**
	 * Indicates the gesture start and should only be called once untill gesture end
	 **/
  function start () {
		// dispatch all binded functions with the current x and y coordinates as parameter on start
		events['start'].forEach((callback) => callback(referencePoint.x, referencePoint.y));

		// change internal state
		state = "active";
	}


	/**
	 * Indicates the gesture change and should be called every time the cursor position changes
	 * requires the current x and y coordinates
	 **/
	function update (points) {
		// dispatch all binded functions with the current points as parameter on update
    // note that the points are passed by value and not by reference
		events['update'].forEach((callback) => callback( cloneObject(points) ));

    // handle timeout
    if (timeoutActive) {
      // clear previous timeout if existing
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        // dispatch all binded functions on abort
        events['abort'].forEach((callback) => callback());
        state = "cancelled";
        // clear directions
        directions = [];
      }, timeoutDuration * 1000);
    }

    // get last point coordinates
    const x = points[points.length - 1].x;
    const y = points[points.length - 1].y;

		const direction = getDirection(referencePoint.x, referencePoint.y, x, y);

		if (directions[directions.length - 1] !== direction) {
			// add new direction to gesture list
			directions.push(direction);

      // send message to background on gesture change
      const message = browser.runtime.sendMessage({
        subject: "gestureChange",
        data: {
          gesture: directions.join("")
        }
      });
      // on response (also fires on no response) dispatch all binded functions with the directions array and the command as parameter
      message.then((response) => {
        const command = response ? response.command : null;
        events['change'].forEach((callback) => callback(directions, command));
      });
		}

		// set new reference point
		referencePoint.x = x;
		referencePoint.y = y;
	}


	/**
	 * Indicates the gesture end and should be called to terminate the gesture
	 **/
	function end (x, y) {
		// dispatch all binded functions on end
		events['end'].forEach((callback) => callback(directions));

    // send directions and target data to background if directions is not empty
    if (directions.length) browser.runtime.sendMessage({
      subject: "gestureEnd",
      data: Object.assign(
        targetData,
        {
          gesture: directions.join(""),
          mousePosition: { x: x, y: y }
        }
      )
    });

		// reset gesture handler
    reset();
	}


  /**
	 * Resets the handler to its initial state
	 **/
  function reset () {
    // remove gesture detection listeners
    window.removeEventListener('pointermove', handleMousemove, true);
    window.removeEventListener('pointerup', handleMouseup, true);
    window.removeEventListener('contextmenu', handleContextmenu, true);
    window.removeEventListener('pointerout', handleMouseout, true);
    window.removeEventListener('dragstart', handleDragstart, true);

    // reset gesture array, internal state and target data
    directions = [];
    state = "passive";
    targetData = {};

    if (timeout) {
      window.clearTimeout(timeout);
      timeout = null;
    }
  }


	/**
	 * Handles iframe/background messages which will update the gesture
	 **/
	function handleMessage (message, sender, sendResponse) {
    switch (message.subject) {
      case "gestureFrameMousedown":
        // init gesture
        init(message.data.x, message.data.y);
        // save target data
        targetData = message.data;
      break;

      case "gestureFrameMousemove":
        const lastPoint = message.data.points[message.data.points.length - 1];
        // calculate distance between the last point and the reference point
        const distance = getDistance(referencePoint.x, referencePoint.y, lastPoint.x, lastPoint.y);
        // induce gesture
        if (state === "pending" && distance > distanceThreshold)
          start();
        // update gesture && mousebutton fix: right click on frames is sometimes captured by both event listeners which leads to problems
        else if (state === "active" && distance > distanceSensitivity && mouseButton !== 2)
          update(message.data.points);
      break;

      case "gestureFrameMouseup":
        if (state === "active" || state === "cancelled")
          end(message.data.x, message.data.y);
        else if (state === "pending") reset();
      break;
    }
	}


	/**
	 * Handles mousedown which will add the mousemove listener
	 **/
	function handleMousedown (event) {
    // on mouse button and no supression key
		if (event.isTrusted && isCertainButton(event.buttons, mouseButton) && (!suppressionKey || !event[suppressionKey])) {
      // init gesture
      init(event.screenX, event.screenY);

      // save target to global variable if exisiting
      if (typeof TARGET !== 'undefined') TARGET = event.target;

      // get and save target data
      targetData = getTargetData(event.target);

			// prevent and middle click scroll
			if (mouseButton === 4) event.preventDefault();
		}
	}


	/**
	 * Handles mousemove which will either start the gesture or update it
	 **/
	function handleMousemove (event) {
    // fallback if getCoalescedEvents is not defined
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    if (!events.length) events.push(event);

    // transform the events to an array of points
    const points = events.map((pointerEvent) => ({x: pointerEvent.screenX, y: pointerEvent.screenY}));

		if (event.isTrusted && isCertainButton(event.buttons, mouseButton)) {
      // calculate distance between the current point and the reference point
      const distance = getDistance(referencePoint.x, referencePoint.y, event.screenX, event.screenY);

      // induce gesture
			if (state === "pending" && distance > distanceThreshold)
				start();

      // update gesture
			else if (state === "active" && distance > distanceSensitivity)
        update(points);

      // prevent text selection
      if (mouseButton === 1) window.getSelection().removeAllRanges();
		}
	}


	/**
	 * Handles context menu popup and removes all added listeners
	 **/
	function handleContextmenu (event) {
    if (event.isTrusted && isCertainButton(mouseButton, 2)) {
      if (state === "active" || state === "cancelled") {
        // prevent context menu
        event.preventDefault();
        end(event.screenX, event.screenY);
      }
      // reset if state is pending
      else if (state === "pending")
        reset();
    }
	}


	/**
	 * Handles mouseup and removes all added listeners
	 **/
  function handleMouseup (event) {
    // only call on left and middle mouse click to terminate gesture
    if (event.isTrusted && isEquivalentButton(event.button, mouseButton) && isCertainButton(mouseButton, 1, 4)) {
  		if (state === "active" || state === "cancelled")
  			end(event.screenX, event.screenY);
      // reset if state is pending
      else if (state === "pending")
        reset();
    }
	}


	/**
	 * Handles mouse out and removes all added listeners
	 **/
	function handleMouseout (event) {
    // only call if cursor left the browser window
    if (event.isTrusted && event.relatedTarget === null) {
  		if (state === "active" || state === "cancelled")
        end(0, 0);
      // reset if state is pending
      else if (state === "pending")
        reset();
    }
	}


  /**
   * Handles dragstart and prevents it if needed
   **/
  function handleDragstart (event) {
    // prevent drag if mouse button and no supression key is pressed
    if (event.isTrusted && isCertainButton(event.buttons, mouseButton) && (!suppressionKey || !event[suppressionKey]))
      event.preventDefault();
  }


  /**
   * Handles mousedown for frames; send message with target data and position
   **/
  function handleFrameMousedown (event) {
    // on mouse button and no supression key
    if (event.isTrusted && isCertainButton(event.buttons, mouseButton) && (!suppressionKey || !event[suppressionKey])) {
      browser.runtime.sendMessage({
        subject: "gestureFrameMousedown",
        data: Object.assign(
          getTargetData(event.target),
          {
            x: event.screenX,
            y: event.screenY,
          }
        )
      });
      // save target to global variable if exisiting
      if (typeof TARGET !== 'undefined') TARGET = event.target;
      // prevent middle click scroll
	    if (mouseButton === 4) event.preventDefault();
    }
  }


  /**
   * Handles mousemove for frames; send message with points
   **/
  function handleFrameMousemove (event) {
    // on mouse button and no supression key
    if (event.isTrusted && isCertainButton(event.buttons, mouseButton) && (!suppressionKey || !event[suppressionKey])) {
      // fallback if getCoalescedEvents is not defined
      const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
      if (!events.length) events.push(event);
      // transform the events to an array of points
      const points = events.map((pointerEvent) => ({x: pointerEvent.screenX, y: pointerEvent.screenY}));

      browser.runtime.sendMessage({
        subject: "gestureFrameMousemove",
        data: {
          points: points
        }
      });
      // prevent text selection
      if (mouseButton === 1) window.getSelection().removeAllRanges();
    }
  }


  /**
   * Handles mouseup for frames
   **/
  function handleFrameMouseup (event) {
    // only call on left, right and middle mouse click to terminate or reset gesture
    if (event.isTrusted && isEquivalentButton(event.button, mouseButton))
      browser.runtime.sendMessage({
        subject: "gestureFrameMouseup",
        data: {
          x: event.screenX,
          y: event.screenY
        }
      });
  }

	// due to module pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return module;
})();
