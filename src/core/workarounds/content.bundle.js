'use strict';

/**
 * get JSON file as object from url
 * returns a promise which is fulfilled with the json object as a parameter
 * otherwise it's rejected
 * request url needs permissions in the addon manifest
 **/


/**
 * check if variable is an object
 * from https://stackoverflow.com/a/37164538/3771196
 **/
function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}


/**
 * clone a serializeable javascript object
 **/
function cloneObject (obj) {
  return JSON.parse(JSON.stringify(obj));
}



/**
 * converts a rgb color to an hex color string
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 **/
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


/**
 * converts a hex color either with hash or not to an rgb color array
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 **/
function hexToRGB(hex) {
  if (hex[0] === "#") hex = hex.slice(1);
  const bigint = parseInt(hex, 16);
  return [ (bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255 ];
}


/**
 * calculates and returns the distance
 * between to points
 **/
function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}


/**
 * translates the given vector to a direction letter
 * possible letter types are U,R,D and L
 **/
function getDirection(x1, y1, x2, y2) {
  if (Math.abs(y2 - y1) >= Math.abs(x2 - x1)) {
    return y1 >= y2 ? 'U' : 'D';
  }
  else {
    return x2 >= x1 ? 'R' : 'L';
  }
}


/**
 * converts a pressed button value to its trigger button equivalent
 * returns -1 if the value cannot be converted
 **/
function toSingleButton (pressedButton) {
  if (pressedButton === 1) return 0;
  else if (pressedButton === 2) return 2;
  else if (pressedButton === 4) return 1;
  else return -1;
}


/**
 * returns the selected text, if no text is selected it will return an empty string
 * inspired by https://stackoverflow.com/a/5379408/3771196
 **/
function getTextSelection () {
  // get input/textfield text selection
  if (document.activeElement &&
      typeof document.activeElement.selectionStart === 'number' &&
      typeof document.activeElement.selectionEnd === 'number') {
        return document.activeElement.value.slice(
          document.activeElement.selectionStart,
          document.activeElement.selectionEnd
        );
  }
  // get normal text selection
  return window.getSelection().toString();
}


/**
 * returns the closest html parent element that matches the conditions of the provided test function or null
 **/
function getClosestElement (startNode, testFunction) {
  let node = startNode;
	while (node !== null && !testFunction(node)) {
    node = node.parentElement;
  }
	return node;
}


/**
 * returns all available data of the given target
 * this data is necessary for some commands
 **/
function getTargetData (target) {
	const data = {};

	data.target = {
		src: target.currentSrc || target.src || null,
		title: target.title || null,
		alt: target.alt || null,
		textContent: target.textContent.trim(),
		nodeName: target.nodeName
	};

  // get closest link
  const link = getClosestElement(target, node => node.nodeName.toLowerCase() === "a" || node.nodeName.toLowerCase() === "area");
	if (link) {
		data.link = {
			href: link.href || null,
			title: link.title || null,
			textContent: link.textContent.trim()
		};
	}

	data.textSelection = getTextSelection();

	return data;
}


/**
 * smooth scroll to a specific y position by a given duration
 **/
function scrollToY (element, y, duration) {
	// if y coordinate is not reachable round it down/up
	y = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, y));
	let cosParameter = (element.scrollTop - y) / 2,
			scrollCount = 0,
			oldTimestamp = performance.now();
	function step (newTimestamp) {
		// abs() because sometimes the difference is negative; if duration is 0 scrollCount will be Infinity
		scrollCount += Math.PI * Math.abs(newTimestamp - oldTimestamp) / duration;
		if (scrollCount >= Math.PI || element.scrollTop === y) return element.scrollTop = y;
		element.scrollTop = cosParameter + y + cosParameter * Math.cos(scrollCount);
		oldTimestamp = newTimestamp;
		window.requestAnimationFrame(step);
	}
	window.requestAnimationFrame(step);
}


/**
 * checks if the current window is framed or not
 **/
function isIframe () {
  try {
    return window.self !== window.top;
  }
  catch (e) {
    return true;
  }
}


/**
 * checks if an element has a vertical scrollbar
 **/
function isScrollableY (element) {
	const style = window.getComputedStyle(element);
	return !!(element.scrollTop || (++element.scrollTop && element.scrollTop--)) &&
				 style["overflow"] !== "hidden" && style["overflow-y"] !== "hidden";
}


/**
 * checks if the given element is a writable input element
 **/
