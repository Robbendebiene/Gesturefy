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

      if (event.buttons === 3 && (event.button === 2 || event.button === 0)) {
        // save target to global variable
        if (typeof TARGET !== 'undefined') TARGET = event.target;

        browser.runtime.sendMessage({
          subject: event.button ? "rockerRight" : "rockerLeft",
          data: getTargetData(event.target)
        });

        event.stopPropagation();
        event.preventDefault();
        // reset prevention
        preventDefault = true;
      }
    }
	}


  /**
	 * Handles and prevents context menu if needed (right click)
	 **/
	function handleContextmenu (event) {
    if (event.isTrusted) {
      // prevent contextmenu when either a rocker mouse button was the last pressed button or none button was pressed before
      if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
      // enable prevention
      else preventDefault = true;
    }
	}


	/**
	 * Handles and prevents click event if needed (left click)
	 **/
  function handleClick (event) {
    // event.detail because a click event can be fired without clicking (https://stackoverflow.com/questions/4763638/enter-triggers-button-click)
    if (event.isTrusted && event.detail && (event.button === 0 || event.button === 1)) {
      // prevent click when either a rocker mouse button was the last pressed button or none button was pressed before
      if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
      // enable prevention
      else preventDefault = true;
    }
	}

	// due to modul pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return modul;
})();
