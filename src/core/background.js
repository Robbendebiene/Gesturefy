import { displayNotification } from "/core/commons.js";

import * as Commands from "/core/commands.js";

import ConfigManager from "/core/config-manager.js";

import "/core/workarounds/zoom-controller.background.js";
import "/core/workarounds/iframe-mouse-gesture-controller.background.js";

const Config = new ConfigManager("sync", browser.runtime.getURL("resources/json/defaults.json"));
      Config.autoUpdate = true;

/**
 * message handler - listens for the content tab script messages
 * mouse gesture:
 * on gesture directions change, respond command name if existing
 * on gesture end, execute command if existing
 * special gesture: execute related command if existing
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

  function handleMouseGestureCommandResponse (message, sender, sendResponse) {
    // get the mapping gesture item by the given directions if any
    const gestureItem = Config.get("Gestures").find(gestureItem => gestureItem.gesture === message.data.gesture);
    if (gestureItem) {
      // respond with the matching command
      sendResponse({
        command: gestureItem.label || browser.i18n.getMessage('commandLabel' + gestureItem.command)
      });
    }
  }

  function handleMouseGestureCommandExecution (message, sender, sendResponse) {
    // get the mapping gesture item by the given directions if any
    const gestureItem = Config.get("Gestures").find(gestureItem => gestureItem.gesture === message.data.gesture);
    if (gestureItem && gestureItem.command in Commands) {
      // run command, apply the current tab, pass data and action specific settings
      Commands[gestureItem.command].call(sender.tab, message.data, gestureItem.settings);
    }
  }

  function handleSpecialGestureCommandExecuion (message, sender, sendResponse) {
    let gestureItem;
    switch (message.subject) {
      case "rockerLeft":
        gestureItem = Config.get("Settings.Rocker.leftMouseClick"); break;
      case "rockerRight":
        gestureItem = Config.get("Settings.Rocker.rightMouseClick"); break;
      case "wheelUp":
        gestureItem = Config.get("Settings.Wheel.wheelUp"); break;
      case "wheelDown":
        gestureItem = Config.get("Settings.Wheel.wheelDown"); break;
    }
    // run command, apply the current tab, pass data including the frameId and command specific settings
    if (gestureItem && gestureItem.command in Commands) {
      Commands[gestureItem.command].call(
        sender.tab,
        Object.assign({ frameId: sender.frameId }, message.data),
        gestureItem.settings
      );
    }
  }
});


/**
 * listen for addon installation and update
 * display notification and show github releases changelog on click
 **/
browser.runtime.onInstalled.addListener((details) => {
  // run this code after the config is loaded
  Config.loaded.then(() => {
    // change the right click behaviour, required for macos and linux users
    if (details.reason === "install" || details.reason === "update") {



    // temporary migration of TabToNewWindow command
    if (details.reason === "update") {
      const gestures = Config.get("Gestures");
      gestures.forEach((gestureItem) => {
        if (gestureItem.command === "TabToNewWindow") {
          gestureItem.command = "MoveTabToNewWindow";
        }
      });
      Config.set("Gestures", gestures);
    }



      try {
        browser.browserSettings.contextMenuShowEvent.set({value: "mouseup"});
      }
      catch (error) {
        console.warn("Gesturefy was not able to change the context menu behaviour to mouseup.", error);
      }
    }

    // show update notification
    if (details.reason === "update" && Config.get("Settings.General.updateNotification")) {
      // get manifest for new version number
      const manifest = browser.runtime.getManifest();
      // show update notification and open changelog on click
      displayNotification(
        browser.i18n.getMessage('addonUpdateNotificationTitle', manifest.name),
        browser.i18n.getMessage('addonUpdateNotificationMessage', manifest.version),
        "https://github.com/Robbendebiene/Gesturefy/releases"
      );
    }
  });
});