function isEditableInput (element) {
  const editableInputTypes = ["text", "textarea", "password", "email", "number", "tel", "url", "search"];
  return (
    (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')
    && (!element.type || editableInputTypes.includes(element.type))
    && !element.disabled
    && !element.readOnly
  );
}

/**
 * This class is a wrapper of the native storage API in order to allow synchronous config calls.
 * It also allows loading an optional default configuration which serves as a fallback if the property isn't stored in the user configuration.
 * The config manager should only be used after the config has been loaded.
 * This can be checked via the Promise returned by ConfigManagerInstance.loaded property.
 **/
class ConfigManager {

  /**
   * The constructor of the class requires a storage area as a string.
   * For the first parameter either "local" or "sync" is allowed.
   * An URL to a JSON formatted file can be passed optionally. The containing properties will be treated as the defaults.
   **/
  constructor (storageArea, defaultsURL) {
    if (storageArea !== "local" && storageArea !== "sync") {
      throw "The first argument must be a storage area in form of a string containing either local or sync.";
    }
    if (typeof defaultsURL !== "string" && defaultsURL !== undefined) {
      throw "The second argument must be an URL to a JSON file.";
    }

    this._storageArea = storageArea;
    // empty object as default value so the config doesn't have to be loaded
    this._storage = {};
    this._defaults = {};

    const fetchResources = [ browser.storage[this._storageArea].get() ];
    if (typeof defaultsURL === "string") {
      const defaultsObject = new Promise((resolve, reject) => {
        fetch(defaultsURL, {mode:'same-origin'})
          .then(res => res.json())
          .then(obj => resolve(obj), err => reject(err));
       });
      fetchResources.push( defaultsObject );
    }
    // load ressources
    this._loaded = Promise.all(fetchResources);
    // store ressources when loaded
    this._loaded.then((values) => {
      if (values[0]) this._storage = values[0];
      if (values[1]) this._defaults = values[1];
    });

    // holds all custom event callbacks
    this._events = {
      'change': new Set()
    };
    // defines if the storage should be automatically loaded und updated on storage changes
    this._autoUpdate = false;
    // setup on storage change handler
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === this._storageArea) {
        // automatically update config if defined
        if (this._autoUpdate === true) {
          for (let property in changes) {
            this._storage[property] = changes[property].newValue;
          }
        }
        // execute event callbacks
        this._events["change"].forEach((callback) => callback(changes));
      }
    });
  }


  /**
   * Expose the "is loaded" Promise
   * This enables the programmer to check if the config has been loaded and run code on load
   * get, set, remove calls should generally called after the config has been loaded otherwise they'll have no effect or return undefined
   **/
  get loaded () {
    return this._loaded;
  }


  /**
   * Retuns the value of the given storage path
   * A Storage path is constructed of one or more nested JSON keys concatenated with dots or an array of nested JSON keys
   * If the storage path is left the current storage object is returned
   * If the storage path does not exist in the config or the function is called before the config has been loaded it will return undefined
   **/
  get (storagePath = []) {
    if (typeof storagePath === "string") storagePath = storagePath.split('.');
    else if (!Array.isArray(storagePath)) {
      throw "The first argument must be a storage path either in the form of an array or a string concatenated with dots.";
    }

    const pathWalker = (obj, key) => isObject(obj) ? obj[key] : undefined;
    let entry = storagePath.reduce(pathWalker, this._storage);
    // try to get the default value
    if (entry === undefined) entry = storagePath.reduce(pathWalker, this._defaults);
    if (entry !== undefined) return cloneObject(entry);

    return undefined;
  }


  /**
   * Sets the value of a given storage path and creates the JSON keys if not available
   * If only one value of type object is passed the object keys will be stored in the config and existing keys will be overwriten
   * Retuns the storage set promise which resolves when the storage has been written successfully
   **/
  set (storagePath, value) {
    if (typeof storagePath === "string") storagePath = storagePath.split('.');
    // if only one argument is given and it is an object use this as the new config and override the old one
    else if (arguments.length === 1 && isObject(arguments[0])) {
      this._storage = cloneObject(arguments[0]);
      return browser.storage[this._storageArea].set(this._storage);
    }
    else if (!Array.isArray(storagePath)) {
      throw "The first argument must be a storage path either in the form of an array or a string concatenated with dots.";
    }

    if (storagePath.length > 0) {
      let entry = this._storage;
      const lastIndex = storagePath.length - 1;

      for (let i = 0; i < lastIndex; i++) {
        const key = storagePath[i];
        if (!entry.hasOwnProperty(key) || !isObject(entry[key])) {
          entry[key] = {};
        }
        entry = entry[key];
      }
      entry[ storagePath[lastIndex] ] = cloneObject(value);
      // save to storage
      return browser.storage[this._storageArea].set(this._storage);
    }
  }


  /**
   * Removes the key and value of a given storage path
   * Default values will not be removed, so get() may still return a default value even if removed was called before
   * Retuns the storage set promise which resolves when the storage has been written successfully
   **/
  remove (storagePath) {
    if (typeof storagePath === "string") storagePath = storagePath.split('.');
    else if (!Array.isArray(storagePath)) {
      throw "The first argument must be a storage path either in the form of an array or a string concatenated with dots.";
    }

    if (storagePath.length > 0) {
      let entry = this._storage;
      const lastIndex = storagePath.length - 1;

      for (let i = 0; i < lastIndex; i++) {
        const key = storagePath[i];
        if (entry.hasOwnProperty(key) && isObject(entry[key])) {
          entry = entry[key];
        }
        else return;
      }
      delete entry[ storagePath[lastIndex] ];

      return browser.storage[this._storageArea].set(this._storage);
    }
  }


  /**
   * Clears the entire config
   * If a default config is specified this is equal to resetting the config
   * Retuns the storage clear promise which resolves when the storage has been written successfully
   **/
  clear () {
    return browser.storage[this._storageArea].clear();
  }


  /**
   * Adds an event listener
   * Requires an event specifier as a string and a callback method
   * Current events are:
   * "change" - Fires when the storage has been changed
   **/
  addEventListener (event, callback) {
    if (!this._events.hasOwnProperty(event)) {
      throw "The first argument is not a valid event.";
    }
    if (typeof callback !== "function") {
      throw "The second argument must be a function.";
    }
    this._events[event].add(callback);
  }


  /**
   * Checks if an event listener exists
   * Requires an event specifier as a string and a callback method
   **/
  hasEventListener (event, callback) {
    if (!this._events.hasOwnProperty(event)) {
      throw "The first argument is not a valid event.";
    }
    if (typeof callback !== "function") {
      throw "The second argument must be a function.";
    }
    this._events[event].has(callback);
  }


  /**
   * Removes an event listener
   * Requires an event specifier as a string and a callback method
   **/
  removeEventListener (event, callback) {
    if (!this._events.hasOwnProperty(event)) {
      throw "The first argument is not a valid event.";
    }
    if (typeof callback !== "function") {
      throw "The second argument must be a function.";
    }
    this._events[event].remove(callback);
  }


  /**
   * Setter for the autoUpdate value
   * If autoUpdate is set to true the cached config will automatically update itself on storage changes
   **/
  set autoUpdate (value) {
    this._autoUpdate = Boolean(value);
  }


  /**
   * Getter for the autoUpdate value
   * If autoUpdate is set to true the cached config will automatically update itself on storage changes
   **/
  get autoUpdate () {
    return this._autoUpdate;
  }
}

// offsetX/Y properties on mouse down may be zero due to https://bugzilla.mozilla.org/show_bug.cgi?id=1359440

// global static variables

const LEFT_MOUSE_BUTTON = 1;
const RIGHT_MOUSE_BUTTON = 2;
const MIDDLE_MOUSE_BUTTON = 4;

const PASSIVE = 0;
const PENDING = 1;
const ACTIVE = 2;
const EXPIRED = 3;


/**
 * MouseGestureController "singleton"
 * provides 5 events: on start, update, change, timeout and end
 * events can be added via addEventListener and removed via removeEventListener
 * on default the controller is disabled and must be enabled via enable()
 * cancel() can be called to abort/reset the controller
 **/


// public methods and variables


var MouseGestureController = {
  enable: enable,
  disable: disable,
  cancel: cancel,
  addEventListener: addEventListener,
  hasEventListener: hasEventListener,
  removeEventListener: removeEventListener,

  get state () {
    return state;
  },

  get STATE_PASSIVE () {
    return PASSIVE;
  },
  get STATE_PENDING () {
    return PENDING;
  },
  get STATE_ACTIVE () {
    return ACTIVE;
  },
  get STATE_EXPIRED () {
    return EXPIRED;
  },

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
}

/**
 * Check if an event listener is registered
 **/
function hasEventListener (event, callback) {
  // if event exists check for listener
  if (event in events) events[event].has(callback);
}

/**
 * Remove callbacks from the given events
 **/
function removeEventListener (event, callback) {
  // if event exists remove listener
  if (event in events) events[event].delete(callback);
}

/**
 * Add the event listeners to detect a gesture start
 **/
function enable () {
  targetElement.addEventListener('pointerdown', handleMousedown, true);

  ////////////////// IFRAME WORKAROUND START \\\\\\\\\\\\\\\\\\\\\\
  browser.runtime.onMessage.addListener(handleMessage);
  ////////////////// IFRAME WORKAROUND END \\\\\\\\\\\\\\\\\\\\\\
}

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
  // reset to initial state
  reset();
}

// private variables and methods


// contains all gesture direction letters
const directions = [];

