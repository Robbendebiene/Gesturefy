import { isEmbeddedFrame, isEditableInput, isScrollableY, scrollToY, getClosestElement } from "/core/utils/commons.mjs";

import GestureContextData, { MouseData } from "/core/models/gesture-context-data.mjs";

import ConfigManager from "/core/services/config-manager.mjs";

import DefaultConfig from "/resources/configs/defaults.mjs";

import ExclusionService from "/core/services/exclusion-service.mjs";

import MouseGestureController from "/core/controllers/mouse-gesture-controller.mjs";

import RockerGestureController from "/core/controllers/rocker-gesture-controller.mjs";

import WheelGestureController from "/core/controllers/wheel-gesture-controller.mjs";

import PatternConstructor from "/core/utils/pattern-constructor.mjs";

import MouseGestureView from "/core/views/mouse-gesture-view/mouse-gesture-view.mjs";

import PopupCommandView from "/core/views/popup-command-view/popup-command-view.mjs";

import ListenerObserver from "/core/helpers/listener-detach-observer.mjs";

import "/core/helpers/user-script-runner.mjs";


// global variable containing the hierarchy of target html elements for scripts injected by commands
window.TARGET = null;

// expose commons functions to scripts injected by commands like scrollTo
window.isEditableInput = isEditableInput;
window.isScrollableY = isScrollableY;
window.scrollToY = scrollToY;
window.getClosestElement = getClosestElement;

const IS_EMBEDDED_FRAME = isEmbeddedFrame();

const Exclusions = new ExclusionService();
      Exclusions.addEventListener("change", main);

const Config = new ConfigManager({
        defaults: DefaultConfig,
        autoUpdate: true
      });
      Config.addEventListener("change", main);

Promise.all([
  Config.loaded,
  Exclusions.loaded
]).then(main);

// re-run main function if event listeners got removed
// this is a workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1726978
ListenerObserver.onDetach.addListener(main);

// setup pattern extractor
const patternConstructor = new PatternConstructor(0.12, 10);

// holds the data of the gesture target element
let gestureContextData = null;

// Define mouse gesture controller event listeners and connect them to the mouse gesture interface methods
// Also sends the appropriate messages to the background script
// movementX/Y cannot be used because the events returned by getCoalescedEvents() contain wrong values (Firefox Bug)

// The conversation to css screen coordinates via window.mozInnerScreenX is required
// to calculate the proper position in the main frame for coordinates from embedded frames
// (required for popup commands and gesture interface)

MouseGestureController.addEventListener("register", (event, events) => {
  // expose target to global variable
  window.TARGET = event.composedPath?.()[0] ?? event.target;
  // collect contextual data
  // this is required to run as early as possible
  // because if we gather the data later some website scripts may have already removed th original target element.
  // see also: https://github.com/Robbendebiene/Gesturefy/issues/684
  gestureContextData = GestureContextData.fromEvent(event);
});


MouseGestureController.addEventListener("start", (event, events) => {
  // handle mouse gesture interface
  if (Config.get("Settings.Gesture.Trace.display") || Config.get("Settings.Gesture.Command.display")) {
    // if the gesture is not performed inside a child frame
    // then display the mouse gesture ui in this frame, else redirect the events to the top frame
    if (!IS_EMBEDDED_FRAME) {
      MouseGestureView.initialize(event.clientX, event.clientY);
    }
    else {
      browser.runtime.sendMessage({
        subject: "mouseGestureViewInitialize",
        data: {
          x: event.clientX + window.mozInnerScreenX,
          y: event.clientY + window.mozInnerScreenY
        }
      });
    }
  }

  // get coalesced events
  // calling getCoalescedEvents for an event other then pointermove will return an empty array
  const coalescedEvents = events.flatMap(event => {
    const events = event.getCoalescedEvents?.();
    // if events is null/undefined or empty (length == 0) return plain event
    return (events?.length > 0) ? events : [event];
  });

  mouseGestureUpdate(coalescedEvents);
});


MouseGestureController.addEventListener("update", (event, events) => {
  // get coalesced events
  // include fallback if getCoalescedEvents is not defined
  const coalescedEvents = event.getCoalescedEvents?.() ?? [event];

  mouseGestureUpdate(coalescedEvents);
});


function mouseGestureUpdate(coalescedEvents) {
  // build gesture pattern
  for (const event of coalescedEvents) {
    const patternChange = patternConstructor.addPoint(event.clientX, event.clientY);
    if (patternChange && Config.get("Settings.Gesture.Command.display")) {
      // send current pattern to background script
      browser.runtime.sendMessage({
        subject: "gestureChange",
        data: patternConstructor.getPattern()
      });
    }
  }

  // handle mouse gesture interface update
  if (Config.get("Settings.Gesture.Trace.display")) {
    if (!IS_EMBEDDED_FRAME) {
      const points = coalescedEvents.map(event => ({ x: event.clientX, y: event.clientY }));
      MouseGestureView.updateGestureTrace(points);
    }
    else {
      // map points to global screen wide coordinates
      const points = coalescedEvents.map(event => ({
        x: event.clientX + window.mozInnerScreenX,
        y: event.clientY + window.mozInnerScreenY
      }));
      browser.runtime.sendMessage({
        subject: "mouseGestureViewUpdateGestureTrace",
        data: {
          points: points
        }
      });
    }
  }
}


MouseGestureController.addEventListener("abort", (events) => {
  // close mouse gesture interface
  if (Config.get("Settings.Gesture.Trace.display") || Config.get("Settings.Gesture.Command.display")) {
    if (!IS_EMBEDDED_FRAME) MouseGestureView.terminate();
    else browser.runtime.sendMessage({
      subject: "mouseGestureViewTerminate"
    });
  }
  // clear pattern
  patternConstructor.clear();
  gestureContextData = null;
});


