/**
 * check if variable is an object
 * from https://stackoverflow.com/a/37164538/3771196
 **/
export function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}


/**
 * converts a rgb color to an hex color string
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 **/
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


/**
 * converts a hex color either with hash or not to an rgb color array
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 **/
export function hexToRGB(hex) {
  if (hex[0] === "#") hex = hex.slice(1);
  const bigint = parseInt(hex, 16);
  return [ (bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255 ];
}


/**
 * calculates and returns the distance
 * between to points
 **/
export function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}


/**
 * converts a pressed button value to its trigger button equivalent
 * returns -1 if the value cannot be converted
 **/
export function toSingleButton (pressedButton) {
  if (pressedButton === 1) return 0;
  else if (pressedButton === 2) return 2;
  else if (pressedButton === 4) return 1;
  else return -1;
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
 * remove special characters from a given string to create a valid file name
 **/
export function sanitizeFilename (filename) {
  const illegalRegex = /[\/\?<>\\:\*\|"]/g;
  const controlRegex = /[\x00-\x1f\x80-\x9f]/g;
  const reservedRegex = /^\.+$/;
  const windowsReservedRegex = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
  const windowsTrailingRegex = /[\. ]+$/;
  const multipleSpacesRegex = /\s\s+/g;

  return filename.replace(illegalRegex, '')
        .replace(controlRegex, '')
        .replace(reservedRegex, '')
        .replace(windowsReservedRegex, '')
        .replace(windowsTrailingRegex, '')
        .replace(multipleSpacesRegex, ' ' );
}


/**
 * converts a data URI string to a blob file
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
 * displays a browser notification
 * opens an URL on click if specified
 **/
export function displayNotification (title, message, link) {
  // create notification
  const createNotification = browser.notifications.create({
    "type": "basic",
    "iconUrl": "../resources/img/icon.svg",
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
 * returns the active tab of the currently active window
 **/
export async function getActiveTab() {
  return (await browser.tabs.query({
    active: true,
    currentWindow: true,
  }))[0];
}


/**
 * checks if the current window is framed or not
 **/
export function isEmbeddedFrame () {
  try {
    return window.self !== window.top;
  }
  catch (e) {
    return true;
  }
}


/**
 * Returns the direction difference of 2 vectors
 * Range: (-1, 0, 1]
 * 0 = same direction
 * 1 = opposite direction
 * + and - indicate if the direction difference is counter clockwise (+) or clockwise (-)
 **/
export function vectorDirectionDifference (V1X, V1Y, V2X, V2Y) {
  // calculate the difference of the vectors angle
  let angleDifference = Math.atan2(V1X, V1Y) - Math.atan2(V2X, V2Y);
  // normalize interval to [PI, -PI)
  if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
  else if (angleDifference <= -Math.PI) angleDifference += 2 * Math.PI;
  // shift range from [PI, -PI) to [1, -1)
  return angleDifference / Math.PI;
}