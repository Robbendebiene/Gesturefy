'use strict'

/**
 * calculates and returns the distance
 * between to points
 **/
function getDistance(x1, y1, x2, y2) {
	return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * translates the given vector to a direction letter
 * possible letter types are U,R,D and L
 **/
function getDirection(x1, y1, x2, y2) {
	if (Math.abs(y2 - y1) >= Math.abs(x2 - x1)) {
		if (y1 >= y2) return 'U';
		else return 'D';
	}
	else {
		if (x2 >= x1) return 'R';
		else return 'L';
	}
}

/**
 * converts a hex color either with hash or not
 * to an rgb color array
 **/
function hexToRGB (hex) {
	if (hex[0] === "#") hex = hex.slice(1);
	let arrayBuffer = new ArrayBuffer(4),
			view = new DataView(arrayBuffer);
			view.setUint32(0, parseInt(hex, 16), false);
	return new Uint8Array(arrayBuffer).slice(1);
}


/**
 * returns the href of a link or null
 * the target can also be a link nested element
 **/
function getLinkHref (target) {
  // bubble up the hierarchy from the target element
  while (target) {
    if (target.nodeName.toLowerCase() === "a" && "href" in target) {
      return target.href;
    }
    target = target.parentNode;
  }
  return null;
}


/**
 * returns the src of an image or null
 **/
function getImageSrc (target) {
  if (target.nodeName.toLowerCase() === "img" && "src" in target) {
    return target.src;
  }
  return null;
}



/**
 * returns the selected text, if no text is selected it will return an empty string
 * inspired by https://stackoverflow.com/a/5379408/3771196
 **/
function getTextSelection () {
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
 * checks if the current window is framed or not
 **/
function inIframe () {
  try {
    return window.self !== window.top;
  }
  catch (e) {
    return true;
  }
}
