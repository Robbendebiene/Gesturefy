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
 * returns the closest hierarchical link node or null of given element
 **/
function getClosestLink (node) {
  // bubble up the hierarchy from the target element
  while (node !== null && node.nodeName.toLowerCase() !== "a")
    node = node.parentElement;
  return node;
}


/**
 * returns all available data of the given target
 * this data is used by some background actions
 **/
function getTargetData(target) {
	let data = {};

	data.target = {
		src: target.src || null,
		title: target.title || null,
		textContent: target.textContent.trim(),
		nodeName: target.nodeName
	};

	let link = getClosestLink(target);
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


/**
 * checkes if the given url is a subset of the current url or equal
 **/
function matchesCurrentURL (urlPattern) {
	// match special regex characters
	let pattern = urlPattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, (match) => {
		// replace * with .* -> matches anything 0 or more times, else escape character
		return match === '*' ? '.*' : '\\'+match;
	});
	// ^ matches beginning of input and $ matches ending of input
	return new RegExp('^'+pattern+'$').test(window.location.href);
}


/**
 * smooth scroll to a specific y position by a given duration
 **/
function scrollToY (element, y, duration) {
	// if y coordinate is not reachable round it down/up
	y = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, y));
	let cosParameter = (element.scrollTop - y) / 2,
			scrollCount = 0,
			oldTimestamp = performance.now();
	function step (newTimestamp) {
		// abs() because sometimes the difference is negative; if duration is 0 scrollCount will be Infinity
		scrollCount += Math.PI * Math.abs(newTimestamp - oldTimestamp) / duration;
		if (scrollCount >= Math.PI || element.scrollTop === y) return element.scrollTop = y;
		element.scrollTop = cosParameter + y + cosParameter * Math.cos(scrollCount);
		oldTimestamp = newTimestamp;
		window.requestAnimationFrame(step);
	}
	window.requestAnimationFrame(step);
}


/**
 * returns the closest scrollable html element by a given start element or null
 **/
function closestScrollableY (node) {
	while (node !== null && !hasVerticalScrollbar(node))
		node = node.parentElement;
	return node;
}


/**
 * checks if an element has a vertical scrollbar
 **/
function hasVerticalScrollbar (element) {
	let style = window.getComputedStyle(element);
	return !!(element.scrollTop || (++element.scrollTop && element.scrollTop--)) &&
				 style["overflow"] !== "hidden" && style["overflow-y"] !== "hidden";
}
