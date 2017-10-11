'use strict'

/**
 * WheelHandler "singleton" class using the modul pattern
 * detects gesture and reports it to the background script
 * on default the handler is disabled and must be enabled via enable()
 **/
const WheelHandler = (function() {

// public variables and methods

  let modul = {};

  /**
   * applies necessary settings
   **/
  modul.applySettings = function applySettings (Settings) {
    mouseButton = Number(Settings.Wheel.mouseButton);
  }

	/**
	 * Add the document event listener
	 **/
  modul.enable = function enable () {
    document.addEventListener('wheel', handleWheel, true);
    document.addEventListener('mousedown', handleMousedown, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('contextmenu', handleContextmenu, true);
  };


	/**
	 * Remove the event listeners and resets the handler
	 **/
	modul.disable = function disable () {
    preventDefault = true;
    document.removeEventListener('wheel', handleWheel, true);
    document.removeEventListener('mousedown', handleMousedown, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('contextmenu', handleContextmenu, true);
  }

// private variables and methods

  let mouseButton = 2;

  // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
  let preventDefault = true;


  /**
   * Handles mousedown which will detect the target and handle prevention
   **/
  function handleMousedown (event) {
    if (event.isTrusted && event.buttons === mouseButton) {
      // always disable prevention on mousedown
      preventDefault = false;

	    // prevent middle click scroll
	    if (mouseButton === 4) event.preventDefault();
    }
  }


  /**
	 * Handles mousewheel up and down and prevents scrolling if needed
	 **/
	function handleWheel (event) {
    if (event.isTrusted && event.buttons === mouseButton && event.deltaY !== 0) {
      // save target to global variable
      if (typeof TARGET !== 'undefined') TARGET = event.target;

      browser.runtime.sendMessage({
        subject: event.deltaY < 0 ? "wheelUp" : "wheelDown",
        data: getTargetData(event.target)
      });
      event.stopPropagation();
      event.preventDefault();
      // enable prevention
      preventDefault = true;
    }
	}


  /**
	 * Handles and prevents context menu if needed
	 **/
	function handleContextmenu (event) {
    if (event.isTrusted && event.button === 2 && mouseButton === 2) {
      // prevent contextmenu when either the wheel was rolled or none button was pressed
      if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
      // enable prevention
      else preventDefault = true;
    }
	}


  /**
   * Handles and prevents click event if needed
   **/
  function handleClick (event) {
    // event.detail because a click event can be fired without clicking (https://stackoverflow.com/questions/4763638/enter-triggers-button-click)
    if (event.isTrusted && event.detail && ((event.button === 1 && mouseButton === 4) || (event.button === 0 && mouseButton === 1))) {
      // prevent click when either the wheel was rolled or none button was pressed
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
