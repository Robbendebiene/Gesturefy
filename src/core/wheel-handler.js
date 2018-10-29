'use strict'

/**
 * WheelHandler "singleton" class using the module pattern
 * detects gesture and reports it to the background script
 * on default the handler is disabled and must be enabled via enable()
 **/
const WheelHandler = (function() {

// public variables and methods

  const module = {};

  /**
   * applies necessary settings
   **/
  module.applySettings = function applySettings (Settings) {
    mouseButton = Number(Settings.Wheel.mouseButton);
  }

	/**
	 * Add the document event listener
	 **/
  module.enable = function enable () {
    window.addEventListener('wheel', handleWheel, true);
    window.addEventListener('mousedown', handleMousedown, true);
    window.addEventListener('mouseup', handleMouseup, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('contextmenu', handleContextmenu, true);
    window.addEventListener('visibilitychange', handleVisibilitychange, true);
  };


	/**
	 * Remove the event listeners and resets the handler
	 **/
	module.disable = function disable () {
    preventDefault = true;
    window.removeEventListener('wheel', handleWheel, true);
    window.removeEventListener('mousedown', handleMousedown, true);
    window.removeEventListener('mouseup', handleMouseup, true);
    window.removeEventListener('click', handleClick, true);
    window.removeEventListener('contextmenu', handleContextmenu, true);
    window.removeEventListener('visibilitychange', handleVisibilitychange, true);
  }

// private variables and methods

  let mouseButton = 2;

  // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
  let preventDefault = true;

  let lastMouseup = 0;

  /**
   * Handles mousedown which will detect the target and handle prevention
   **/
  function handleMousedown (event) {
    if (event.isTrusted && isEquivalentButton(event.button, mouseButton)) {
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
    if (event.isTrusted && isCertainButton(event.buttons, mouseButton) && event.deltaY !== 0) {
      // save target to global variable
      if (typeof TARGET !== 'undefined') TARGET = event.target;

      const data = getTargetData(event.target);
            data.mousePosition = {
              x: event.screenX,
              y: event.screenY
            };

      browser.runtime.sendMessage({
        subject: event.deltaY < 0 ? "wheelUp" : "wheelDown",
        data: data
      });

      // cancel mouse gesture in case it got triggered
      GestureHandler.cancel();

      event.stopPropagation();
      event.preventDefault();
      // enable prevention
      preventDefault = true;
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
   * Because the wheel gesture is executed in a different tab as where click/contextmenu needs to be prevented
	 **/
  function handleVisibilitychange() {
    // keep preventDefault true for the special case that the contextmenu or click is fired without a privious mousedown
    preventDefault = true;
  }


  /**
	 * Handles and prevents context menu if needed
	 **/
	function handleContextmenu (event) {
    if (event.isTrusted && preventDefault && isEquivalentButton(event.button, mouseButton) && isCertainButton(mouseButton, 2)) {
      // prevent contextmenu
      event.stopPropagation();
      event.preventDefault();
    }
	}


  /**
   * Handles and prevents click event if needed
   **/
  function handleClick (event) {
    // event.detail because a click event can be fired without clicking (https://stackoverflow.com/questions/4763638/enter-triggers-button-click)
    // timeStamp check ensures that the click is fired by mouseup
    if (event.isTrusted && preventDefault && isEquivalentButton(event.button, mouseButton) && isCertainButton(mouseButton, 1, 4) && event.detail && event.timeStamp === lastMouseup) {
      // prevent left and middle click
      event.stopPropagation();
      event.preventDefault();
    }
  }

	// due to module pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return module;
})();
