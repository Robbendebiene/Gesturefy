'use strict'

/**
 * ZoomHandler "singleton" class using the module pattern
 * detects zoom changes propagated by the background script
 * on default the handler is disabled and must be enabled via enable()
 **/
const ZoomHandler = (function() {

// public variables and methods

  const module = {};

  /**
   * Add the event listener and request zoom factor
   **/
  module.enable = function enable () {
    browser.runtime.onMessage.addListener(handleMessage);

    // request the zoom factor
    browser.runtime.sendMessage({
      subject: "zoomFactorRequest",
      data: {}
    });
  };


  /**
   * Remove the event listener and resets the handler
   **/
  module.disable = function disable () {
    browser.runtime.onMessage.removeListener(handleMessage);

    // reset the zoom factor
    zoomFactor = 1;
  }


  /**
   * Returns the current zoom factor
   **/
  module.getZoom = function getZoom () {
    return zoomFactor;
  }

// private variables and methods

  // initialize zoom factor
  let zoomFactor = 1;


  /**
   * Handles zoom factor changes messages from the background page
   **/
  function handleMessage (message, sender, sendResponse) {
    if (message.subject === "zoomChange")
      zoomFactor = message.data.zoomFactor;
  }

	// due to module pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return module;
})();
