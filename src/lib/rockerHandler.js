'use strict'

/**
 * RockerHandler "singleton" class using the modul pattern
 * detects gesture and reports it to the background script
 * on default the handler is disabled and must be enabled via enable()
 **/
const RockerHandler = (function() {

// public variables and methods

  let modul = {};

	/**
	 * Add the document event listener
	 **/
  modul.enable = function enable () {
    document.addEventListener('mousedown', handleMousedown, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('contextmenu', handleContextmenu, true);
  };


	/**
	 * Remove the event listeners and resets the handler
	 **/
	modul.disable = function disable () {
    lastMouseDownButton = -1;
    document.removeEventListener('mousedown', handleMousedown, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('contextmenu', handleContextmenu, true);
  }

// private variables and methods

  let lastMouseDownButton = -1;

	/**
	 * Handles mousedown which will add the mousemove listener
	 **/
	function handleMousedown (event) {
    // save current mousedown button
    lastMouseDownButton = event.button;

    // save target to global variable
    if (typeof TARGET !== 'undefined') TARGET = event.target;

    // prevent text selection/deselection if right mouse button is hold and left mouse button is clicked
    if (event.buttons === 3 && event.button === 0) {
      event.stopPropagation();
      event.preventDefault();
    }
	}


  /**
	 * Handles and prevents context menu if needed (right click)
	 **/
	function handleContextmenu (event) {
    // if left mouse button is hold and right mouse button is clicked || little fix for linux
    if ((event.buttons === 1 && event.button === 2) || event.buttons === 3) {
      browser.runtime.sendMessage({
        subject: "rockerRight",
        data: {
          href: getLinkHref(TARGET),
          src: getImageSrc(TARGET),
          selection: getTextSelection()
        }
      });
      event.stopPropagation();
      event.preventDefault();
    }
    // prevent contextmenu when either a rocker mouse button was the last pressed button or none button was pressed
    else if (lastMouseDownButton === -1) {
      event.stopPropagation();
      event.preventDefault();
    }
    // reset mouse down button
    lastMouseDownButton = -1;
	}


	/**
	 * Handles and prevents click event if needed (left click)
	 **/
  function handleClick (event) {
    // if right mouse button is hold and left mouse button is clicked
    if (event.buttons === 2 && event.button === 0) {
      browser.runtime.sendMessage({
        subject: "rockerLeft",
        data: {
          href: getLinkHref(TARGET),
          src: getImageSrc(TARGET),
          selection: getTextSelection()
        }
      });
      event.stopPropagation();
      event.preventDefault();
      // reset mouse down button
      lastMouseDownButton = -1;
    }
    // prevent click when either a rocker mouse button was the last pressed button or none button was pressed
    else if (lastMouseDownButton === -1) {
      event.stopPropagation();
      event.preventDefault();
    }
	}

	// due to modul pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return modul;
})();
