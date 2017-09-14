'use strict'

/**
 * GestureHandler "singleton" class using the modul pattern
 * the handler behaves different depending on whether it's injected in a frame or not
 * frame: detects gesture start, move, end and sends an indication message
 * main page: detects whole gesture including frame indication messages and reports it to the background script
 * provides 4 events: on start, update, change and end
 * on default the handler is disabled and must be enabled via enable()
 * REQUIRES: contentCommons.js
 **/
const GestureHandler = (function() {

// public variables and methods

  let modul = {};

	/**
	 * Add callbacks to the given events
	 **/
  modul.on = function on (event, callback) {
    // if event does not exist or function already applied skip it
		if (event in events && !events[event].includes(callback))
      events[event].push(callback);
		return this;
  };


  /**
   * applies necessary settings
   **/
  modul.applySettings = function applySettings (Settings) {
    mouseButton = Number(Settings.Gesture.mouseButton);
    distanceSensitivity = Settings.Gesture.distanceSensitivity;
    distanceThreshold = Settings.Gesture.distanceThreshold;
  }


	/**
	 * Add the event listeners
	 **/
  modul.enable = function enable () {
		if (inIframe()) {
      document.addEventListener('mousedown', handleFrameMousedown, true);
      document.addEventListener('mousemove', handleFrameMousemove, true);
      document.addEventListener('mouseup', handleFrameMouseup, true);
      document.addEventListener('dragstart', handleDragstart, true);
    }
    else {
      chrome.runtime.onMessage.addListener(handleMessage);
      document.addEventListener('mousedown', handleMousedown, true);
    }
  };


	/**
	 * Remove the event listeners and resets the handler
	 **/
	modul.disable = function disable () {
    if (inIframe()) {
      document.removeEventListener('mousedown', handleFrameMousedown, true);
      document.removeEventListener('mousemove', handleFrameMousemove, true);
      document.removeEventListener('mouseup', handleFrameMouseup, true);
      document.removeEventListener('dragstart', handleDragstart, true);
    }
    else {
  		chrome.runtime.onMessage.removeListener(handleMessage);
  		document.removeEventListener('mousedown', handleMousedown, true);
  		document.removeEventListener('mousemove', handleMousemove, true);
  		document.removeEventListener('contextmenu', handleContextmenu, true);
  		document.removeEventListener('mouseout', handleMouseout, true);
      document.removeEventListener('dragstart', handleDragstart, true);
      // reset gesture array, internal state and target data
  		directions = [];
  		started = false;
      targetData = {};
    }
  }

// private variables and methods

  // setting properties
  let mouseButton = 2,
      distanceThreshold = 10,
      distanceSensitivity = 10;

	// contains all gesture direction letters
	let directions = [];

	// internal status
	let started = false;

	// holds reference point to current point
	let referencePoint = {
		x: 0,
		y: 0
	};

  // contains relevant data of the target element
  let targetData = {};

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
  function start () {
		// dispatch all binded functions with the current x and y coordinates as parameter on start
		events['start'].forEach((callback) => callback(referencePoint.x, referencePoint.y));

		// change internal state
		started = true;
	}


	/**
	 * Indicates the gesture change and should be called every time the cursor position changes
	 * requires at least an object width clientX and clientY or any cursor event object
	 **/
	function update (x, y) {
		// dispatch all binded functions with the current x and y coordinates as parameter on update
		events['update'].forEach((callback) => callback(x, y));

		let direction = getDirection(referencePoint.x, referencePoint.y, x, y);

		if (directions[directions.length - 1] !== direction) {
			// add new direction to gesture list
			directions.push(direction);

      // send message to background on gesture change
      let message = browser.runtime.sendMessage({
        subject: "gestureChange",
        data: {
          gesture: directions.join("")
        }
      });
      // on response (also fires on no response) dispatch all binded functions with the directions array and the action as parameter
      message.then((response) => {
        let action = "";
        if (response) action = response.action;
        events['change'].forEach((callback) => callback(directions, action));
      });
		}

		// set new reference point
		referencePoint.x = x;
		referencePoint.y = y;
	}


	/**
	 * Indicates the gesture end and should be called to reset the gesture
	 **/
	function end () {
		// dispatch all binded functions on end
		events['end'].forEach((callback) => callback(directions));

    // send directions and target data to background
    if (directions.length > 0) browser.runtime.sendMessage({
      subject: "gestureEnd",
      data: Object.assign(
        targetData,
        {gesture: directions.join("")}
      )
    });

		// reset gesture array, internal state and target data
		directions = [];
		started = false;
    targetData = {};
	}


	/**
	 * Handles iframe/background messages which will update the gesture
	 **/
	function handleMessage (message, sender, sendResponse) {

    switch (message.subject) {
      case "gestureFrameMousedown":
        referencePoint.x = Math.round(message.data.screenX / window.devicePixelRatio - window.mozInnerScreenX);
        referencePoint.y = Math.round(message.data.screenY / window.devicePixelRatio - window.mozInnerScreenY);
        // get and save target data
        targetData = message.data;

        document.addEventListener('mousemove', handleMousemove, true);
      break;

      case "gestureFrameMousemove":
        // calculate distance between the current point and the reference point
        let distance = getDistance(referencePoint.x, referencePoint.y,
          Math.round(message.data.screenX / window.devicePixelRatio - window.mozInnerScreenX),
          Math.round(message.data.screenY / window.devicePixelRatio - window.mozInnerScreenY)
        );
        // induce gesture
        if (!started && distance > distanceThreshold) {
          document.addEventListener('contextmenu', handleContextmenu, true);
          document.addEventListener('mouseup', handleMouseup, true);
          document.addEventListener('mouseout', handleMouseout, true);
          start();
        }
        // update gesture
        else if (started && distance > distanceSensitivity) update(
          Math.round(message.data.screenX / window.devicePixelRatio - window.mozInnerScreenX),
          Math.round(message.data.screenY / window.devicePixelRatio - window.mozInnerScreenY)
        );
      break;

      case "gestureFrameMouseup":
        if (started) {
          document.removeEventListener('mousemove', handleMousemove, true);
          document.removeEventListener('contextmenu', handleContextmenu, true);
          document.removeEventListener('mouseup', handleMouseup, true);
          document.removeEventListener('mouseout', handleMouseout, true);
          end();
        }
      break;
    }
	}


	/**
	 * Handles mousedown which will add the mousemove listener
	 **/
	function handleMousedown (event) {
		if (event.isTrusted && event.buttons === mouseButton) {
      // set the current point to the reference point
      referencePoint.x = event.clientX;
      referencePoint.y = event.clientY;

      // save target to global variable if exisiting
      if (typeof TARGET !== 'undefined') TARGET = event.target;

      // get and save target data
      targetData.href = getLinkHref(event.target);
      targetData.src = getImageSrc(event.target);
      targetData.selection = getTextSelection();

			document.addEventListener('mousemove', handleMousemove, true);
      document.addEventListener('dragstart', handleDragstart, true);
			// prevent and middle click scroll
			if (mouseButton === 4) event.preventDefault();
		}
	}






	/**
	 * Handles mousemove which will either start the gesture or update it
	 **/
	function handleMousemove (event) {
		if (event.isTrusted && event.buttons === mouseButton) {
      // calculate distance between the current point and the reference point
      let distance = getDistance(referencePoint.x, referencePoint.y, event.clientX, event.clientY);

      // induce gesture
			if (!started && distance > distanceThreshold) {
				document.addEventListener('contextmenu', handleContextmenu, true);
				document.addEventListener('mouseup', handleMouseup, true);
				document.addEventListener('mouseout', handleMouseout, true);
				start();
			}

      // update gesture
			else if (started && distance > distanceSensitivity) {
        update(event.clientX, event.clientY);
			}
      // prevent text selection
      if (mouseButton === 1) window.getSelection().removeAllRanges();
		}
	}


	/**
	 * Handles context menu popup and removes all added listeners
	 **/
	function handleContextmenu (event) {
    // only call on right mouse click to terminate gesture and prevent context menu
		if (event.isTrusted && started && mouseButton === 2) {
			document.removeEventListener('mousemove', handleMousemove, true);
			document.removeEventListener('contextmenu', handleContextmenu, true);
			document.removeEventListener('mouseup', handleMouseup, true);
			document.removeEventListener('mouseout', handleMouseout, true);
      document.removeEventListener('dragstart', handleDragstart, true);
			event.preventDefault();
			end();
		}
	}


	/**
	 * Handles mouseup and removes all added listeners
	 **/
  function handleMouseup (event) {
    // only call on left and middle mouse click to terminate gesture
		if (event.isTrusted && started && ((event.button === 0 && mouseButton === 1) || (event.button === 1 && mouseButton === 4))) {
			document.removeEventListener('mousemove', handleMousemove, true);
			document.removeEventListener('contextmenu', handleContextmenu, true);
			document.removeEventListener('mouseup', handleMouseup, true);
			document.removeEventListener('mouseout', handleMouseout, true);
      document.removeEventListener('dragstart', handleDragstart, true);
			event.preventDefault();
			end();
		}
	}


	/**
	 * Handles mouse out and removes all added listeners
	 **/
	function handleMouseout (event) {
		if (event.isTrusted && started && event.relatedTarget === null) {
			document.removeEventListener("mousemove", handleMousemove, true);
			document.removeEventListener("mouseout", handleMouseout, true);
			document.removeEventListener('mouseup', handleMouseup, true);
			document.removeEventListener('contextmenu', handleContextmenu, true);
      document.removeEventListener('dragstart', handleDragstart, true);
			end();
		}
	}


  /**
   * Handles mousedown for frames; send message with target data and position
   **/
  function handleFrameMousedown (event) {
    if (event.isTrusted && event.buttons === mouseButton) {
      browser.runtime.sendMessage({
        subject: "gestureFrameMousedown",
        data: {
          screenX: event.screenX,
          screenY: event.screenY,
          href: getLinkHref(event.target),
          src: getImageSrc(event.target),
          selection: getTextSelection()
        }
      });

      // save target to global variable if exisiting
      if (typeof TARGET !== 'undefined') TARGET = event.target;
      // prevent middle click scroll
	    if (mouseButton === 4) event.preventDefault();
    }
  }


  /**
   * Handles dragstart and prevents it if needed
   **/
  function handleDragstart (event) {
    if (event.isTrusted && event.buttons === mouseButton)
      event.preventDefault();
  }


  /**
   * Handles mousemove for frames; send message with position
   **/
  function handleFrameMousemove (event) {
    if (event.isTrusted && event.buttons === mouseButton) {
      browser.runtime.sendMessage({
        subject: "gestureFrameMousemove",
        data: {
          screenX: event.screenX,
          screenY: event.screenY
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
    // only call on left and middle mouse click to terminate gesture
    if (event.isTrusted && ((event.button === 0 && mouseButton === 1) || (event.button === 1 && mouseButton === 4))) browser.runtime.sendMessage({
      subject: "gestureFrameMouseup",
      data: {}
    });
  }

	// due to modul pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return modul;
})();
