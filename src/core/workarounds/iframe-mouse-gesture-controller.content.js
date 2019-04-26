import { toSingleButton, getTargetData } from "/core/commons.js";

const LEFT_MOUSE_BUTTON = 1;
const MIDDLE_MOUSE_BUTTON = 4;

/**
 * Iframe mouse gesture handler
 * Forwards the mouse event screen coordinates to the background message handler
 **/


// public methods and variables


export default {
  enable: enable,
  disable: disable,

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
  }
};


/**
 * Add the event listeners to detect a gesture start
 **/
function enable () {
  window.addEventListener('pointerdown', handleFrameMousedown, true);
  window.addEventListener('pointermove', handleFrameMousemove, true);
  window.addEventListener('pointerup', handleFrameMouseup, true);
  window.addEventListener('dragstart', handleDragstart, true);  
};


/**
 * Remove the event listeners and resets the controller
 **/
function disable () {
  window.removeEventListener('pointerdown', handleFrameMousedown, true);
  window.removeEventListener('pointermove', handleFrameMousemove, true);
  window.removeEventListener('pointerup', handleFrameMouseup, true);
  window.removeEventListener('dragstart', handleDragstart, true);
}


// private variables and methods


let mouseButton = 2,
    suppressionKey = "";


/**
* Handles mousedown for frames; send message with target data and position
**/
function handleFrameMousedown (event) {
  // on mouse button and no supression key
  if (event.isTrusted && event.buttons === mouseButton && (!suppressionKey || !event[suppressionKey])) {
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
    if (mouseButton === MIDDLE_MOUSE_BUTTON) event.preventDefault();
  }
}


/**
 * Handles mousemove for frames; send message with points
 **/
function handleFrameMousemove (event) {
  // on mouse button and no supression key
  if (event.isTrusted && event.buttons === mouseButton && (!suppressionKey || !event[suppressionKey])) {
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
    if (mouseButton === LEFT_MOUSE_BUTTON) window.getSelection().removeAllRanges();
  }
}


/**
* Handles mouseup for frames
**/
function handleFrameMouseup (event) {
  if (event.isTrusted && event.button === toSingleButton(mouseButton)) {
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
function handleDragstart (event) {
  // prevent drag if mouse button and no supression key is pressed
  if (event.isTrusted && event.buttons === mouseButton && (!suppressionKey || !event[suppressionKey])) {
    event.preventDefault();
  }
}