import { isIframe, isEditableInput, isScrollableY, scrollToY, getClosestElement, getTargetData } from "/core/commmons.js";

import ConfigManager from "/core/config-manager.js";

import MouseGestureController from "/core/modules/mouse-gesture-controller.js";

import IframeMouseGestureController from "/core/workarounds/iframe-mouse-gesture-controller.content.js";

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

MouseGestureController.addEventListener("abort", (events) => {
  // call reset insted of terminate so the overlay can catch the mouseup/contextmenu for iframes
  MouseGestureInterface.reset();
  // reset iframe target data variable
  iframeTargetData = null;
});

MouseGestureController.addEventListener("end", (events, directions) => {
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

    MouseGestureInterface.gestureTraceLineColor = Config.get("Settings.Gesture.Trace.Style.strokeStyle");
    MouseGestureInterface.gestureTraceLineWidth = Config.get("Settings.Gesture.Trace.Style.lineWidth");
    MouseGestureInterface.gestureTraceLineGrowth = Config.get("Settings.Gesture.Trace.Style.lineGrowth");
    MouseGestureInterface.gestureTraceOpacity = Config.get("Settings.Gesture.Trace.Style.opacity");
    MouseGestureInterface.gestureCommandFontSize = Config.get("Settings.Gesture.Command.Style.fontSize");
    MouseGestureInterface.gestureCommandTextColor = Config.get("Settings.Gesture.Command.Style.color");
    MouseGestureInterface.gestureCommandBackgroundColor = Config.get("Settings.Gesture.Command.Style.backgroundColor");
    MouseGestureInterface.gestureCommandBackgroundOpacity = Config.get("Settings.Gesture.Directions.Style.backgroundOpacity");
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