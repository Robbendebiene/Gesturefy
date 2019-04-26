// offsetX/Y properties on mouse down may be zero due to https://bugzilla.mozilla.org/show_bug.cgi?id=1359440

import { getDistance, getDirection, toSingleButton } from "/core/commons.js";

// global static variables

const LEFT_MOUSE_BUTTON = 1;
const RIGHT_MOUSE_BUTTON = 2;
const MIDDLE_MOUSE_BUTTON = 4;

const PASSIVE = 0;
const PENDING = 1;
const ACTIVE = 2;
const CANCELLED = 3;


/**
 * MouseGestureController "singleton"
 * provides 5 events: on start, update, change, abort and end
 * events can be added via addEventListener and removed via removeEventListener
 * on default the controller is disabled and must be enabled via enable()
 * cancel() can be called to abort the controller
 **/


// public methods and variables


export default {
  enable: enable,
  disable: disable,
  cancel: cancel,
  addEventListener: addEventListener,
  hasEventListener: hasEventListener,
  removeEventListener: removeEventListener,

  get targetElement () {
    return targetElement;
  },
  set targetElement (value) {
    targetElement = value;
  },

  get mouseButton () {
    return mouseButton;
  },
  set mouseButton (value) {
    mouseButton = Number(value);
  },

  get suppressionKey () {
    return suppressionKey;
  },
  set suppressionKey (value) {
    suppressionKey = value;
  },

  get distanceThreshold () {
    return distanceThreshold;
  },
  set distanceThreshold (value) {
    distanceThreshold = Number(value);
  },

  get distanceSensitivity () {
    return distanceSensitivity;
  },
  set distanceSensitivity (value) {
    distanceSensitivity = Number(value);
  },

  get timeoutActive () {
    return timeoutActive;
  },
  set timeoutActive (value) {
    timeoutActive = Boolean(value);
  },

  get timeoutDuration () {
    // convert milliseconds back to seconds
    return timeoutDuration / 1000;
  },
  set timeoutDuration (value) {
    // convert seconds to milliseconds
    timeoutDuration = Number(value) * 1000;
  },
};


/**
 * Add callbacks to the given events
 **/
function addEventListener (event, callback) {
  // if event exists add listener (duplicates won't be added)
  if (event in events) events[event].add(callback);
};


/**
 * Check if an event listener is registered
 **/
function hasEventListener (event, callback) {
  // if event exists check for listener
  if (event in events) events[event].has(callback);
};


/**
 * Remove callbacks from the given events
 **/
function removeEventListener (event, callback) {
  // if event exists remove listener
  if (event in events) events[event].delete(callback);
};


/**
 * Add the event listeners to detect a gesture start
 **/
function enable () {
  targetElement.addEventListener('pointerdown', handleMousedown, true);

  ////////////////// IFRAME WORKAROUND START \\\\\\\\\\\\\\\\\\\\\\
  browser.runtime.onMessage.addListener(handleMessage);
  ////////////////// IFRAME WORKAROUND END \\\\\\\\\\\\\\\\\\\\\\
};


/**
 * Remove the event listeners and resets the controller
 **/
function disable () {
  targetElement.removeEventListener('pointerdown', handleMousedown, true);

  ////////////////// IFRAME WORKAROUND START \\\\\\\\\\\\\\\\\\\\\\
  browser.runtime.onMessage.removeListener(handleMessage);
  ////////////////// IFRAME WORKAROUND END \\\\\\\\\\\\\\\\\\\\\\

  // reset to initial state
  reset();
}


/**
 * Cancel the gesture controller and dispatch abort callbacks
 **/
function cancel () {
  if (state !== CANCELLED) {
    // dispatch all binded functions on abort and pass an array of the buffered mouse events and an array of direction codes
    events['abort'].forEach((callback) => callback(mouseEventBuffer.slice(0), directions.slice(0)));
    // cancel or reset the controller
    if (state === ACTIVE) state = CANCELLED;
    else if (state === PENDING) reset();
  }
};


// private variables and methods


// contains all gesture direction letters
const directions = [];

// internal states are PASSIVE, PENDING, ACTIVE, CANCELLED
let state = PASSIVE;

// holds the last point
const referencePoint = {
  x: 0,
  y: 0
};

// contains the timeout identifier
let timeoutId = null;

// holds all custom module event callbacks
const events = {
  'start': new Set(),
  'update': new Set(),
  'change': new Set(),
  'abort': new Set(),
  'end': new Set()
};

