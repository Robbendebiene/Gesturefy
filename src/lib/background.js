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
 * listen for addon installation and update
 * update the configuration by merging the users config into the new default config
 * display notification and show github releases changelog on click
 **/
chrome.runtime.onInstalled.addListener((details) => {
  // change the right click behaviour, required for macos and linux users
  try {
    browser.browserSettings.contextMenuShowEvent.set({value: "mouseup"});
  }
  catch (error) {
    console.warn("Gesturefy was not able to change the context menu behaviour to mouseup.", error);
  }

  // on update
  if (details.reason === "update") {
    // update config
    chrome.storage.local.get(null, (storage) => {
      getJsonFileAsObject(chrome.runtime.getURL("res/config.json"), (config) => {
        // merge new config into old config
        Config = mergeDeep(config, storage);
        // save config
        saveData(Config);
        // propagate config for tabs that were not able to load the config
        propagateData({
          subject: "settingsChange",
          data: Config.Settings
        });
      });
    });

    if (!Config.Settings.General || Config.Settings.General.updateNotification) {
      // get manifest for new version number
      const manifest = chrome.runtime.getManifest();

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
  }
});