// internal states are PASSIVE, PENDING, ACTIVE, EXPIRED
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
  'timeout': new Set(),
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
      events['timeout'].forEach((callback) => callback(mouseEventBuffer.slice(0)));
      state = EXPIRED;
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

    if (state === ACTIVE || state === EXPIRED) {
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

    if (state === ACTIVE || state === EXPIRED)
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

    if (state === ACTIVE || state === EXPIRED)
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

      if (state === ACTIVE || state === EXPIRED) {
        // buffer fake mouse event from iframe
        mouseEventBuffer.push(new PointerEvent('pointerup', {
          'screenX': message.data.x,
          'screenY': message.data.y,
          'buttons': mouseButton
        }));
        end();
      }
      else if (state === PENDING) reset();
    break;
  }
}

////////////////// IFRAME WORKAROUND END \\\\\\\\\\\\\\\\\\\\\\

const LEFT_MOUSE_BUTTON$1 = 1;
const MIDDLE_MOUSE_BUTTON$1 = 4;

/**
 * Iframe mouse gesture handler
 * Forwards the mouse event screen coordinates to the background message handler
 **/


// public methods and variables


var IframeMouseGestureController = {
  enable: enable$1,
  disable: disable$1,

  get mouseButton () {
    return mouseButton$1;
  },
  set mouseButton (value) {
    mouseButton$1 = Number(value);
  },

  get suppressionKey () {
    return suppressionKey$1;
  },
  set suppressionKey (value) {
    suppressionKey$1 = value;
  }
};


/**
 * Add the event listeners to detect a gesture start
 **/
function enable$1 () {
  window.addEventListener('pointerdown', handleFrameMousedown, true);
  window.addEventListener('pointermove', handleFrameMousemove, true);
  window.addEventListener('pointerup', handleFrameMouseup, true);
  window.addEventListener('dragstart', handleDragstart$1, true);  
}

/**
 * Remove the event listeners and resets the controller
 **/
function disable$1 () {
  window.removeEventListener('pointerdown', handleFrameMousedown, true);
  window.removeEventListener('pointermove', handleFrameMousemove, true);
  window.removeEventListener('pointerup', handleFrameMouseup, true);
  window.removeEventListener('dragstart', handleDragstart$1, true);
}


// private variables and methods


let mouseButton$1 = 2,
    suppressionKey$1 = "";


/**
* Handles mousedown for frames; send message with target data and position
**/
function handleFrameMousedown (event) {
  // on mouse button and no supression key
  if (event.isTrusted && event.buttons === mouseButton$1 && (!suppressionKey$1 || !event[suppressionKey$1])) {
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
    if (typeof window.TARGET !== 'undefined') window.TARGET = event.target;
    // prevent middle click scroll
    if (mouseButton$1 === MIDDLE_MOUSE_BUTTON$1) event.preventDefault();
  }
}


/**
 * Handles mousemove for frames; send message with points
 **/
function handleFrameMousemove (event) {
  // on mouse button and no supression key
  if (event.isTrusted && event.buttons === mouseButton$1 && (!suppressionKey$1 || !event[suppressionKey$1])) {
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
    if (mouseButton$1 === LEFT_MOUSE_BUTTON$1) window.getSelection().removeAllRanges();
  }
}


/**
* Handles mouseup for frames
**/
function handleFrameMouseup (event) {
  if (event.isTrusted && event.button === toSingleButton(mouseButton$1)) {
    browser.runtime.sendMessage({
      subject: "gestureFrameMouseup",
      data: {
        x: event.screenX,
        y: event.screenY
      }
    });
  }
}


/**
 * Handles dragstart and prevents it if needed
 **/
function handleDragstart$1 (event) {
  // prevent drag if mouse button and no supression key is pressed
  if (event.isTrusted && event.buttons === mouseButton$1 && (!suppressionKey$1 || !event[suppressionKey$1])) {
    event.preventDefault();
  }
}

// global static variables

const LEFT_MOUSE_BUTTON$2 = 1;
const RIGHT_MOUSE_BUTTON$1 = 2;

/**
 * RockerGestureController "singleton"
 * provides 2 events: on rockerleft and rockerright
 * events can be added via addEventListener and removed via removeEventListener
 * on default the controller is disabled and must be enabled via enable()
 **/


// public methods and variables


var RockerGestureController = {
  enable: enable$2,
  disable: disable$2,
  addEventListener: addEventListener$1,
  hasEventListener: hasEventListener$1,
  removeEventListener: removeEventListener$1,

  get targetElement () {
    return targetElement$1;
  },
  set targetElement (value) {
    targetElement$1 = value;
  }
};


/**
 * Add callbacks to the given events
 **/
function addEventListener$1 (event, callback) {
  // if event exists add listener (duplicates won't be added)
  if (event in events$1) events$1[event].add(callback);
}

/**
 * Check if an event listener is registered
 **/
function hasEventListener$1 (event, callback) {
  // if event exists check for listener
  if (event in events$1) events$1[event].has(callback);
}

/**
 * Remove callbacks from the given events
 **/
function removeEventListener$1 (event, callback) {
  // if event exists remove listener
  if (event in events$1) events$1[event].delete(callback);
}

/**
 * Add the event listeners to detect a gesture start
 **/
function enable$2 () {
  targetElement$1.addEventListener('mousedown', handleMousedown$1, true);
  targetElement$1.addEventListener('mouseup', handleMouseup$1, true);
  targetElement$1.addEventListener('click', handleClick, true);
  targetElement$1.addEventListener('contextmenu', handleContextmenu$1, true);
  targetElement$1.addEventListener('visibilitychange', handleVisibilitychange, true);
}

/**
 * Remove the event listeners and resets the controller
 **/
function disable$2 () {
  preventDefault = true;
  targetElement$1.removeEventListener('mousedown', handleMousedown$1, true);
  targetElement$1.removeEventListener('mouseup', handleMouseup$1, true);
  targetElement$1.removeEventListener('click', handleClick, true);
  targetElement$1.removeEventListener('contextmenu', handleContextmenu$1, true);
  targetElement$1.removeEventListener('visibilitychange', handleVisibilitychange, true);
}

// private variables and methods

// holds all custom module event callbacks
const events$1 = {
  'rockerleft': new Set(),
  'rockerright': new Set()
};

let targetElement$1 = window;

// defines whether or not the click/contextmenu should be prevented
// keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
let preventDefault = true;

// timestamp of the last mouseup
// this is needed to distinguish between true mouse click events and other click events fired by pressing enter or by clicking labels
let lastMouseup = 0;


/**
 * Handles mousedown which will detect the target and handle prevention
 **/
