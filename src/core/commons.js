/**
 * get JSON file as object from url
 * returns a promise which is fulfilled with the json object as a parameter
 * otherwise it's rejected
 * request url needs permissions in the addon manifest
 **/
export function fetchJSONAsObject (url) {
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
 * get JSON file as object from url
 * returns a promise which is fulfilled with the json object as a parameter
 * otherwise it's rejected
 * request url needs permissions in the addon manifest
 **/
export function fetchHTMLAsFragment (url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "text";
    xhr.timeout = 4000;
    xhr.onerror = reject;
    xhr.ontimeout = reject;
    xhr.onload = () => resolve( document.createRange().createContextualFragment(xhr.response) );
    xhr.open('GET', url, true);
    xhr.send();
  });
}


/**
 * check if variable is an object
 * from https://stackoverflow.com/a/37164538/3771196
 **/
export function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}


/**
 * clone a serializeable javascript object
 **/
export function cloneObject (obj) {
  return JSON.parse(JSON.stringify(obj));
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
 * check if string is http/https url
 **/
export function isHTTPURL (string) {
  try {
    const url = new URL(string);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return true;
    }
  }
  catch (e) {
    return false;
  }
  return false;
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
 * displays a browser notification
 * opens an URL on click if specified
 **/
export function displayNotification (title, message, link) {
  // create notification
  const createNotification = browser.notifications.create({
    "type": "basic",
    "iconUrl": "../resources/img/iconx48.png",
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
 * returns the selected text, if no text is selected it will return an empty string
 * inspired by https://stackoverflow.com/a/5379408/3771196
 **/
export function getTextSelection () {
  // get input/textfield text selection
  if (document.activeElement &&
      typeof document.activeElement.selectionStart === 'number' &&
      typeof document.activeElement.selectionEnd === 'number') {
        return document.activeElement.value.slice(
          document.activeElement.selectionStart,
          document.activeElement.selectionEnd
        );
  }
  // get normal text selection
  return window.getSelection().toString();
}


/**
 * returns all available data of the given target
 * this data is necessary for some commands
 **/
export function getTargetData (target) {
	const data = {};

	data.target = {
		src: target.currentSrc || target.src || null,
		title: target.title || null,
		alt: target.alt || null,
		textContent: target.textContent.trim(),
		nodeName: target.nodeName
  };

  // get closest link
  const link = target.closest("a, area");
	if (link) {
		data.link = {
			href: link.href || null,
			title: link.title || null,
			textContent: link.textContent.trim()
		};
	}

	data.textSelection = getTextSelection();

	return data;
}


/**
 * returns the closest html parent element that matches the conditions of the provided test function or null
 **/
export function getClosestElement (startNode, testFunction) {
  let node = startNode;
	while (node !== null && !testFunction(node)) {
    node = node.parentElement;
  }
	return node;
}


/**
 * Smooth scrolling to a given y position
 * duration: scroll duration in milliseconds; default is 0 (no transition)
 * element: the html element that should be scrolled; default is the main scrolling element
 **/
export function scrollToY (y, duration = 0, element = document.scrollingElement) {
	// clamp y position between 0 and max scroll position
  y = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, y));

  // cancel if already on target position
  if (element.scrollTop === y) return;

  const cosParameter = (element.scrollTop - y) / 2;
  let scrollCount = 0, oldTimestamp = null;

  function step (newTimestamp) {
    if (oldTimestamp !== null) {
      // if duration is 0 scrollCount will be Infinity
      scrollCount += Math.PI * (newTimestamp - oldTimestamp) / duration;
      if (scrollCount >= Math.PI) return element.scrollTop = y;
      element.scrollTop = cosParameter + y + cosParameter * Math.cos(scrollCount);
    }
    oldTimestamp = newTimestamp;
    window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
}


/**
 * checks if the current window is framed or not
 **/
export function isEmbededFrame () {
  try {
    return window.self !== window.top;
  }
  catch (e) {
    return true;
  }
}


/**
 * checks if an element has a vertical scrollbar
 **/
export function isScrollableY (element) {
	const style = window.getComputedStyle(element);
	return !!(element.scrollTop || (++element.scrollTop && element.scrollTop--)) &&
				 style["overflow"] !== "hidden" && style["overflow-y"] !== "hidden";
}


/**
 * checks if the given element is a writable input element
 **/
export function isEditableInput (element) {
  const editableInputTypes = ["text", "textarea", "password", "email", "number", "tel", "url", "search"];
  return (
    (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')
    && (!element.type || editableInputTypes.includes(element.type))
    && !element.disabled
    && !element.readOnly
  );
}