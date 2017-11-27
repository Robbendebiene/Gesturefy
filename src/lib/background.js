'use strict'

var Config = null;

/**
 * get necessary data from storage
 * if storage is empty write default data to storage
 * save data to the global config variable
 **/
chrome.storage.local.get(null, (storage) => {
  if (Object.keys(storage).length === 0) {
    // get data from local json and write it to the storage
    getJsonFileAsObject(chrome.runtime.getURL("res/config.json"), (config) => {
      Config = config;
      saveData(config);
      // propagate config for tabs that were not able to load the config
      propagateData({
        subject: "settingsChange",
        data: Config.Settings
      });
    });
  }
  else Config = storage;
});


/**
 * message handler - listens for the content tab script messages
 * mouse gesture:
 * if gesture started in a frame send message to main page
 * if gesture is not completed send response back on matching action
 **/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // handle the different incomming messages by their subjects
  switch (message.subject) {

    case "gestureFrameMousedown":
    case "gestureFrameMousemove":
    case "gestureFrameMouseup":
      // message was sent by frame
      if (sender.frameId > 0) {
        // forwards the message to the main page containing all the data that was previously sent including the frameId
        chrome.tabs.sendMessage(
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
      let action = getActionByGesture(message.data.gesture);

      if (action) {
        if (message.subject === "gestureChange") {
          // respond with the matching action
          sendResponse({
            action: browser.i18n.getMessage('actionName' + action)
          });
        }
        else {
          // run action, apply the current tab, pass data and action specific settings
          Actions[action].call(sender.tab, message.data, Config.Settings.Actions);
        }
      }
    } break;

    case "rockerLeft":
    case "rockerRight":
    case "wheelUp":
    case "wheelDown": {
        let action;
        switch (message.subject) {
          case "rockerLeft":
            action = Config.Settings.Rocker.leftMouseClick; break;
          case "rockerRight":
            action = Config.Settings.Rocker.rightMouseClick; break;
          case "wheelUp":
            action = Config.Settings.Wheel.wheelUp; break;
          case "wheelDown":
            action = Config.Settings.Wheel.wheelDown; break;
        }
        // run action, apply the current tab, pass data including the frameId and action specific settings
        if (action in Actions) Actions[action].call(sender.tab, Object.assign(
          { frameId: sender.frameId },
          message.data,
        ), Config.Settings.Actions);
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
 * listen for addon update
 * update the configuration by merging the users config into the new default config
 * display notification a notification
 * show github releases changeleog un notification click
 **/
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    // update config
    chrome.storage.local.get(null, (storage) => {
      getJsonFileAsObject(chrome.runtime.getURL("res/config.json"), (config) => {
        // merge new config into old config
        Config = mergeDeep(config, storage);



        // TEMPORARY
        // remove old actions form users config on update!
        try {
          if ("NewTabAfter" in Config.Actions) delete Config.Actions.NewTabAfter;
          if ("NewTabBefore" in Config.Actions) delete Config.Actions.NewTabBefore;
        }
        catch (e) {}




        saveData(Config);
        // propagate config for tabs that were not able to load the config
        propagateData({Settings: Config.Settings});
      });
    });

    // get manifest for new version number
    let manifest = chrome.runtime.getManifest();

    // open changelog on notification click
    chrome.notifications.onClicked.addListener(
      function handleNotificationClick (id) {
        if (id === "addonUpdate") {
          chrome.tabs.create({
            url: "https://github.com/Robbendebiene/Gesturefy/releases",
            active: true
          })
          // remove the event listener
          chrome.notifications.onClicked.removeListener(handleNotificationClick);
        }
      }
    );
    // create update notification
    chrome.notifications.create("addonUpdate", {
      "type": "basic",
      "iconUrl": "../res/icons/iconx48.png",
      "title": browser.i18n.getMessage('addonUpdateNotificationTitle', manifest.name),
      "message": browser.i18n.getMessage('addonUpdateNotificationMessage', manifest.version)
    });
  }
});



// TEMPORARY
// display alert message and change default mouse button to left
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.getPlatformInfo((plaformInfo) => {
      chrome.runtime.getBrowserInfo((browserInfo) => {
        if (browserInfo.version === "57.0" && (plaformInfo.os === "linux" || plaformInfo.os === "mac")) {
          Config.Settings.Gesture.mouseButton = 1;
          saveData(Config);
          // propagate config for tabs that were not able to load the config
          propagateData({
            subject: "settingsChange",
            data: Config.Settings
          });

          // create warning notification
          chrome.notifications.create("installationWarning", {
            "type": "basic",
            "iconUrl": "../res/icons/iconx48.png",
            "title": "WARNING!",
            "message": "On Linux and MacOS the right mouse button will only work on the latest Firefox 58 or above."
          });
        }
      });
    });
  }
});


// move this to the onInstalled event later
try {
  if (browser.browserSettings.contextMenuShowEvent) browser.browserSettings.contextMenuShowEvent.set({value: "mouseup"});
}
catch (e) {}