function handleMousedown$1 (event) {
  if (event.isTrusted) {
    // always disable prevention on mousedown
    preventDefault = false;

    if (event.buttons === LEFT_MOUSE_BUTTON$2 + RIGHT_MOUSE_BUTTON$1 && (event.button === toSingleButton(LEFT_MOUSE_BUTTON$2) || event.button === toSingleButton(RIGHT_MOUSE_BUTTON$1))) {
      // dispatch all binded functions on rocker and pass the appropriate event
      if (event.button === toSingleButton(LEFT_MOUSE_BUTTON$2)) events$1['rockerleft'].forEach((callback) => callback(event));
      else if (event.button === toSingleButton(RIGHT_MOUSE_BUTTON$1)) events$1['rockerright'].forEach((callback) => callback(event));

      event.stopPropagation();
      event.preventDefault();
      // enable prevention
      preventDefault = true;
    }
  }
}


/**
 * This is only needed to distinguish between true mouse click events and other click events fired by pressing enter or by clicking labels
 * Other property values like screen position or target could be used in the same manner
 **/
function handleMouseup$1(event) {
  lastMouseup = event.timeStamp;
}


/**
 * This is only needed for tab changing actions
 * Because the rocker gesture is executed in a different tab as where click/contextmenu needs to be prevented
 **/
function handleVisibilitychange() {
  // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
  preventDefault = true;
}


/**
 * Handles and prevents context menu if needed (right click)
 **/
function handleContextmenu$1 (event) {
  if (event.isTrusted && preventDefault && event.button === toSingleButton(RIGHT_MOUSE_BUTTON$1)) {
    // prevent contextmenu
    event.stopPropagation();
    event.preventDefault();
  }
}


/**
 * Handles and prevents click event if needed (left click)
 **/
function handleClick (event) {
  // event.detail because a click event can be fired without clicking (https://stackoverflow.com/questions/4763638/enter-triggers-button-click)
  // timeStamp check ensures that the click is fired by mouseup
  if (event.isTrusted && preventDefault && event.button === toSingleButton(LEFT_MOUSE_BUTTON$2) && event.detail && event.timeStamp === lastMouseup) {
    // prevent click
    event.stopPropagation();
    event.preventDefault();
  }
}

// global static variables

const LEFT_MOUSE_BUTTON$3 = 1;
const RIGHT_MOUSE_BUTTON$2 = 2;
const MIDDLE_MOUSE_BUTTON$2 = 4;

/**
 * WheelGestureController "singleton"
 * provides 2 events: on wheelup and wheeldown
 * events can be added via addEventListener and removed via removeEventListener
 * on default the controller is disabled and must be enabled via enable()
 **/


// public methods and variables


var WheelGestureController = {
  enable: enable$3,
  disable: disable$3,
  addEventListener: addEventListener$2,
  hasEventListener: hasEventListener$2,
  removeEventListener: removeEventListener$2,

  get targetElement () {
    return targetElement$2;
  },
  set targetElement (value) {
    targetElement$2 = value;
  },

  get mouseButton () {
    return mouseButton$2;
  },
  set mouseButton (value) {
    mouseButton$2 = Number(value);
  },

  get wheelSensitivity () {
    return wheelSensitivity;
  },
  set wheelSensitivity (value) {
    wheelSensitivity = Number(value);
  }
};


/**
 * Add callbacks to the given events
 **/
function addEventListener$2 (event, callback) {
  // if event exists add listener (duplicates won't be added)
  if (event in events$2) events$2[event].add(callback);
}

/**
 * Check if an event listener is registered
 **/
function hasEventListener$2 (event, callback) {
  // if event exists check for listener
  if (event in events$2) events$2[event].has(callback);
}

/**
 * Remove callbacks from the given events
 **/
function removeEventListener$2 (event, callback) {
  // if event exists remove listener
  if (event in events$2) events$2[event].delete(callback);
}

/**
 * Add the document event listener
 **/
function enable$3 () {
  targetElement$2.addEventListener('wheel', handleWheel, true);
  targetElement$2.addEventListener('mousedown', handleMousedown$2, true);
  targetElement$2.addEventListener('mouseup', handleMouseup$2, true);
  targetElement$2.addEventListener('click', handleClick$1, true);
  targetElement$2.addEventListener('contextmenu', handleContextmenu$2, true);
  targetElement$2.addEventListener('visibilitychange', handleVisibilitychange$1, true);
}

/**
 * Remove the event listeners and resets the handler
 **/
function disable$3 () {
  preventDefault$1 = true;
  targetElement$2.removeEventListener('wheel', handleWheel, true);
  targetElement$2.removeEventListener('mousedown', handleMousedown$2, true);
  targetElement$2.removeEventListener('mouseup', handleMouseup$2, true);
  targetElement$2.removeEventListener('click', handleClick$1, true);
  targetElement$2.removeEventListener('contextmenu', handleContextmenu$2, true);
  targetElement$2.removeEventListener('visibilitychange', handleVisibilitychange$1, true);
}

// private variables and methods

// holds all custom module event callbacks
const events$2 = {
  'wheelup': new Set(),
  'wheeldown': new Set()
};

let targetElement$2 = window,
    mouseButton$2 = LEFT_MOUSE_BUTTON$3,
    wheelSensitivity = 2;

// keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
let preventDefault$1 = true;

let lastMouseup$1 = 0;


/**
 * Handles mousedown which will detect the target and handle prevention
 **/
function handleMousedown$2 (event) {
  if (event.isTrusted && event.buttons === mouseButton$2) {
    // always disable prevention on mousedown
    preventDefault$1 = false;

    // prevent middle click scroll
    if (mouseButton$2 === MIDDLE_MOUSE_BUTTON$2) event.preventDefault();
  }
}


/**
 * Handles mousewheel up and down and prevents scrolling if needed
 **/
function handleWheel (event) {
  if (event.isTrusted && event.buttons === mouseButton$2 && event.deltaY !== 0) {
    // dispatch all binded functions on wheel and pass the appropriate event
    if (event.deltaY <= -wheelSensitivity) events$2['wheelup'].forEach((callback) => callback(event));
    else if (event.deltaY >= wheelSensitivity) events$2['wheeldown'].forEach((callback) => callback(event));

    event.stopPropagation();
    event.preventDefault();
    // enable prevention
    preventDefault$1 = true;
  }
}


/**
 * This is only needed to distinguish between true mouse click events and other click events fired by pressing enter or by clicking labels
 * Other property values like screen position or target could be used in the same manner
 **/
function handleMouseup$2(event) {
  lastMouseup$1 = event.timeStamp;
}


/**
 * This is only needed for tab changing actions
 * Because the wheel gesture is executed in a different tab as where click/contextmenu needs to be prevented
 **/
function handleVisibilitychange$1() {
  // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
  preventDefault$1 = true;
}


/**
 * Handles and prevents context menu if needed
 **/
function handleContextmenu$2 (event) {
  if (event.isTrusted && preventDefault$1 && event.button === toSingleButton(mouseButton$2) && mouseButton$2 === RIGHT_MOUSE_BUTTON$2) {
    // prevent contextmenu
    event.stopPropagation();
    event.preventDefault();
  }
}


/**
 * Handles and prevents click event if needed
 **/