// temporary buffer for occurred mouse events where the latest event is always at the end of the array
const mouseEventBuffer = [];

let targetElement = window,
    mouseButton = RIGHT_MOUSE_BUTTON,
    suppressionKey = "",
    distanceThreshold = 10,
    distanceSensitivity = 10,
    timeoutActive = false,
    timeoutDuration = 1000;

/**
 * initializes the gesture to the "pending" state, where it's unclear if the user is starting a gesture or not
 * requires the current x and y coordinates
 **/
function init (x, y) {
  // set the initial point
  referencePoint.x = x;
  referencePoint.y = y;

  // change internal state
  state = PENDING;

  // add gesture detection listeners
  targetElement.addEventListener('pointermove', handleMousemove, true);
  targetElement.addEventListener('dragstart', handleDragstart, true);
  targetElement.addEventListener('contextmenu', handleContextmenu, true);
  targetElement.addEventListener('pointerup', handleMouseup, true);
  targetElement.addEventListener('pointerout', handleMouseout, true);
}


/**
 * Indicates the gesture start and should only be called once untill gesture end
 **/
function start () {
  // dispatch all binded functions on start and pass an array of buffered mouse events
  events['start'].forEach((callback) => callback(mouseEventBuffer.slice(0)));

  // change internal state
  state = ACTIVE;

  // clear buffer
  mouseEventBuffer.length = 0;
}


/**
 * Indicates the gesture update + change and should be called every time the cursor position changes
 * requires the current x and y coordinates
 **/
function update (x, y) {
  // dispatch all binded functions on update and pass an array of buffered mouse events
  events['update'].forEach((callback) => callback(mouseEventBuffer.slice(0)));

  // handle timeout
  if (timeoutActive) {
    // clear previous timeout if existing
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      // dispatch all binded functions on timeout and pass an array of buffered mouse events
      events['abort'].forEach((callback) => callback(mouseEventBuffer.slice(0)));
      state = CANCELLED;
    }, timeoutDuration);
  }

  // calculate and get the direction code
  const direction = getDirection(referencePoint.x, referencePoint.y, x, y);
  // if the direction differs from the previous direction
  if (directions[directions.length - 1] !== direction) {
    // add new direction to gesture list
    directions.push(direction);
    // dispatch all binded functions on change and pass an array of the buffered mouse events and an array of direction codes
    events['change'].forEach((callback) => callback(mouseEventBuffer.slice(0), directions.slice(0)));
  }

  // set new reference point
  referencePoint.x = x;
  referencePoint.y = y;

  // clear buffer
  mouseEventBuffer.length = 0;
}


/**
 * Indicates the gesture end and should be called to terminate the gesture
 **/
function end () {
  // dispatch all binded functions on end and pass an array of the buffered mouse events and an array of direction codes
  events['end'].forEach((callback) => callback(mouseEventBuffer.slice(0), directions.slice(0)));
  // reset gesture handler
  reset();
}


/**
 * Resets the controller to its initial state
 **/
function reset () {
  // remove gesture detection listeners
  targetElement.removeEventListener('pointermove', handleMousemove, true);
  targetElement.removeEventListener('pointerup', handleMouseup, true);
  targetElement.removeEventListener('contextmenu', handleContextmenu, true);
  targetElement.removeEventListener('pointerout', handleMouseout, true);
  targetElement.removeEventListener('dragstart', handleDragstart, true);

  // reset gesture array, internal state and target data
  directions.length = 0;
  mouseEventBuffer.length = 0;
  state = PASSIVE;

  if (timeoutId) {
    window.clearTimeout(timeoutId);
    timeoutId = null;
  }
}


/**
 * Handles mousedown which will initialize the gesture and switch to the pedning state
 **/
function handleMousedown (event) {
  // on mouse button and no supression key
  if (event.isTrusted && event.buttons === mouseButton && (!suppressionKey || !event[suppressionKey])) {
    // buffer mouse event
    mouseEventBuffer.push(event);

    // init gesture
    init(event.screenX, event.screenY);

    // prevent middle click scroll
    if (mouseButton === MIDDLE_MOUSE_BUTTON) event.preventDefault();
  }
}


/**
 * Handles mousemove which will either start the gesture or update it
 **/
