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
    return browser.storage.sync.get(null);
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