function handleClick$1 (event) {
  // event.detail because a click event can be fired without clicking (https://stackoverflow.com/questions/4763638/enter-triggers-button-click)
  // timeStamp check ensures that the click is fired by mouseup
  if (event.isTrusted && preventDefault$1 && event.button === toSingleButton(mouseButton$2) && (mouseButton$2 === LEFT_MOUSE_BUTTON$3 || mouseButton$2 === MIDDLE_MOUSE_BUTTON$2) && event.detail && event.timeStamp === lastMouseup$1) {
    // prevent left and middle click
    event.stopPropagation();
    event.preventDefault();
  }
}

/**
 * ZoomController "singleton"
 * detects zoom changes propagated by the background script
 **/


// public methods and variables


var zoomController = {
  get zoomFactor () {
    return zoomFactor;
  }
};


// private variables and methods


// initialize zoom factor
let zoomFactor = 1;

// add the message event listener
browser.runtime.onMessage.addListener(handleMessage$1);

// request the zoom factor on initial load
const requestZoomFactor = browser.runtime.sendMessage({
  subject: "zoomFactorRequest",
  data: {}
});
requestZoomFactor.then(value => zoomFactor = value);


/**
 * Handles zoom factor changes messages from the background page
 **/
function handleMessage$1 (message, sender, sendResponse) {
  if (message.subject === "zoomChange") zoomFactor = message.data.zoomFactor;
}

/**
 * MouseGestureInterface "singleton"
 * provides multiple functions to manipulate the overlay
 **/


// public methods and variables


var MouseGestureInterface = {
  initialize: initialize,
  updateGestureTrace: updateGestureTrace,
  updateGestureCommand: updateGestureCommand,
  updateGestureDirections: updateGestureDirections,
  reset: reset$1,
  terminate: terminate,
  
  // gesture Trace styles

  get gestureTraceLineColor () {
    return Context.fillStyle;
  },
  set gestureTraceLineColor (value) {
    Context.fillStyle = value;
  },

  get gestureTraceLineWidth () {
    return gestureTraceLineWidth;
  },
  set gestureTraceLineWidth (value) {
    gestureTraceLineWidth = value;
  },

  get gestureTraceLineGrowth () {
    return gestureTraceLineGrowth;
  },
  set gestureTraceLineGrowth (value) {
    gestureTraceLineGrowth = Boolean(value);
  },

  get gestureTraceOpacity () {
    return Canvas.style.getPropertyValue('opacity');
  },
  set gestureTraceOpacity (value) {
    Canvas.style.setProperty('opacity', value, 'important');
  },

  // gesture command styles

  get gestureCommandFontSize () {
    return Command.style.getPropertyValue('font-size');
  },
  set gestureCommandFontSize (value) {
    Command.style.setProperty('font-size', value, 'important');
  },

  get gestureCommandTextColor () {
    return Command.style.getPropertyValue('color');
  },
  set gestureCommandTextColor (value) {
    Command.style.setProperty('color', value, 'important');
  },

  get gestureCommandBackgroundColor () {
    const backgroundColorProperty = Command.style.getPropertyValue('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );
    const colorArray = color.split(',').map(Number);
    return rgbToHex(...colorArray);
  },
  set gestureCommandBackgroundColor (value) {
    const backgroundColorProperty = Command.style.getPropertyValue('background-color');
    const opacity = backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    );

    Command.style.setProperty(
      'background-color', 'rgba(' +
       hexToRGB(value).join(",") + ',' +
       opacity +
      ')', 'important'
    );
  },

  get gestureCommandBackgroundOpacity () {
    const backgroundColorProperty = Command.style.getPropertyValue('background-color');
    return Number(backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    ));
  },
  set gestureCommandBackgroundOpacity (value) {
    const backgroundColorProperty = Command.style.getPropertyValue('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );

    Command.style.setProperty(
      'background-color', 'rgba(' +
       color + ',' +
       value +
      ')', 'important'
    );
  },

  // gesture direction styles

  get gestureDirectionsFontSize () {
    return Directions.style.getPropertyValue('font-size');
  },
  set gestureDirectionsFontSize (value) {
    Directions.style.setProperty('font-size', value, 'important');
  },

  get gestureDirectionsTextAlign () {
    return Directions.style.getPropertyValue('text-align');
  },
  set gestureDirectionsTextAlign (value) {
    Directions.style.setProperty('text-align', value, 'important');
  },

  get gestureDirectionsTextColor () {
    return Directions.style.getPropertyValue('color');
  },
  set gestureDirectionsTextColor (value) {
    Directions.style.setProperty('color', value, 'important');
  },

  get gestureDirectionsBackgroundColor () {
    const backgroundColorProperty = Directions.style.getPropertyValue('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );
    const colorArray = color.split(',').map(Number);
    return rgbToHex(...colorArray);
  },
  set gestureDirectionsBackgroundColor (value) {
    const backgroundColorProperty = Directions.style.getPropertyValue('background-color');
    const opacity = backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    );

    Directions.style.setProperty(
      'background-color', 'rgba(' +
       hexToRGB(value).join(",") + ',' +
       opacity +
      ')', 'important'
    );
  },

  get gestureDirectionsBackgroundOpacity () {
    const backgroundColorProperty = Directions.style.getPropertyValue('background-color');
    return Number(backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    ));
  },
  set gestureDirectionsBackgroundOpacity (value) {
    const backgroundColorProperty = Directions.style.getPropertyValue('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );

    Directions.style.setProperty(
      'background-color', 'rgba(' +
       color + ',' +
       value +
      ')', 'important'
    );
  }
};


/**
 * appand overlay and start drawing the gesture
 **/
function initialize (x, y) {
  // overlay is not working in a pure svg page thus do not append the overlay
  if (document.documentElement.tagName.toUpperCase() === "SVG") return;

  if (document.body.tagName.toUpperCase() === "FRAMESET") {
    document.documentElement.appendChild(Overlay);
  }
  else {
    document.body.appendChild(Overlay);
  }
  // convert point screen coordinates to css coordinates
  lastPoint.x = Math.round(x / zoomController.zoomFactor - window.mozInnerScreenX);
  lastPoint.y = Math.round(y / zoomController.zoomFactor - window.mozInnerScreenY);
}


/**
 * draw line for gesture
 */
function updateGestureTrace (points) {
  if (!Overlay.contains(Canvas)) Overlay.appendChild(Canvas);

  // temporary path in order draw all segments in one call
  const path = new Path2D();
  
  for (let point of points) {
    // convert point screen coordinates to css coordinates
    point.x = Math.round(point.x / zoomController.zoomFactor - window.mozInnerScreenX);
    point.y = Math.round(point.y / zoomController.zoomFactor - window.mozInnerScreenY);

    if (gestureTraceLineGrowth && lastTraceWidth < gestureTraceLineWidth) {
      // the length in pixels after which the line should be grown to its final width
      // in this case the length depends on the final width defined by the user
      const growthDistance = gestureTraceLineWidth * 50;
      // the distance from the last point to the current
      const distance = getDistance(lastPoint.x, lastPoint.y, point.x, point.y);
      // cap the line width by its final width value
      const currentTraceWidth = Math.min(
        lastTraceWidth + distance / growthDistance * gestureTraceLineWidth,
        gestureTraceLineWidth
      );
      const pathSegment = createGrowingLine(lastPoint.x, lastPoint.y, point.x, point.y, lastTraceWidth, currentTraceWidth);
      path.addPath(pathSegment);

      lastTraceWidth = currentTraceWidth;
    }
    else {
      const pathSegment = createGrowingLine(lastPoint.x, lastPoint.y, point.x, point.y, gestureTraceLineWidth, gestureTraceLineWidth);
      path.addPath(pathSegment);
    }
    
    lastPoint.x = point.x;
    lastPoint.y = point.y;
  }
  // draw accumulated path segments
  Context.fill(path);
}


