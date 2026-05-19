import { displayNotification, getActiveTab } from "/core/utils/commons.mjs";

import ConfigManager from "/core/services/config-manager.mjs";

import Gesture from "/core/models/gesture.mjs";

import CommandStack from "/core/models/command-stack.mjs";

import GestureContextData from "/core/models/gesture-context-data.mjs";

import DefaultConfig from "/resources/json/defaults.json" with { type: 'json' };

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
    MouseGestures.add(Gesture.fromJSON(gesture));
  }

  RockerGestureLeft = CommandStack.fromJSON(Config.get("Settings.Rocker.leftMouseClick"));
  RockerGestureRight = CommandStack.fromJSON(Config.get("Settings.Rocker.rightMouseClick"));
  WheelGestureUp = CommandStack.fromJSON(Config.get("Settings.Wheel.wheelUp"));
  WheelGestureDown = CommandStack.fromJSON(Config.get("Settings.Wheel.wheelDown"));
}


/**
 * Message handler - listens for the content tab script messages
 * mouse gesture:
 * on gesture pattern change, respond gesture name
 * on gesture end, execute command
 * special gesture: execute related command
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.subject) {
    case "mouseGesture":
      handleMouseGestureCommandExecution(message, sender);
    break;

    case "rockerLeft":
    case "rockerRight":
    case "wheelDown":
    case "wheelUp":
      handleSpecialGestureCommandExecution(message, sender);
    break;
  }
});



let lastMatchingGesture = null;
let processing = false;
let queuedData = null;
let command = null;

/**
 * Handles messages for gesture changes
 * Sends a response with the label of the best matching gesture
 * If the gesture exceeds the deviation tolerance an empty string will be send
 **/
async function handleMouseGestureCommandExecution (message, sender, sendResponse) {
  if (message.data.event === 'start') {
    lastMatchingGesture = null;
    processing = false;
    queuedData = null;
    command = null;
  }

  queuedData = {message, sender};
  if (processing) return;
  // set gate variable to closed
  processing = true;
  while (queuedData !== null) {
    // consume the latest message
    const {message, sender} = queuedData;
    queuedData = null;
    // if the mismatch ratio exceeded the deviation tolerance bestMatchingGesture is null
    const bestMatchingGesture = getClosestGestureByPattern(
      message.data.pattern,
      MouseGestures,
      Config.get("Settings.Gesture.deviationTolerance"),
      Config.get("Settings.Gesture.matchingAlgorithm")
    );
    // if a new gesture matches
    if (lastMatchingGesture !== bestMatchingGesture) {
      // store new matching gesture (might be null)
      lastMatchingGesture = bestMatchingGesture;
      // get and store the first command that can execute successfully (might be null)
      command = await lastMatchingGesture?.commands.getFirstExecutableCommand(
        GestureContextData.fromMessage(sender, message.data.contextData),
      );
      // if it is an intermediate gesture event
      if (message.data.event === 'start' || message.data.event === 'update') {
        // send the matching gesture to the top frame name if any
        browser.tabs.sendMessage(
          sender.tab.id,
          { subject: "matchingGesture", data: command?.label },
          { frameId: 0 }
        );
      }
    }

    if (message.data.event === 'end') {
      command?.execute(
        GestureContextData.fromMessage(sender, message.data.contextData),
      );
    }
  }
  processing = false;
}


/**
 * Handles messages for rocker and wheel gestures
 * Executes the command of the corresponding wheel or rocker gesture
 * Passes the sender and source data to the executed command
 **/
function handleSpecialGestureCommandExecution (message, sender) {
  const context = GestureContextData.fromMessage(sender, message.data);
  // run command, pass the sender and source data
  switch (message.subject) {
    case "rockerLeft":
      RockerGestureLeft.execute(context); break;
    case "rockerRight":
      RockerGestureRight.execute(context); break;
    case "wheelUp":
      WheelGestureUp.execute(context); break;
    case "wheelDown":
      WheelGestureDown.execute(context); break;
  }
}


/**
 * Handle user script API call messages if user scripts are enabled.
 * Enable user scripts if the "userScripts" permission is granted.
 **/
if (browser.userScripts) {
  setupUserScripts();
}
browser.permissions.onAdded.addListener((permissions) => {
  if (permissions.permissions?.includes('userScripts')) {
    setupUserScripts();
  }
});
function setupUserScripts() {
  const ALLOWED_API_CALLS = {
    "tabs": new Set([
      "query", "create", "remove", "update", "duplicate", "goBack", "goForward", "move"
    ]),
    "windows": new Set([
      "get", "getCurrent", "create", "remove", "update"
    ]),
  };

  // configure default user scripts world to allow sending messages to background scripts
  // via browser.runtime.sendMessage()
  browser.userScripts.configureWorld({
    messaging: true,
  });

  // handle user script API call messages
  // authors of user scripts can also send messages so the messages are not trustworthy
  browser.runtime.onUserScriptMessage.addListener(message => {
    const { nameSpace, functionName, parameters } = message;
    // Ensure the message is requesting a call to an allowed API function
    if (!ALLOWED_API_CALLS.hasOwnProperty(nameSpace)) return;
    if (!ALLOWED_API_CALLS[nameSpace].has(functionName)) return;
    // call a background script api function by its given namespace, function name and parameters.
    // return the function promise so the message sender receives its value on resolve
    return browser[nameSpace][functionName](...parameters);
  });
}


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