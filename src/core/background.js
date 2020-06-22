import { displayNotification } from "/core/commons.js";

import ConfigManager from "/core/config-manager.js";

import Gesture from "/core/classes/gesture.js";

import Command from "/core/classes/command.js";

import { patternSimilarity } from "/core/pattern-tools.js";

import "/core/workarounds/iframe-mouse-gesture-view.background.js";

import "/core/workarounds/iframe-mouse-gesture-controller.background.js";

// temporary data migration
import "/core/migration/migration.js";

const Config = new ConfigManager("sync", browser.runtime.getURL("resources/json/defaults.json"));
      Config.autoUpdate = true;
      Config.loaded.then(updateGestures);
      Config.addEventListener("change", updateGestures);

const MouseGestures = new Set();

let RockerGestureLeft, RockerGestureRight, WheelGestureUp, WheelGestureDown;


/**
 * Updates the gestures and command objects on config changes
 **/
function updateGestures () {
  MouseGestures.clear();
  for (const gesture of Config.get("Gestures")) {
    MouseGestures.add(new Gesture(gesture));
  }

  RockerGestureLeft = new Command(Config.get("Settings.Rocker.leftMouseClick"));
  RockerGestureRight = new Command(Config.get("Settings.Rocker.rightMouseClick"));
  WheelGestureUp = new Command(Config.get("Settings.Wheel.wheelUp"));
  WheelGestureDown = new Command(Config.get("Settings.Wheel.wheelDown"));
}


/**
 * Message handler - listens for the content tab script messages
 * mouse gesture:
 * on gesture pattern change, respond gesture name
 * on gesture end, execute command
 * special gesture: execute related command
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // message subject to handler mapping
  const messageHandler = {
    "gestureChange":          handleMouseGestureCommandResponse,
    "gestureEnd":             handleMouseGestureCommandExecution,

    "rockerLeft":             handleSpecialGestureCommandExecuion,
    "rockerRight":            handleSpecialGestureCommandExecuion,
    "wheelUp":                handleSpecialGestureCommandExecuion,
    "wheelDown":              handleSpecialGestureCommandExecuion
  }
  // call subject corresponding message handler if existing
  if (message.subject in messageHandler) messageHandler[message.subject](message, sender, sendResponse);
});


/**
 * Handles messages for gesture changes
 * Sends a response with the label of the best matching gesture
 * If the gesture exceeds the deviation tolerance an empty string will be send
 **/
function handleMouseGestureCommandResponse (message, sender, sendResponse) {
  let bestMatchingGesture = null;
  let lowestMismatchRatio = 1;
  let gestureName = "";
  
  // get best matching gesture
  for (const gesture of MouseGestures) {
    const pattern = gesture.getPattern();
    const difference = patternSimilarity(message.data, pattern);
    if (difference < lowestMismatchRatio) {
      lowestMismatchRatio = difference;
      bestMatchingGesture = gesture;
    }
  }
  
  // get gesture label if the mismatch ratio does not exceed the deviation tolerance
  if (bestMatchingGesture && lowestMismatchRatio < Config.get("Settings.Gesture.deviationTolerance")) {
    gestureName = bestMatchingGesture.toString();
  }

  // send the matching gesture name
  sendResponse(gestureName);

  // if message was sent from a child frame also send a message to the top frame
  if (sender.frameId !== 0)  browser.tabs.sendMessage(
    sender.tab.id,
    { subject: "matchingGesture", data: gestureName },
    { frameId: 0 }
  );
}


/**
 * Handles messages for gesture end
 * Executes the command of the best matching gesture if it does not exceed the deviation tolerance
 * Passes the sender and source data to the executed command
 **/
function handleMouseGestureCommandExecution (message, sender, sendResponse) {
  // match here
  let bestMatchingGesture = null;
  let lowestMismatchRatio = 1;
  
  for (const gesture of MouseGestures) {
    const pattern = gesture.getPattern();
    const difference = patternSimilarity(message.data.pattern, pattern);
    if (difference < lowestMismatchRatio) {
      lowestMismatchRatio = difference;
      bestMatchingGesture = gesture;
    }
  }

  if (bestMatchingGesture && lowestMismatchRatio < Config.get("Settings.Gesture.deviationTolerance")) {
    const command = bestMatchingGesture.getCommand();
    // run command, apply the current sender object, pass the source data
    command.execute(sender, message.data);
  }
}


/**
 * Handles messages for rocker and wheel gestures
 * Executes the command of the corresponding wheel or rocker gesture
 * Passes the sender and source data to the executed command
 **/
function handleSpecialGestureCommandExecuion (message, sender, sendResponse) {
  // run command, pass the sender and source data
  switch (message.subject) {
    case "rockerLeft":
      RockerGestureLeft.execute(sender, message.data); break;
    case "rockerRight":
      RockerGestureRight.execute(sender, message.data); break;
    case "wheelUp":
      WheelGestureUp.execute(sender, message.data); break;
    case "wheelDown":
      WheelGestureDown.execute(sender, message.data); break;
  }
}


/**
 * This is used to simplify background script API calls from content scripts
 * Required for user script API calls
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.subject === "backgroundScriptAPICall") {
    try {
      // call a background script api function by its given namespace, function name and parameters.
      // return the function promise so the message sender receives its value on resolve
      return browser[message.data.nameSpace][message.data.functionName](...message.data.parameter);
    }
    catch (error) {
      console.warn("Unsupported call to backgfround script API.", error);
    }
  }
});


/**
 * Handle browser action click
 * Open Gesturefy options page
 **/
browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});


/**
 * Listen for addon installation and update
 * Show onboarding page on installation
 * Display notification and show github releases changelog on click
 **/
browser.runtime.onInstalled.addListener((details) => {
  // enable context menu on mouseup
  try {
    browser.browserSettings.contextMenuShowEvent.set({value: "mouseup"});
  }
  catch (error) {
    console.warn("Gesturefy was not able to change the context menu behaviour to mouseup.", error);
  }

  // run this code after the config is loaded
  Config.loaded.then(() => {

    switch (details.reason) {
      case "install":
        // show installation onboarding page
        browser.tabs.create({
          url: browser.runtime.getURL("/views/installation/index.html"),
          active: true
        });
      break;

      case "update":
        // show update notification
        if (Config.get("Settings.General.updateNotification")) {
          // get manifest for new version number
          const manifest = browser.runtime.getManifest();
          // show update notification and open changelog on click
          displayNotification(
            browser.i18n.getMessage('addonUpdateNotificationTitle', manifest.name),
            browser.i18n.getMessage('addonUpdateNotificationMessage', manifest.version),
            "https://github.com/Robbendebiene/Gesturefy/releases"
          );
        }
      break;    
    }
  });
});