/**
 * update command on match
 **/
function updateGestureCommand (command) {
  if (command) {
    if (!Overlay.contains(Command)) Overlay.appendChild(Command);
    Command.textContent = command;
  }
  else Command.remove();
}


/**
 * update directions
 **/
function updateGestureDirections (directions) {
  if (!Overlay.contains(Directions)) Overlay.appendChild(Directions);
  // display the matching direction arrow symbols
  Directions.textContent = directions.join("");
}


/**
 * remove and reset all child elements
 **/
function reset$1 () {
  Canvas.remove();
  Command.remove();
  Directions.remove();
  // clear canvas
  Context.clearRect(0, 0, Canvas.width, Canvas.height);
  // reset trace line width
  lastTraceWidth = 0;
  Directions.textContent = "";
  Command.textContent = "";
}


/**
 * remove overlay and reset overlay
 **/
function terminate () {
  Overlay.remove();
  reset$1();
}


// private variables and methods


// also used to caputre the mouse events over iframes
const Overlay = document.createElement("div");
      Overlay.style = `
        all: initial !important;
        position: fixed !important;
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 2147483647 !important;
      `;

const Canvas = document.createElement("canvas");
      Canvas.style = `
        all: initial !important;
      `;

const Context = Canvas.getContext('2d');

const Directions = document.createElement("div");
      Directions.style = `
        all: initial !important;
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        font-family: firefox-gesture-arrows !important;
        direction: rtl !important;
        letter-spacing: 0.3em !important;
        width: 100% !important;
        text-shadow: 0.01em 0.01em 0.07em rgba(0,0,0, 0.8) !important;
        padding: 0.2em 0.2em !important;
        white-space: nowrap !important;
        background-color: rgba(0,0,0,0) !important;
      `;

const Command = document.createElement("div");
      Command.style = `
        all: initial !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -100%) !important;
        font-family: "NunitoSans Regular", "Arial", sans-serif !important;
        line-height: normal !important;
        text-shadow: 0.01em 0.01em 0.1em rgba(0,0,0, 0.8) !important;
        text-align: center !important;
        padding: 0.4em 0.4em 0.3em !important;
        border-radius: 0.07em !important;
        font-weight: bold !important;
        background-color: rgba(0,0,0,0) !important;
      `;


let gestureTraceLineWidth = 10,
    gestureTraceLineGrowth = true;


let lastTraceWidth = 0,
    lastPoint = { x: 0, y: 0 };


// resize canvas on window resize
window.addEventListener('resize', maximizeCanvas, true);
maximizeCanvas();


/**
 * Adjust the canvas size to the size of the window
 **/
function maximizeCanvas () {
  // save context properties, because they get cleared on canvas resize
  const tmpContext = {
    lineCap: Context.fillStyle,
    lineJoin: Context.lineJoin,
    fillStyle: Context.fillStyle,
    strokeStyle: Context.strokeStyle,
    lineWidth: Context.lineWidth
  }; 

  Canvas.width = window.innerWidth;
  Canvas.height = window.innerHeight;

  // restore previous context properties
  Object.assign(Context, tmpContext);
}


/**
 * creates a growing line from a starting point and strike width to an end point and stroke width
 * returns a path 2d object
 **/
function createGrowingLine (x1, y1, x2, y2, startWidth, endWidth) {
  // calculate direction vector of point 1 and 2
  const directionVectorX = x2 - x1,
        directionVectorY = y2 - y1;
  // calculate angle of perpendicular vector
  const perpendicularVectorAngle = Math.atan2(directionVectorY, directionVectorX) + Math.PI/2;
  // construct shape
  const path = new Path2D();
        path.arc(x1, y1, startWidth/2, perpendicularVectorAngle, perpendicularVectorAngle + Math.PI);
        path.arc(x2, y2, endWidth/2, perpendicularVectorAngle + Math.PI, perpendicularVectorAngle);
        path.closePath();
  return path;
}

/**
 * PopupCommandInterface
 * listens for "PopupRequest" background messages and displays an popup according to the message data
 * an iframe is used in order to protect the user data from webpages that may try to read or manipulate the contents of the popup
 **/


// private variables and methods

const Popup = document.createElement("iframe");
      Popup.style = `
          all: initial !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          border: 0 !important;
          z-index: 2147483647 !important;
          box-shadow: 1px 1px 5px rgba(0,0,0,0.4) !important;
          opacity: 0 !important;
          transition: opacity .3s !important;
        `;
      Popup.onload = initialize$1;
      Popup.src = browser.extension.getURL("/core/interfaces/html/popup-command-interface.html");

// contains the message response function
let respond = null;

// contains the message data
let data = null;

// contains the mouse position retrieved from the message
const position = {
  x: 0,
  y: 0
};

// setup background/command message event listener
browser.runtime.onMessage.addListener(handleMessage$2);


/**
 * Called on popup load
 * Exports all necessary functions
 * Builds all html contents, sizes and positions the popup
 **/
