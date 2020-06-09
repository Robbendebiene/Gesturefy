import { toSingleButton, getDistance } from "/core/commons.js";

// global static variables

const LEFT_MOUSE_BUTTON = 1;
const RIGHT_MOUSE_BUTTON = 2;
const MIDDLE_MOUSE_BUTTON = 4;

const PASSIVE = 0;
const PENDING = 1;
const ACTIVE = 2;
const ABORTED = 3;


/**
 * MouseGestureController "singleton"
 * provides 4 events: on start, update, abort and end
 * events can be added via addEventListener and removed via removeEventListener
 * on default the controller is disabled and must be enabled via enable()
 * cancel() can be called to abort/reset the controller
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
};


/**
 * Remove the event listeners and resets the controller
 **/
function disable () {
  targetElement.removeEventListener('pointerdown', handleMousedown, true);

  // reset to initial state
  reset();
}


/**
 * Cancel the gesture controller and reset its state
 **/
function cancel () {
  // reset to initial state
  reset();
};


// private variables and methods


// internal states are PASSIVE, PENDING, ACTIVE, ABORTED
let state = PASSIVE;

// contains the timeout identifier
let timeoutId = null;

// contains the pointer identifier
let pointerId = null;

// holds all custom module event callbacks
const events = {
  'start': new Set(),
  'update': new Set(),
  'abort': new Set(),
  'end': new Set()
};

// temporary buffer for occurred mouse events where the latest event is always at the end of the array
let mouseEventBuffer = [];

let targetElement = window,
    mouseButton = RIGHT_MOUSE_BUTTON,
    suppressionKey = "",
    distanceThreshold = 10,
    timeoutActive = false,
    timeoutDuration = 1000;

/**
 * Initializes the gesture controller to the "pending" state, where it's unclear if the user is starting a gesture or not
 * requires a mouse/pointer event
 **/
function initialize (event) {
  // buffer initial mouse event
  mouseEventBuffer.push(event);

  // change internal state
  state = PENDING;

  // store pointer id
  pointerId = event.pointerId;

  // add gesture detection listeners
  targetElement.addEventListener('pointermove', handleMousemove, true);
  targetElement.addEventListener('dragstart', handleDragstart, true);
  targetElement.addEventListener('keydown', handleKeydown, true);
  targetElement.addEventListener('pointerup', handleMouseup, true);
  targetElement.addEventListener('visibilitychange', handleVisibilitychange, true);

  // workaround to redirect all events to this frame
  document.documentElement.setPointerCapture(pointerId);
}


/**
 * Indicates the gesture start and update and should be called every time the cursor position changes
 * start - will be called once after the distance threshold has been exceeded
 * update - will be called afterwards for every pointer move
 * requires a mouse/pointer event
 **/
function update (event) {
  // buffer mouse event
  mouseEventBuffer.push(event);

  // needs to be called to prevent the values of the coalesced events from getting cleared (probably a Firefox bug)
  event.getCoalescedEvents();

  // initiate gesture
  if (state === PENDING) {
    // get the initital and latest event
    const initialEvent = mouseEventBuffer[0];
    const latestEvent = mouseEventBuffer[mouseEventBuffer.length - 1];
    // check if the distance between the initital pointer and the latest pointer is greater than the threshold
    if (getDistance(initialEvent.clientX, initialEvent.clientY, latestEvent.clientX, latestEvent.clientY) > distanceThreshold) {
      // dispatch all binded functions on start and pass the initial event and an array of the buffered mouse events
      events['start'].forEach(callback => callback(initialEvent, mouseEventBuffer));
  
      // change internal state
      state = ACTIVE;

      preparePreventDefault();
    }
  }

  // update gesture
  else if (state === ACTIVE) {
    // dispatch all binded functions on update and pass the latest event and an array of the buffered mouse events
    events['update'].forEach(callback => callback(event, mouseEventBuffer));

    // handle timeout
    if (timeoutActive) {
      // clear previous timeout if existing
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(abort, timeoutDuration);
    }
  }
}


/**
 * Indicates the gesture abortion and sets the state to aborted
 **/
function abort () {
  // dispatch all binded functions on timeout and pass an array of buffered mouse events
  events['abort'].forEach(callback => callback(mouseEventBuffer));
  state = ABORTED;
}


/**
 * Indicates the gesture end and should be called to terminate the gesture
 * requires a mouse/pointer event
 **/
function terminate (event) {
  // buffer mouse event
  mouseEventBuffer.push(event);

  if (state === ACTIVE) {
    // dispatch all binded functions on end and pass the latest event and an array of the buffered mouse events
    events['end'].forEach(callback => callback(event, mouseEventBuffer));
  }

  // reset gesture controller
  reset();
}


/**
 * Resets the controller to its initial state
 **/
function reset () {
  // remove gesture detection listeners
  targetElement.removeEventListener('pointermove', handleMousemove, true);
  targetElement.removeEventListener('pointerup', handleMouseup, true);
  targetElement.removeEventListener('keydown', handleKeydown, true);
  targetElement.removeEventListener('dragstart', handleDragstart, true);
  targetElement.removeEventListener('visibilitychange', handleVisibilitychange, true);

  neglectPreventDefault();

  // reset mouse event buffer and internal state
  mouseEventBuffer = [];
  state = PASSIVE;

  // release event redirect
  if (pointerId !== null) {
    document.documentElement.releasePointerCapture(pointerId);
    pointerId = null;
  }

  if (timeoutId !== null) {
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
    initialize(event);

    // prevent middle click scroll
    if (mouseButton === MIDDLE_MOUSE_BUTTON) event.preventDefault();
  }
}


