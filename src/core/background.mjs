import { displayNotification, getActiveTab } from "/core/utils/commons.mjs";

import ConfigManager from "/core/services/config-manager.mjs";

import Gesture from "/core/models/gesture.mjs";

import Command from "/core/models/command.mjs";

import DefaultConfig from "/resources/configs/defaults.mjs";

import ExclusionService from "/core/services/exclusion-service.mjs";

import HostPermissionService from "/core/services/host-permission-service.mjs";

import { getClosestGestureByPattern } from "/core/utils/matching-algorithms.mjs";

import "/core/helpers/message-router.mjs";

// temporary data migration
import "/core/migration.mjs";

const Config = new ConfigManager({
  defaults: DefaultConfig,
  autoUpdate: true
});
Config.loaded.then(updateVariablesOnConfigChange);
Config.addEventListener("change", updateVariablesOnConfigChange);

const Exclusions = new ExclusionService();
const HostPermissions = new HostPermissionService();

const MouseGestures = new Set();

let RockerGestureLeft, RockerGestureRight, WheelGestureUp, WheelGestureDown;


/**
 * Updates the gesture objects and command objects on config changes
 **/
function updateVariablesOnConfigChange () {
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

    "rockerLeft":             handleSpecialGestureCommandExecution,
    "rockerRight":            handleSpecialGestureCommandExecution,
    "wheelUp":                handleSpecialGestureCommandExecution,
    "wheelDown":              handleSpecialGestureCommandExecution
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
  const bestMatchingGesture = getClosestGestureByPattern(
    message.data,
    MouseGestures,
    Config.get("Settings.Gesture.deviationTolerance"),
    Config.get("Settings.Gesture.matchingAlgorithm")
  );

  // if the mismatch ratio exceeded the deviation tolerance bestMatchingGesture is null
  const gestureName = bestMatchingGesture?.toString();

  // send the matching gesture to the top frame name if any
  browser.tabs.sendMessage(
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
  const bestMatchingGesture = getClosestGestureByPattern(
    message.data.pattern,
    MouseGestures,
    Config.get("Settings.Gesture.deviationTolerance"),
    Config.get("Settings.Gesture.matchingAlgorithm")
  );

  if (bestMatchingGesture) {
    const command = bestMatchingGesture.getCommand();
    // run command, apply the current sender object, pass the source data
    command.execute(sender, message.data.contextData);
  }
}


/**
 * Handles messages for rocker and wheel gestures
 * Executes the command of the corresponding wheel or rocker gesture
 * Passes the sender and source data to the executed command
 **/
function handleSpecialGestureCommandExecution (message, sender, sendResponse) {
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
      console.warn("Unsupported call to background script API.", error);
    }
  }
});


/**
 * Listen for tab, permission and exclusion changes
 * Set the browser action icon to enabled or disabled state
 **/
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active) {
    handleBrowserActionIcon();
  }
}, { properties: ["url", "status"] });
browser.tabs.onActivated.addListener(handleBrowserActionIcon);
HostPermissions.addEventListener("change", handleBrowserActionIcon);
Exclusions.loaded.then(handleBrowserActionIcon);
Exclusions.addEventListener("change", handleBrowserActionIcon);
// on initial run
handleBrowserActionIcon();

async function handleBrowserActionIcon() {
  const activeTab = await getActiveTab();
  const hasPermission =
    activeTab.url != null &&
    Exclusions.isEnabledFor(activeTab.url) &&
    (await HostPermissions.hasTabPermission(activeTab));

  browser.action.setIcon({
    path: hasPermission
      ? "/resources/img/icon.svg"
      : "/resources/img/icon_deactivated.svg"
  });
}


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