function initialize$1 () {
  // unwrap iframe window
  const popupWindow = Popup.contentWindow.wrappedJSObject;

  // export necessary event handler functions
  popupWindow.handleWheel = exportFunction(handleWheel$1, popupWindow);
  popupWindow.handleContextmenu = exportFunction(handleContextmenu$3, popupWindow);
  popupWindow.handleItemSelection = exportFunction(handleItemSelection, popupWindow);
  popupWindow.handleKeyDown = exportFunction(handleKeyDown, popupWindow);
  popupWindow.handleBlur = exportFunction(handleBlur, popupWindow);
  popupWindow.handleScrollButtonMouseover = exportFunction(handleScrollButtonMouseover, popupWindow);

  // add event listeners
  popupWindow.addEventListener("wheel", popupWindow.handleWheel, true);
  popupWindow.addEventListener("contextmenu", popupWindow.handleContextmenu, true);
  popupWindow.addEventListener("keydown", popupWindow.handleKeyDown, true);

  // create list
  const list = Popup.contentDocument.createElement("ul");
        list.id = "list";
  // map data to list items
  for (let element of data) {
    const item = Popup.contentDocument.createElement("li");
          item.classList.add("item");
          item.onclick = handleItemSelection;
          item.dataset.id = element.id;
    // add image icon if available
    if (element.icon) {
      const image = Popup.contentDocument.createElement("img");
            image.src = element.icon;
      item.appendChild(image);
    }
    // add label
    const text = Popup.contentDocument.createElement("span");
          text.textContent = element.label;
    item.appendChild(text);

    list.appendChild(item);
  }
  // append list
  Popup.contentDocument.body.appendChild(list);
  // focus Popup (some tweaks to ensure the focus)
  Popup.contentDocument.body.tabIndex = -1;
  document.activeElement.blur();
  Popup.contentDocument.body.focus();
  Popup.contentDocument.body.onblur = handleBlur;

  // try to get the relative screen width without scrollbar
  const relativeScreenWidth = document.documentElement.clientWidth || document.body.clientWidth || window.innerWidth;
  const relativeScreenHeight = document.documentElement.clientHeight || document.body.clientHeight || window.innerHeight;

  // get the absolute maximum available height from the current position either from the top or bottom
  const maxAvailableHeight = Math.max(relativeScreenHeight - position.y, position.y) * zoomController.zoomFactor;

  // get absolute list dimensions
  const width = list.scrollWidth;
  const height = Math.min(list.scrollHeight, maxAvailableHeight);

  // convert absolute to relative dimensions
  const relativeWidth = width / zoomController.zoomFactor;
  const relativeHeight = height / zoomController.zoomFactor;

  // calculate absolute available space to the right and bottom
  const availableSpaceRight = (relativeScreenWidth - position.x) * zoomController.zoomFactor;
  const availableSpaceBottom = (relativeScreenHeight - position.y) * zoomController.zoomFactor;

  // get the ideal relative position based on the given available space and dimensions
  const x = availableSpaceRight >= width ? position.x : position.x - relativeWidth;
  const y = availableSpaceBottom >= height ? position.y : position.y - relativeHeight;

  // add scroll buttons if list is scrollable
  if (height < list.scrollHeight) {
    const buttonUp = Popup.contentDocument.createElement("div");
          buttonUp.classList.add("button", "up");
          buttonUp.onmouseover = handleScrollButtonMouseover;
    const buttonDown = Popup.contentDocument.createElement("div");
          buttonDown.classList.add("button", "down");
          buttonDown.onmouseover = handleScrollButtonMouseover;
    Popup.contentDocument.body.append(buttonUp, buttonDown);
  }

  // apply scale, position, dimensions to Popup / iframe and make it visible
  Popup.style.setProperty('width', Math.round(width) + 'px', 'important');
  Popup.style.setProperty('height', Math.round(height) + 'px', 'important');
  Popup.style.setProperty('transform-origin', `0 0`, 'important');
  Popup.style.setProperty('transform', `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${1/zoomController.zoomFactor})`, 'important');
  Popup.style.setProperty('opacity', '1', 'important');
}


/**
 * Terminates the popup and closes the messaging channel by responding
 * Also used to pass the selected item to the corresponding command
 **/
function terminate$1 (message = null) {
  respond(message);
  Popup.remove();
  Popup.style.setProperty('opacity', '0', 'important');
}


/**
 * Handles background messages which request to create a popup
 * This also exposes necessary data and the specific respond function
 **/
function handleMessage$2 (message, sender, sendResponse) {
  if (message.subject === "PopupRequest") {
    // store reference for other functions
    position.x = message.data.mousePosition.x / zoomController.zoomFactor - window.mozInnerScreenX;
    position.y = message.data.mousePosition.y / zoomController.zoomFactor - window.mozInnerScreenY;
    data = message.data.dataset;

    // expose response function
    respond = sendResponse;

    // popup is not working in a pure svg page thus do not append the popup
    if (document.documentElement.tagName.toUpperCase() === "SVG") return;
    
    // this will start loading the iframe content
    if (document.body.tagName.toUpperCase() === "FRAMESET")
      document.documentElement.appendChild(Popup);
    else document.body.appendChild(Popup);

    // keep the messaging channel open (https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent)
    return true;
  }
}


/**
 * Handles and emulates mouse wheel scrolling inside the popup
 **/
function handleWheel$1 (event) {
  Popup.contentWindow.scrollBy(0, event.deltaY * 10);
  event.preventDefault();
  event.stopPropagation();
}


/**
 * Prevents the context menu because of design reason and for rocker gesture conflicts
 **/
function handleContextmenu$3 (event) {
  event.preventDefault();
}


/**
 * Passes the id of the selected item to the termination function
 **/
function handleItemSelection () {
  terminate$1(this.dataset.id);
}


/**
 * Handles up and down arrow keys
 **/
function handleKeyDown (event) {
  if (event.key === "ArrowUp")
    Popup.contentWindow.scrollBy(0, -28);
  else if (event.key === "ArrowDown")
    Popup.contentWindow.scrollBy(0, 28);
}


/**
 * Handles the up and down controls
 **/
