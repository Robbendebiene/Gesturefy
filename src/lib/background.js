'use strict'

var Config = null;


/**
 * get JSON file as object from url
 * callback on XMLHttpRequest response with json object and the classic xhr object as arguments
 * argument is null if request or response failed
 * request url needs permissions in the addon manifest
 **/
function getJsonFileAsObject (url, callback) {
  let xhr = new XMLHttpRequest();
      xhr.overrideMimeType("application/json");
      xhr.responseType = "json";
      xhr.timeout = 4000;
      xhr.open('GET', url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) callback(xhr.response, xhr);
      }
      xhr.send();
}


/**
 * propagates a message to all exisiting tabs
 * is used to update style changes
 **/
function propagateData (data) {
  chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs)
        chrome.tabs.sendMessage(tab.id, data, () => {
          // catch error for restricted tabs
          chrome.runtime.lastError
        });
  });
}


/**
 * saves the given data to the storage
 **/
function saveData (data) {
  chrome.storage.local.set(data);
}


/**
 * returns the assigned action to a given gesture
 * or null if there isn't any matching gesture
 * requires global Config variable
 **/
function getActionByGesture (gesture) {
  if (Config) {
    for (let action in Config.Actions) {
      if (gesture === Config.Actions[action]) return action;
    }
  }
  return null;
}


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
      propagateData({Display: Config.Display});
    });
  }
  else Config = storage;
});


/**
 * listen for the content tab script messages
 * if gesture is not completed send response back on matching action
 * display notification if activated
 **/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let action = getActionByGesture(message.gesture);

  if (action) {
    if (message.completed) {
      // run action
      Actions[action](sender.tab);
    }
    else sendResponse({
      "action": browser.i18n.getMessage('actionName' + action)
    });
  }
});
