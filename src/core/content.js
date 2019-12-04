import { isEmbededFrame, isEditableInput, isScrollableY, scrollToY, getClosestElement, getTargetData } from "/core/commons.js";

import ConfigManager from "/core/config-manager.js";

import MouseGestureController from "/core/modules/mouse-gesture-controller.js";

import RockerGestureController from "/core/modules/rocker-gesture-controller.js";

import WheelGestureController from "/core/modules/wheel-gesture-controller.js";

import MouseGestureInterface from "/core/interfaces/js/mouse-gesture-interface.js";

import "/core/interfaces/js/popup-command-interface.js";


// global variable containing the target html element for scripts injected by commands
window.TARGET = null;

// expose commons functions to scripts injected by commands like scrollTo
window.isEditableInput = isEditableInput;
window.isScrollableY = isScrollableY;
window.scrollToY = scrollToY;
window.getClosestElement = getClosestElement;

const IS_EMBEDED_FRAME = isEmbededFrame();

const Config = new ConfigManager("sync", browser.runtime.getURL("resources/json/defaults.json"));
      Config.autoUpdate = true;
      Config.loaded.then(main);
      Config.addEventListener("change", main);

// Define mouse gesture controller event listeners and connect them to the mouse gesture interface methods
// Also sends the appropriate messages to the background script
// movementX/Y cannot be used because the events returned by getCoalescedEvents() contain wrong values (Firefox Bug)

// the conversation to css screen coordinates via window.mozInnerScreenX is required
// to calculate the propper position in the main frame for coordinates from embeded frames 
// (required for popup commands and gesture interface)

MouseGestureController.addEventListener("start", (event, events) => {
  // expose target to global target variable
  window.TARGET = event.target;

  if (!IS_EMBEDED_FRAME) {
    MouseGestureInterface.initialize(event.clientX, event.clientY);
  }
  else {
    browser.runtime.sendMessage({
      subject: "mouseGestureStart",
      data: {
        x: event.clientX + window.mozInnerScreenX,
        y: event.clientY + window.mozInnerScreenY
      }
    });
  }

  if (Config.get("Settings.Gesture.Trace.display")) {
    // get coalesced events
    const coalescedEvents = [];
    // fallback if getCoalescedEvents is not defined + https://bugzilla.mozilla.org/show_bug.cgi?id=1450692
    for (const event of events) {
      if (event.getCoalescedEvents) coalescedEvents.push(...event.getCoalescedEvents());
    }
    if (!coalescedEvents.length) coalescedEvents.push(...events);

    if (!IS_EMBEDED_FRAME) {
      const points = coalescedEvents.map(event => ({ x: event.clientX, y: event.clientY }));
      MouseGestureInterface.updateGestureTrace(points);
    }
    else {
      // map points to screen wide css coordinates
      const points = coalescedEvents.map(event => ({ x: event.clientX + window.mozInnerScreenX, y: event.clientY + window.mozInnerScreenY }));
      browser.runtime.sendMessage({
        subject: "mouseGestureUpdate",
        data: {
          points: points
        }
      });
    }
  }
});


MouseGestureController.addEventListener("update", (event, events) => {
  if (Config.get("Settings.Gesture.Trace.display")) {
    // get coalesced events
    // fallback if getCoalescedEvents is not defined + https://bugzilla.mozilla.org/show_bug.cgi?id=1450692
    const coalescedEvents = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    if (!coalescedEvents.length) coalescedEvents.push(event);

    if (!IS_EMBEDED_FRAME) {
      const points = coalescedEvents.map(event => ({ x: event.clientX, y: event.clientY }));
      MouseGestureInterface.updateGestureTrace(points);
    }
    else {
      // map points to global screen wide coordinates
      const points = coalescedEvents.map(event => ({ x: event.clientX + window.mozInnerScreenX, y: event.clientY + window.mozInnerScreenY }));
      browser.runtime.sendMessage({
        subject: "mouseGestureUpdate",
        data: {
          points: points
        }
      });
    }

    // !! currently no gesture update data is send to the background script !!
    // !! evaluate how often a change message shuld be send !!
    browser.runtime.sendMessage({
      subject: "gestureChange",
      data: ""
    });
  }
});


MouseGestureController.addEventListener("timeout", (events) => {
  // close overlay
  if (!IS_EMBEDED_FRAME) MouseGestureInterface.terminate();
  else browser.runtime.sendMessage({
    subject: "mouseGestureEnd"
  });
});


MouseGestureController.addEventListener("end", (event, events) => {
  // if the current target was removed from dom trace a new element at the starting point
  if (!document.body.contains(window.TARGET)) {
    window.TARGET = document.elementFromPoint(events[0].clientX, events[0].clientY);
  }

  const data = getTargetData(window.TARGET);
        // !! currently no gesture end data is send to the background script !!
        data.gesture = "XXX";
        // transform coordiantes to css screen coordinates
        data.mousePosition = {
          x: event.clientX + window.mozInnerScreenX,
          y: event.clientY + window.mozInnerScreenY
        };

  // send data to background script
  browser.runtime.sendMessage({
    subject: "gestureEnd",
    data: data
  });

  // close overlay
  if (!IS_EMBEDED_FRAME) MouseGestureInterface.terminate();
  else browser.runtime.sendMessage({
    subject: "mouseGestureEnd"
  });
});

// add message listeners to main frame
// these handle the overlay messages send from embeded frames

if (!IS_EMBEDED_FRAME) {
  browser.runtime.onMessage.addListener((message) => {
    switch (message.subject) {
      case "mouseGestureStart":
        // remap points to client wide css coordinates
        MouseGestureInterface.initialize(
          message.data.x - window.mozInnerScreenX,
          message.data.y - window.mozInnerScreenY
        );
      break;
  
      case "mouseGestureUpdate":
        // remap points to client wide css coordinates
        message.data.points.forEach(point => {
          point.x -= window.mozInnerScreenX;
          point.y -= window.mozInnerScreenY;
        });

        MouseGestureInterface.updateGestureTrace(message.data.points);
      break;
  
      case "mouseGestureEnd":
        MouseGestureInterface.terminate();
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
  // cancel mouse gesture and terminate overlay in case it got triggered
  MouseGestureController.cancel();
  // close overlay
  MouseGestureInterface.terminate();

  // gather specifc data
  const data = getTargetData(event.target);
        data.mousePosition = {
          x: event.clientX + window.mozInnerScreenX,
          y: event.clientY + window.mozInnerScreenY
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
    MouseGestureController.timeoutActive = Config.get("Settings.Gesture.Timeout.active");
    MouseGestureController.timeoutDuration = Config.get("Settings.Gesture.Timeout.duration");

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
  // if url is blacklisted disable everything
  else {
    MouseGestureController.disable();
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