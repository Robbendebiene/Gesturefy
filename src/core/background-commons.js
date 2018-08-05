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
    xhr.onerror = reject;
    xhr.ontimeout = reject;
    xhr.onload = () => resolve(xhr.response);
    xhr.open('GET', url, true);
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
  return (item && typeof item === 'object' && !Array.isArray(item));
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
    return browser.storage.sync.get();
  }
}


/**
 * displays a browser notification
 * opens an URL on click if specified
 **/
function displayNotification (title, message, link) {
  // create notification
  const createNotification = browser.notifications.create({
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


/**
 * this function modiefies the first object by adding new keys from the second object but does not update any existing keys
 * object keys starting with an uppercase letter will be treated as separate objects
 * and the same function will be applied recursively to them
 * retruns the modified first object
 **/
function mergeObjectKeys (oldObject, newObject) {
  // skip arrays
  if (Array.isArray(oldObject) || Array.isArray(newObject)) return;
  Object.keys(newObject).forEach((key) => {
    if (key in oldObject) {
      if (key[0] === key[0].toUpperCase() && isObject(oldObject[key]) && isObject(newObject[key])) {
        mergeObjectKeys(oldObject[key], newObject[key]);
      }
    }
    else oldObject[key] = newObject[key];
  });
  return oldObject;
}
