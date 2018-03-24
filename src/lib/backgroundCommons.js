'use strict'

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
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs)
      chrome.tabs.sendMessage(tab.id, data, () => {
        // catch error for restricted tabs
        chrome.runtime.lastError;
      });
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
  chrome.storage.local.set(data);
}


/**
 * returns the assigned action to a given gesture
 * or null if there isn't any matching gesture
 * requires global Config variable
 **/
function getActionByGesture (gesture) {
  if (Config && gesture) {
    for (let action in Config.Actions) {
      if (gesture === Config.Actions[action]) return action;
    }
  }
  return null;
}
