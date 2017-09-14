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
    preventDefault = true;
    document.removeEventListener('mousedown', handleMousedown, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('contextmenu', handleContextmenu, true);
  }

// private variables and methods

  // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
  let preventDefault = true;

	/**
	 * Handles mousedown which will detect the target and handle prevention
	 **/
	function handleMousedown (event) {
    if (event.isTrusted) {
      // always disable prevention on mousedown
      preventDefault = false;

      // save target to global variable
      if (typeof TARGET !== 'undefined') TARGET = event.target;

      // prevent text selection/deselection if right mouse button is hold and left mouse button is clicked
      if (event.buttons === 3 && event.button === 0) {
        event.stopPropagation();
        event.preventDefault();
      }
    }
	}


  /**
	 * Handles and prevents context menu if needed (right click)
	 **/
	function handleContextmenu (event) {
    if (event.isTrusted) {
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
      // prevent contextmenu when either a rocker mouse button was the last pressed button or none button was pressed before
      else if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
      // reset prevention
      preventDefault = true;
    }
	}


	/**
	 * Handles and prevents click event if needed (left click)
	 **/
  function handleClick (event) {
    if (event.isTrusted) {
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
        // reset prevention
        preventDefault = true;
      }
      // prevent click when either a rocker mouse button was the last pressed button or none button was pressed before
      else if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
    }
	}

	// due to modul pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return modul;
})();