/**
 * Handles mousemove which will either start the gesture or update it
 **/
function handleMousemove (event) {
  if (event.isTrusted && event.buttons === mouseButton) {
    update(event);

    // prevent text selection
    if (mouseButton === LEFT_MOUSE_BUTTON) window.getSelection().removeAllRanges();
  }
}


/**
 * Handles mouseup and terminates the gesture
 **/
function handleMouseup (event) {
  if (event.isTrusted && event.button === toSingleButton(mouseButton)) {
    terminate(event);
  }
}


/**
 * Handles keydown and aborts the controller if the suppression key is pressed
 **/
function handleKeydown (event) {
  // do not use the event.shiftKey, altKey and ctrlKey properties since they are unreliable on windows
  // instead map the suppression key names to the event key names
  const pressedKey = {
    "Shift" : "shiftKey",
    "Control": "ctrlKey",
    "Alt": "altKey"
  }[event.key];

  // if suppression key is defined and pressed
  // filter repeatedly fired events if the key is held down
  if (event.isTrusted && !event.repeat && suppressionKey && pressedKey === suppressionKey) {
    abort();
    event.preventDefault();
  }
}


/**
 * Handles dragstart and prevents it if needed
 **/
function handleDragstart (event) {
  // prevent drag if mouse button and no supression key is pressed
  if (event.isTrusted && event.buttons === mouseButton && (!suppressionKey || !event[suppressionKey])) {
    event.preventDefault();
  }
}


/**
 * This is only needed for tab changing actions
 **/
function handleVisibilitychange() {
  // call abort to trigger attached events
  abort();
  // reset to initial state
  reset();
}


//////// WORKAROUND TO PROPERLY SUPPRESS CONTEXTMENU AND CLICK \\\\\\\\


const TIME_TO_WAIT_FOR_PREVENTION = 150;

let pendingPreventionTimeout = null;

let isTargetFrame = false;

browser.runtime.onMessage.addListener((message, sender) => {
  // filter messages if the mouse gesture controller runs in the options page (which is a background page)
  if (!sender.tab) {
    switch (message.subject) {
      case "mouseGestureControllerPreparePreventDefault":
        if (!isTargetFrame) enablePreventDefault();
      break;

      case "mouseGestureControllerNeglectPreventDefault":
        if (!isTargetFrame) {
          const elapsedTime = Date.now() - message.data.timestamp;
          // take elapsed time into account to ensure that the prevention is removed at the same time across frames
          pendingPreventionTimeout = window.setTimeout(disablePreventDefault, Math.max(TIME_TO_WAIT_FOR_PREVENTION - elapsedTime, 0));
        }
      break;
    }
  }
});


/**
 * Enables the prevention functions in every frame
 **/
function preparePreventDefault () {
  isTargetFrame = true;

  browser.runtime.sendMessage({
    subject: "mouseGestureControllerPreparePreventDefault"
  });

  enablePreventDefault();
}


/**
 * Disables the prevention functions in every frame after a short amount of time to give them time to prevent something if needed
 **/
function neglectPreventDefault () {
  isTargetFrame = true;

  browser.runtime.sendMessage({
    subject: "mouseGestureControllerNeglectPreventDefault",
    data: {
      timestamp: Date.now()
    }
  });

  // need to wait a specifc time before we can be sure that nothing needs to be prevented
  pendingPreventionTimeout = window.setTimeout(disablePreventDefault, TIME_TO_WAIT_FOR_PREVENTION);
}


/**
 * Adds all event listeners that handle the prevention
 * Clears any existing prevention timeout, in case a new gesture was started but the previous prevention timeout is still running
 **/
function enablePreventDefault () {
  if (pendingPreventionTimeout !== null) {
    window.clearTimeout(pendingPreventionTimeout);
    pendingPreventionTimeout = null;
  }

  targetElement.addEventListener('contextmenu', handleContextmenu, true);
  targetElement.addEventListener('click', handleClick, true);
}


/**
 * Removed all event listeners that handle the prevention and resets necessary variables
 **/
function disablePreventDefault () {
  pendingPreventionTimeout = null;

  isTargetFrame = false;

  targetElement.removeEventListener('contextmenu', handleContextmenu, true);
  targetElement.removeEventListener('click', handleClick, true);
}


/**
 * Prevent the context menu for right mouse button
 **/
function handleContextmenu (event) {
  if (event.isTrusted && event.button === toSingleButton(mouseButton) && mouseButton === RIGHT_MOUSE_BUTTON) {
    // prevent contextmenu and event propagation
    event.stopPropagation();
    event.preventDefault();
  }
}


/**
 * Prevent the left click for left mouse button
 **/
function handleClick (event) {
  if (event.isTrusted && event.button === toSingleButton(mouseButton) && mouseButton === LEFT_MOUSE_BUTTON || mouseButton === MIDDLE_MOUSE_BUTTON) {
    // prevent click and event propagation
    event.stopPropagation();
    event.preventDefault();
  }
}