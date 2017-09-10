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
              {frameId: sender.frameId}
            )
          },
          { frameId: 0 }
        );
      }
    break;

    case "gestureChange":
    case "gestureEnd":
      let action = getActionByGesture(message.data.gesture);

      if (action) {
        if (message.subject === "gestureChange") {
          // respond with the matching action
          sendResponse({
            action: browser.i18n.getMessage('actionName' + action)
          });
        }
        else {
          // run action and apply the current tab
          Actions[action].call(sender.tab, message.data);
        }
      }
    break;

    case "rockerLeft":
      if (Config.Settings.Rocker.leftMouseClick in Actions)
        // run action, apply the current tab and pass data including the frameId
        Actions[Config.Settings.Rocker.leftMouseClick].call(sender.tab, Object.assign(
          {frameId: sender.frameId},
          message.data
        ));
    break;

    case "rockerRight":
      if (Config.Settings.Rocker.rightMouseClick in Actions)
        // run action, apply the current tab and pass data including the frameId
        Actions[Config.Settings.Rocker.rightMouseClick].call(sender.tab, Object.assign(
          {frameId: sender.frameId},
          message.data
        ));
    break;
  }
});


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
    if (['1.0.7', '1.0.6', '1.0.5', '1.0.4', '1.0.3', '1.0.2', '1.0.1', '1.0.0'].includes(details.previousVersion))
    chrome.notifications.create("addonUpdate", {
      "priority": 2,
      "type": "basic",
      "iconUrl": "../res/icons/iconx48.png",
      "title": "SOME GESTUREFY SETTINGS MAY GOT LOST!",
      "message": "Due to the new update which brought some config changes, your settings may got lost. Click to view the changelog."
    });
    else
    chrome.notifications.create("addonUpdate", {
      "type": "basic",
      "iconUrl": "../res/icons/iconx48.png",
      "title": browser.i18n.getMessage('addonUpdateNotificationTitle', manifest.name),
      "message": browser.i18n.getMessage('addonUpdateNotificationMessage', manifest.version)
    });
  }
});
