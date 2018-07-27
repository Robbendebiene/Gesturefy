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
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
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
 * deep merge two objects into a new one
 * from https://stackoverflow.com/a/37164538/3771196
 **/

//isObject

// only adds missing and new keys
function updateRecursive (oldParent, newParent) {
  Object.keys(newParent).forEach((key) => {
    if (key in oldParent) {
      if (key[0] === key[0].toUpperCase()) {
        updateRecursive(oldParent[key], newParent[key]);
      }
    }
    else oldParent[key] = newParent[key];
  });
}
