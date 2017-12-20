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
    window.addEventListener('mousedown', handleMousedown, true);
    window.addEventListener('mouseup', handleMouseup, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('contextmenu', handleContextmenu, true);
    window.addEventListener('visibilitychange', handleVisibilitychange, true);
  };


	/**
	 * Remove the event listeners and resets the handler
	 **/
	modul.disable = function disable () {
    preventDefault = true;
    window.removeEventListener('mousedown', handleMousedown, true);
    window.removeEventListener('mouseup', handleMouseup, true);
    window.removeEventListener('click', handleClick, true);
    window.removeEventListener('contextmenu', handleContextmenu, true);
    window.removeEventListener('visibilitychange', handleVisibilitychange, true);
  }

// private variables and methods

  // defines whether or not the click/contextmenu should be prevented
  // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
  let preventDefault = true;

  // timestamp of the last mouseup
  // this is needed to distinguish between true mouse click events and other click events fired by pressing enter or by clicking labels
  let lastMouseup = 0;

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

        const data = getTargetData(event.target);
              data.mousePosition = {
                x: event.screenX,
                y: event.screenY
              };

        browser.runtime.sendMessage({
          subject: event.button ? "rockerRight" : "rockerLeft",
          data: data
        });

        event.stopPropagation();
        event.preventDefault();
        // enable prevention
        preventDefault = true;
      }
    }
	}


  /**
   * This is only needed to distinguish between true mouse click events and other click events fired by pressing enter or by clicking labels
   * Other property values like screen position or target could be used in the same manner
   **/
  function handleMouseup(event) {
    lastMouseup = event.timeStamp;
  }


  /**
	 * This is only needed for tab changing actions
   * Because the rocker gesture is executed in a different tab as where click/contextmenu needs to be prevented
	 **/
  function handleVisibilitychange() {
    // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
    preventDefault = true;
  }


  /**
	 * Handles and prevents context menu if needed (right click)
	 **/
	function handleContextmenu (event) {
    if (event.isTrusted && preventDefault && event.button === 2) {
      // prevent contextmenu
      event.stopPropagation();
      event.preventDefault();
    }
	}


	/**
	 * Handles and prevents click event if needed (left click)
	 **/
  function handleClick (event) {
    // event.detail because a click event can be fired without clicking (https://stackoverflow.com/questions/4763638/enter-triggers-button-click)
    // timeStamp check ensures that the click is fired by mouseup
    if (event.isTrusted && preventDefault && event.button === 0 && event.detail && event.timeStamp === lastMouseup) {
      // prevent click
      event.stopPropagation();
      event.preventDefault();
    }
	}

	// due to modul pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return modul;
})();