MouseGestureController.addEventListener("end", (event, events) => {
  // close mouse gesture interface
  if (Config.get("Settings.Gesture.Trace.display") || Config.get("Settings.Gesture.Command.display")) {
    if (!IS_EMBEDDED_FRAME) MouseGestureView.terminate();
    else browser.runtime.sendMessage({
      subject: "mouseGestureViewTerminate"
    });
  }

  // if the target was removed from dom trace a new element at the starting point
  if (!window.TARGET.isConnected) {
    window.TARGET = document.elementFromPoint(events[0].clientX, events[0].clientY);
  }

  // set last mouse event as endpoint
  gestureContextData.mouse = new MouseData({
    endpoint: {
      // transform coordinates to css screen coordinates
      x: event.clientX + window.mozInnerScreenX,
      y: event.clientY + window.mozInnerScreenY
    }
  });

  // send data to background script
  browser.runtime.sendMessage({
    subject: "gestureEnd",
    data: {
      pattern: patternConstructor.getPattern(),
      contextData: gestureContextData,
    }
  });
  // clear pattern
  patternConstructor.clear();
  gestureContextData = null;
});


// add message listeners to main frame
// these handle the mouse gesture view messages send from embedded frames and the background script

if (!IS_EMBEDDED_FRAME) {
  browser.runtime.onMessage.addListener((message) => {
    switch (message.subject) {
      case "mouseGestureViewInitialize":
        // remap points to client wide css coordinates
        MouseGestureView.initialize(
          message.data.x - window.mozInnerScreenX,
          message.data.y - window.mozInnerScreenY
        );
      break;

      case "mouseGestureViewUpdateGestureTrace":
        // remap points to client wide css coordinates
        message.data.points.forEach(point => {
          point.x -= window.mozInnerScreenX;
          point.y -= window.mozInnerScreenY;
        });
        MouseGestureView.updateGestureTrace(message.data.points);
      break;

      case "mouseGestureViewTerminate":
        MouseGestureView.terminate();
      break;

      case "matchingGesture":
        MouseGestureView.updateGestureCommand(message.data);
      break;
    }
  });
}

// define wheel and rocker gesture controller event listeners
// combine them to one function, since they all do the same except the subject they send to the background script

WheelGestureController.addEventListener("wheelup", event => handleRockerAndWheelEvents("wheelUp", event));
WheelGestureController.addEventListener("wheeldown", event => handleRockerAndWheelEvents("wheelDown", event));
RockerGestureController.addEventListener("rockerleft", event => handleRockerAndWheelEvents("rockerLeft", event));
RockerGestureController.addEventListener("rockerright", event => handleRockerAndWheelEvents("rockerRight", event));

function handleRockerAndWheelEvents (subject, event) {
  // expose target to global variable
  window.TARGET = event.composedPath?.()[0] ?? event.target;

  // cancel mouse gesture and terminate overlay in case it got triggered
  MouseGestureController.cancel();
  // close overlay
  MouseGestureView.terminate();

  // collect contextual data
  const data = GestureContextData.fromEvent(event);
  // send data to background script
  browser.runtime.sendMessage({
    subject: subject,
    data: data
  });
}


/**
 * Main function
 * Applies the user config to the particular controller or interface
 * Enables or disables the appropriate controller
 **/
function main () {
  // apply hidden settings
  if (Config.has("Settings.Gesture.patternDifferenceThreshold")) {
    patternConstructor.differenceThreshold = Config.get("Settings.Gesture.patternDifferenceThreshold");
  }
  if (Config.has("Settings.Gesture.patternDistanceThreshold")) {
    patternConstructor.distanceThreshold = Config.get("Settings.Gesture.patternDistanceThreshold");
  }

  // apply all settings
  MouseGestureController.mouseButton = Config.get("Settings.Gesture.mouseButton");
  MouseGestureController.suppressionKey = Config.get("Settings.Gesture.suppressionKey");
  MouseGestureController.distanceThreshold = Config.get("Settings.Gesture.distanceThreshold");
  MouseGestureController.timeoutActive = Config.get("Settings.Gesture.Timeout.active");
  MouseGestureController.timeoutDuration = Config.get("Settings.Gesture.Timeout.duration");

  WheelGestureController.mouseButton = Config.get("Settings.Wheel.mouseButton");
  WheelGestureController.wheelSensitivity = Config.get("Settings.Wheel.wheelSensitivity");

  MouseGestureView.gestureTraceLineColor = Config.get("Settings.Gesture.Trace.Style.strokeStyle");
  MouseGestureView.gestureTraceLineWidth = Config.get("Settings.Gesture.Trace.Style.lineWidth");
  MouseGestureView.gestureTraceLineGrowth = Config.get("Settings.Gesture.Trace.Style.lineGrowth");
  MouseGestureView.gestureCommandFontSize = Config.get("Settings.Gesture.Command.Style.fontSize");
  MouseGestureView.gestureCommandFontColor = Config.get("Settings.Gesture.Command.Style.fontColor");
  MouseGestureView.gestureCommandBackgroundColor = Config.get("Settings.Gesture.Command.Style.backgroundColor");
  MouseGestureView.gestureCommandHorizontalPosition = Config.get("Settings.Gesture.Command.Style.horizontalPosition");
  MouseGestureView.gestureCommandVerticalPosition = Config.get("Settings.Gesture.Command.Style.verticalPosition");

  PopupCommandView.theme = Config.get("Settings.General.theme");

  if (Exclusions.isEnabledFor(window.location.href)) {
    // enable mouse gesture controller
    MouseGestureController.enable();

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
  else {
    MouseGestureController.disable();
    RockerGestureController.disable();
    WheelGestureController.disable();
  }
}
