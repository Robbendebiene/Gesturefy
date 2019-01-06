/**
 * get JSON file as object from url
 * returns a promise which is fulfilled with the json object as a parameter
 * otherwise it's rejected
 * request url needs permissions in the addon manifest
 **/
export function getJsonFileAsObject (url) {
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
 * helper function do get property by string concatenated with dots
 **/
export function getObjectPropertyByString (object, string) {
  // get property from object hierarchy https://stackoverflow.com/a/33397682/3771196
  return string.split('.').reduce((o,i) => o[i], object);
}


/**
 * Checks if two or more objects have the same enumerable property keys
 * the order of the property keys is ignored
 **/
export function hasSameObjectKeys (firstObject, ...comparisonObjects) {
  const firstObjectKeys = Object.keys(firstObject);
  for (let nthObject of comparisonObjects) {
    const nthObjectKeys = Object.keys(nthObject);
    if (
      nthObjectKeys.length !== firstObjectKeys.length ||
      !firstObjectKeys.every((value) => nthObjectKeys.includes(value))
    ) return false;
  }
  return true;
}


/**
 * check if variable is an object
 * from https://stackoverflow.com/a/37164538/3771196
 **/
export function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}


/**
 * clone a standard javascript object into another window
 **/
export function cloneObjectInto (obj, win) {
  const string = JSON.stringify(obj);
  return win.JSON.parse(string);
}


/**
 * returns a promise which is fullfilled with the requested storage data
 * if kept empty the complete storage is fetched
 **/
export function getData (...args) {
  if (args.length) {
    return browser.storage.sync.get(...args);
  }
  else {
    return browser.storage.sync.get();
  }
}


/**
 * saves the given data to the storage
 **/
export function saveData (data) {
  return browser.storage.sync.set(data);
}


/**
 * calculates and returns the distance
 * between to points
 **/
export function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}


/**
 * translates the given vector to a direction letter
 * possible letter types are U,R,D and L
 **/
export function getDirection(x1, y1, x2, y2) {
  if (Math.abs(y2 - y1) >= Math.abs(x2 - x1)) {
    return y1 >= y2 ? 'U' : 'D';
  }
  else {
    return x2 >= x1 ? 'R' : 'L';
  }
}


/**
 * checks if a trigger button matches its equivalent pressed button value
 **/
export function isEquivalentButton (triggerButton, pressedButton) {
  return (triggerButton === 0 && pressedButton === 1) ||
         (triggerButton === 1 && pressedButton === 4) ||
         (triggerButton === 2 && pressedButton === 2);
}


/**
 * check if string is an url
 **/
export function isURL (string) {
  try {
    new URL(string);
  }
  catch (e) {
    return false;
  }
  return true;
}


/**
 * check if string is a non-privileged url
 **/
export function isLegalURL (string) {
  const privilegedURLProtocols = ["chrome:", "about:", "data:", "javascript:", "file:"];
  const exceptedURLs = ["about:blank"];

  try {
    const url = new URL(string);
    if (privilegedURLProtocols.includes(url.protocol) && !exceptedURLs.includes(url.href)) {
      return false;
    }
  }
  catch (e) {
    return false;
  }
  return true;
}


/**
 * converts a datat URI string to a blob file
 * inspired by: https://stackoverflow.com/a/11954337/3771196
 **/
export function dataURItoBlob (dataURI) {
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
 * propagates a zoomChange message to a specific tab
 * this is used to inform tabs about their zoom factor
 **/
export function propagateZoomFactor (tabId, zoom) {
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
 * displays a browser notification
 * opens an URL on click if specified
 **/
export function displayNotification (title, message, link) {
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
export function mergeObjectKeys (oldObject, newObject) {
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
