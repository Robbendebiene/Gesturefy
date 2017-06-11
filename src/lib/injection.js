'use strict'

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


// if window in iframe, propagate messages to the top most window on mousemove and right mouse button holded
// message contains the current screen coordinates and target data
if (inIframe()) {
	document.addEventListener('mousemove', (event) => {

		if (event.buttons === 2) {
			window.top.postMessage({
          screenX: event.screenX,
          screenY: event.screenY,
          href: getLinkHref(event.target),
          src: getImageSrc(event.target),
          selection: getTextSelection()
        }, "*"
      );
		}

	}, true);
}
