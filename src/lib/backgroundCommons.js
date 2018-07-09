'use strict'

/**
 * get JSON file as object from url
 * returns a promise which is fulfilled with the json object as a parameter
 * otherwise it's rejected
 * request url needs permissions in the addon manifest
 **/
function getJsonFileAsObject (url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.responseType = "json";
    xhr.timeout = 4000;
    xhr.open('GET', url, true);
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = reject;
    xhr.send();
  });
}



/**
 * check if string is an url
 **/
function isURL (string) {
  try {
    new URL(string);
  }
  catch (e) {
    return false;
  }
  return true;
}


/**
 * check if string is an url
 **/
function isDataURL (string) {
  // match data uri
  return /^(data:)([^;]*?)(;base64)?,(.*?)$/.test(string);
}


/**
 * converts a datat URI string to a blob file
 * inspired by: https://stackoverflow.com/a/11954337/3771196
 **/
function dataURItoBlob (dataURI) {
  const binary = atob(dataURI.split(',')[1]),
        mimeString = dataURI.substring(
          dataURI.indexOf(":") + 1,
          dataURI.indexOf(";")
        ),
        array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: mimeString});
}


/**
 * check if variable is an object
 * from https://stackoverflow.com/a/37164538/3771196
 **/
function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}


/**
 * deep merge two objects into a new one
 * from https://stackoverflow.com/a/37164538/3771196
 **/
function mergeDeep (target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = mergeDeep(target[key], source[key]);
      }
      else Object.assign(output, { [key]: source[key] });
    });
  }
  return output;
}


/**
 * propagates a message to all exisiting tabs
 * is used to update style changes
 **/
function propagateData (data) {
  const fetchTabs = browser.tabs.query({});
  fetchTabs.then((tabs) => {
    for (let tab of tabs) {
      const onMessage = browser.tabs.sendMessage(tab.id, data);
      onMessage.catch(error => browser.runtime.lastError);
    }
  });
}


/**
 * propagates a zoomChange message to a specific tab
 * this is used to inform tabs about their zoom factor
 **/
function propagateZoomFactor (tabId, zoom) {
  browser.tabs.sendMessage(
    tabId,
    {
      subject: "zoomChange",
      data: {zoomFactor: zoom}
    },
    { frameId: 0 }
  );
}


/**
 * saves the given data to the storage
 **/
function saveData (data) {
  browser.storage.sync.set(data);
}



/**
 * returns a promise which is fullfilled with the requested storage data
 * if kept empty the complete storage is fetched
 **/
function getData (...args) {
  if (args.length) {
    return browser.storage.sync.get(...args);
  }
  else {
    return browser.storage.sync.get(null);
  }
}


/**
 * returns the assigned gesture item to a given gesture
 * or undefined if there isn't any matching gesture
 * requires global Config variable
 **/
function getMatchingGesture (gesture) {
  return Config.Gestures.find((gestureItem) => {
    return gestureItem.gesture === gesture;
  });
}


/**
 * displays a browser notification
 * opens an URL on click if specified
 **/
function displayNotification (title, message, link) {
  // create notification
  const createNotification = browser.notifications.create("commandError", {
    "type": "basic",
    "iconUrl": "../res/img/iconx48.png",
    "title": title,
    "message": message
  });
  createNotification.then((notificationId) => {
    // if an URL is specified register an onclick listener
    if (link) browser.notifications.onClicked.addListener(function handleNotificationClick (id) {
      if (id === notificationId) {
        browser.tabs.create({
          url: link,
          active: true
        });
        // remove event listener
        browser.notifications.onClicked.removeListener(handleNotificationClick);
      }
    });
  });
}