function handleMousemove (event) {
  // fallback if getCoalescedEvents is not defined + https://bugzilla.mozilla.org/show_bug.cgi?id=1450692
  const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
  if (!events.length) events.push(event);

  if (event.isTrusted && event.buttons === mouseButton) {
    // buffer mouse events
    mouseEventBuffer.push(...events);

    // calculate distance between the current point and the reference point
    const distance = getDistance(referencePoint.x, referencePoint.y, event.screenX, event.screenY);

    // induce gesture
    if (state === PENDING && distance > distanceThreshold)
      start();

    // update gesture
    else if (state === ACTIVE && distance > distanceSensitivity)
      update(event.screenX, event.screenY);

    // prevent text selection
    if (mouseButton === LEFT_MOUSE_BUTTON) window.getSelection().removeAllRanges();
  }
}


/**
 * Handles context menu popup for the right mouse button and terminates the gesture
 **/
function handleContextmenu (event) {
  if (event.isTrusted && mouseButton === RIGHT_MOUSE_BUTTON) {
    // buffer mouse event
    mouseEventBuffer.push(event);

    if (state === ACTIVE || state === CANCELLED) {
      // prevent context menu
      event.preventDefault();
      end();
    }
    // reset if state is pending
    else if (state === PENDING)
      reset();
  }
}


/**
 * Handles mouseup for middle and left mouse button and terminates the gesture
 **/
function handleMouseup (event) {
  // only call on left and middle mouse click to terminate gesture
  if (event.isTrusted && event.button === toSingleButton(mouseButton) && (mouseButton === LEFT_MOUSE_BUTTON || mouseButton === MIDDLE_MOUSE_BUTTON)) {
    // buffer mouse event
    mouseEventBuffer.push(event);

    if (state === ACTIVE || state === CANCELLED)
      end();
    // reset if state is pending
    else if (state === PENDING)
      reset();
  }
}


/**
 * Handles mouse out and terminates the gesture
 **/
function handleMouseout (event) {
  // only call if cursor left the browser window
  if (event.isTrusted && event.relatedTarget === null) {
    // buffer mouse event
    mouseEventBuffer.push(event);

    if (state === ACTIVE || state === CANCELLED)
      end();
    // reset if state is pending
    else if (state === PENDING)
      reset();
  }
}


/**
 * Handles dragstart and prevents it if needed
 **/
function handleDragstart (event) {
  // prevent drag if mouse button and no supression key is pressed
  if (event.isTrusted && event.buttons === mouseButton && (!suppressionKey || !event[suppressionKey]))
    event.preventDefault();
}


////////////////// IFRAME WORKAROUND START \\\\\\\\\\\\\\\\\\\\\\

/**
 * Handles iframe/background messages which will update the gesture
 **/
function handleMessage (message, sender, sendResponse) {
  switch (message.subject) {
    case "gestureFrameMousedown":
      // buffer fake mouse event from iframe
      mouseEventBuffer.push(new PointerEvent('pointerdown', {
        'screenX': message.data.x,
        'screenY': message.data.y,
        'buttons': mouseButton
      }));
      // init gesture
      init(message.data.x, message.data.y);
    break;

    case "gestureFrameMousemove":
      // buffer fake mouse events from iframe
      mouseEventBuffer.push(...message.data.points.map(point => new PointerEvent('pointermove', {
        'screenX': point.x,
        'screenY': point.y,
        'buttons': mouseButton
      })));

      const lastPoint = message.data.points[message.data.points.length - 1];
      // calculate distance between the last point and the reference point
      const distance = getDistance(referencePoint.x, referencePoint.y, lastPoint.x, lastPoint.y);
      // induce gesture
      if (state === PENDING && distance > distanceThreshold)
        start();
      // update gesture && mousebutton fix: right click on frames is sometimes captured by both event listeners which leads to problems
      else if (state === ACTIVE && distance > distanceSensitivity && mouseButton !== RIGHT_MOUSE_BUTTON)
        update(lastPoint.x, lastPoint.y);
    break;

    case "gestureFrameMouseup":
      // buffer fake mouse event from iframe
      mouseEventBuffer.push(new PointerEvent('pointerup', {
        'screenX': message.data.x,
        'screenY': message.data.y,
        'buttons': mouseButton
      }));

      if (state === ACTIVE || state === CANCELLED)
        end(message.data.x, message.data.y);
      else if (state === PENDING) reset();
    break;
  }
}

////////////////// IFRAME WORKAROUND END \\\\\\\\\\\\\\\\\\\\\\