function handleScrollButtonMouseover (event) {
  const direction = this.classList.contains("up") ? -4 : 4;
  const button = event.currentTarget;

  function step (timestamp) {
    if (!button.matches(':hover')) return;
    Popup.contentWindow.scrollBy(0, direction);
    window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
}


/**
 * Handles the blur event and terminates the popup if not already done
 **/
function handleBlur () {
  if (document.documentElement.contains(Popup) || document.body.contains(Popup)) {
    terminate$1();
  }
}

// global variable containing the target html element for scripts injected by commands
window.TARGET = null;

// expose commons functions to scripts injected by commands like scrollTo
window.isEditableInput = isEditableInput;
window.isScrollableY = isScrollableY;
window.scrollToY = scrollToY;
window.getClosestElement = getClosestElement;


const Config = new ConfigManager("sync", browser.runtime.getURL("resources/json/defaults.json"));
      Config.autoUpdate = true;
      Config.loaded.then(main);
      Config.addEventListener("change", main);



////////////////// IFRAME WORKAROUND START \\\\\\\\\\\\\\\\\\\\\\

let iframeTargetData = null;

if (!isIframe()) browser.runtime.onMessage.addListener((message) => {
  if (message.subject === "gestureFrameMousedown") {
    // save target data
    iframeTargetData = message.data;
  }
});

////////////////// IFRAME WORKAROUND END \\\\\\\\\\\\\\\\\\\\\\


// Define mouse gesture controller event listeners and connect them to the mouse gesture interface methods
// sends the appropriate messages to the background script

MouseGestureController.addEventListener("start", (events) => {
  const firstEvent = events.shift();
  MouseGestureInterface.initialize(firstEvent.screenX, firstEvent.screenY);
  // expose target to global target variable
  window.TARGET = firstEvent.target;

  if (events.length > 0 && Config.get("Settings.Gesture.Trace.display")) {
    const points = events.map(event => ( {x: event.screenX, y: event.screenY} ));
    MouseGestureInterface.updateGestureTrace(points);
  }
});

MouseGestureController.addEventListener("update", (events) => {
  if (Config.get("Settings.Gesture.Trace.display")) {
    const points = events.map(event => ( {x: event.screenX, y: event.screenY} ));
    MouseGestureInterface.updateGestureTrace(points);
  }
});

MouseGestureController.addEventListener("change", (events, directions) => {
  if (Config.get("Settings.Gesture.Directions.display")) {
    MouseGestureInterface.updateGestureDirections(directions);
  }

  if (Config.get("Settings.Gesture.Command.display")) {
    // send message to background on gesture change
    const message = browser.runtime.sendMessage({
      subject: "gestureChange",
      data: {
        gesture: directions.join("")
      }
    });
    // on response (also fires on no response) update the gesture overlay
    message.then((response) => {
      const command = response ? response.command : null;
      MouseGestureInterface.updateGestureCommand(command);
    });
  }
});

MouseGestureController.addEventListener("timeout", (events) => {
  // call reset insted of terminate so the overlay can catch the mouseup/contextmenu for iframes [frame compatibility]
  MouseGestureInterface.reset();
  // reset iframe target data variable
  iframeTargetData = null;
});

MouseGestureController.addEventListener("end", (events, directions) => {
  // prevent command execution on timeout
  // normally the end event shouldn't be fired from the mouse gesture controller after the timeout event has fired
  // but it's currently required since the overlay needs to be terminated [frame compatibility]
  if (MouseGestureController.state !== MouseGestureController.STATE_EXPIRED) {
    const lastEvent = events.pop();

    const data = iframeTargetData ? iframeTargetData : getTargetData(window.TARGET);
          data.gesture = directions.join("");
          data.mousePosition = {
            x: lastEvent.screenX,
            y: lastEvent.screenY
          };
    // send data to background script
    browser.runtime.sendMessage({
      subject: "gestureEnd",
      data: data
    });
  }

  // close overlay
  MouseGestureInterface.terminate();

  // reset iframe target data variable
  iframeTargetData = null;
});


// define wheel and rocker gesture controller event listeners
// combine them to one function, since they all do the same except the subject they send to the background script

WheelGestureController.addEventListener("wheelup", event => handleRockerAndWheelEvents("wheelUp", event));
WheelGestureController.addEventListener("wheeldown", event => handleRockerAndWheelEvents("wheelDown", event));
RockerGestureController.addEventListener("rockerleft", event => handleRockerAndWheelEvents("rockerLeft", event));
RockerGestureController.addEventListener("rockerright", event => handleRockerAndWheelEvents("rockerRight", event));

function handleRockerAndWheelEvents (subject, event) {
  // cancel mouse gesture and terminate overlay in case it got triggered
  MouseGestureController.cancel();
  // close overlay
  MouseGestureInterface.terminate();

  // gather specifc data
  const data = getTargetData(event.target);
        data.mousePosition = {
          x: event.screenX,
          y: event.screenY
        };
  // expose target to global target variable
  window.TARGET = event.target;
  // send data to background script
  browser.runtime.sendMessage({
    subject: subject,
    data: data
  });
}


/**
 * main function
 * applies the user config to the particular controller or interface
 * enables or disables the appropriate controller
 **/
function main () {
  // check if current url is not listed in the blacklist
  if (!Config.get("Blacklist").some(matchesCurrentURL)) {

    // apply all settings

    MouseGestureController.mouseButton = Config.get("Settings.Gesture.mouseButton");
    MouseGestureController.suppressionKey = Config.get("Settings.Gesture.suppressionKey");
    MouseGestureController.distanceThreshold = Config.get("Settings.Gesture.distanceThreshold");
    MouseGestureController.distanceSensitivity = Config.get("Settings.Gesture.distanceSensitivity");
    MouseGestureController.timeoutActive = Config.get("Settings.Gesture.Timeout.active");
    MouseGestureController.timeoutDuration = Config.get("Settings.Gesture.Timeout.duration");

    IframeMouseGestureController.mouseButton = Config.get("Settings.Gesture.mouseButton");
    IframeMouseGestureController.suppressionKey = Config.get("Settings.Gesture.suppressionKey");

    WheelGestureController.mouseButton = Config.get("Settings.Wheel.mouseButton");
    WheelGestureController.wheelSensitivity = Config.get("Settings.Wheel.wheelSensitivity");

    MouseGestureInterface.gestureTraceLineColor = Config.get("Settings.Gesture.Trace.Style.strokeStyle");
    MouseGestureInterface.gestureTraceLineWidth = Config.get("Settings.Gesture.Trace.Style.lineWidth");
    MouseGestureInterface.gestureTraceLineGrowth = Config.get("Settings.Gesture.Trace.Style.lineGrowth");
    MouseGestureInterface.gestureTraceOpacity = Config.get("Settings.Gesture.Trace.Style.opacity");
    MouseGestureInterface.gestureCommandFontSize = Config.get("Settings.Gesture.Command.Style.fontSize");
    MouseGestureInterface.gestureCommandTextColor = Config.get("Settings.Gesture.Command.Style.color");
    MouseGestureInterface.gestureCommandBackgroundColor = Config.get("Settings.Gesture.Command.Style.backgroundColor");
    MouseGestureInterface.gestureCommandBackgroundOpacity = Config.get("Settings.Gesture.Command.Style.backgroundOpacity");
    MouseGestureInterface.gestureDirectionsFontSize = Config.get("Settings.Gesture.Directions.Style.fontSize");
    MouseGestureInterface.gestureDirectionsTextAlign = Config.get("Settings.Gesture.Directions.Style.textAlign");
    MouseGestureInterface.gestureDirectionsTextColor = Config.get("Settings.Gesture.Directions.Style.color");
    MouseGestureInterface.gestureDirectionsBackgroundColor = Config.get("Settings.Gesture.Directions.Style.backgroundColor");
    MouseGestureInterface.gestureDirectionsBackgroundOpacity = Config.get("Settings.Gesture.Directions.Style.backgroundOpacity");

    // enable mouse gesture controller only in main frame
    if (!isIframe()) MouseGestureController.enable();
    else IframeMouseGestureController.enable();

    // enable/disable rocker gesture
    if (Config.get("Settings.Rocker.active")) {
      RockerGestureController.enable();
    }
    else {
      RockerGestureController.disable();
    }

    // enable/disable wheel gesture
    if (Config.get("Settings.Wheel.active")) {
      WheelGestureController.enable();
    }
    else {
      WheelGestureController.disable();
    }
  }
  // if url is blacklisted disable everything
  else {
    MouseGestureController.disable();
    IframeMouseGestureController.disable();
    RockerGestureController.disable();
    WheelGestureController.disable();
  }
}


/**
 * checkes if the given url is a subset of the current url or equal
 * NOTE: window.location.href is returning the wrong URL for iframes
 **/
function matchesCurrentURL (urlPattern) {
	// match special regex characters
	const pattern = urlPattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, (match) => {
		// replace * with .* -> matches anything 0 or more times, else escape character
		return match === '*' ? '.*' : '\\'+match;
	});
	// ^ matches beginning of input and $ matches ending of input
	return new RegExp('^'+pattern+'$').test(window.location.href);
}
