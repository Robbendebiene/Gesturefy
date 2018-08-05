'use strict'

let Config = null;

/**
 * get the addon configuration from storage
 * save it to the global Config variable
 **/
const fetchConfig = getData();
fetchConfig.then((storage) => {
  Config = storage;
});


/**
 * listen for storage changes
 * save changes to the global Config variable
 **/
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    Object.entries(changes).forEach(([key, value]) => {
      Config[key] = value.newValue;
    });
  }
});


/**
 * message handler - listens for the content tab script messages
 * mouse gesture:
 * if gesture started in a frame send message to main page
 * if gesture is not completed send response back on matching action
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // handle the different incomming messages by their subjects
  switch (message.subject) {

    case "gestureFrameMousedown":
    case "gestureFrameMousemove":
    case "gestureFrameMouseup":
      // message was sent by frame
      if (sender.frameId > 0) {
        // forwards the message to the main page containing all the data that was previously sent including the frameId
        browser.tabs.sendMessage(
          sender.tab.id,
          {
            subject: message.subject,
            data: Object.assign(
              message.data,
              { frameId: sender.frameId }
            )
          },
          { frameId: 0 }
        );
      }
    break;

    case "gestureChange":
    case "gestureEnd": {
      // get the mapping gesture item by the given directions if any
      const gestureItem = Config.Gestures.find(gestureItem => gestureItem.gesture === message.data.gesture);

      if (gestureItem) {
        if (message.subject === "gestureChange") {
          // respond with the matching command
          sendResponse({
            command: gestureItem.label || browser.i18n.getMessage('commandLabel' + gestureItem.command)
          });
        }
        else {
          // run command, apply the current tab, pass data and action specific settings
          Commands[gestureItem.command].call(sender.tab, message.data, gestureItem.settings);
        }
      }
    } break;

    case "rockerLeft":
    case "rockerRight":
    case "wheelUp":
    case "wheelDown": {
      let gestureItem;
      switch (message.subject) {
        case "rockerLeft":
          gestureItem = Config.Settings.Rocker.leftMouseClick; break;
        case "rockerRight":
          gestureItem = Config.Settings.Rocker.rightMouseClick; break;
        case "wheelUp":
          gestureItem = Config.Settings.Wheel.wheelUp; break;
        case "wheelDown":
          gestureItem = Config.Settings.Wheel.wheelDown; break;
      }
      // run command, apply the current tab, pass data including the frameId and command specific settings
      if (gestureItem.command in Commands) {
        Commands[gestureItem.command].call(
          sender.tab,
          Object.assign({ frameId: sender.frameId }, message.data),
          gestureItem.settings
        );
      }
    } break;

    case "zoomFactorRequest": {
      const zoomQuery = browser.tabs.getZoom(sender.tab.id);
      zoomQuery.then((zoom) => propagateZoomFactor(sender.tab.id, zoom));
    } break;
  }
});


/**
 * propagate zoom factor on zoom change
 * necessary to calculate the correct mouse position for iframes
 **/
browser.tabs.onZoomChange.addListener((info) => propagateZoomFactor(info.tabId, info.newZoomFactor));


/**
 * listen for addon installation and update
 * update the configuration by merging the users config into the new default config
 * display notification and show github releases changelog on click
 **/
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    // migrate config from version 1.0
    if (details.previousVersion && details.previousVersion[0] === "1") {
      configMigrationHandler();
    }
    else {
      const fetchStorage = getData();
      // get default configuration
      const fetchDefaults = getJsonFileAsObject(browser.runtime.getURL("res/json/defaults.json"));
      Promise.all([fetchStorage, fetchDefaults]).then((values) => {
        // merge default config into old config
        Config = mergeObjectKeys(values[0], values[1]);
        // save config
        saveData(values[0]);
      });
    }

    // show update notification
    if (details.reason === "update" && Config && Config.Settings && Config.Settings.General.updateNotification) {
      // get manifest for new version number
      const manifest = browser.runtime.getManifest();
      // show update notification and open changelog on click
      displayNotification(
        browser.i18n.getMessage('addonUpdateNotificationTitle', manifest.name),
        browser.i18n.getMessage('addonUpdateNotificationMessage', manifest.version),
        "https://github.com/Robbendebiene/Gesturefy/releases"
      );
    }

    // change the right click behaviour, required for macos and linux users
    try {
      browser.browserSettings.contextMenuShowEvent.set({value: "mouseup"});
    }
    catch (error) {
      console.warn("Gesturefy was not able to change the context menu behaviour to mouseup.", error);
    }
  }
});
