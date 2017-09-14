'use strict'

// global variable containing the target html element
var TARGET = null;


/**
 * message handler
 * listen for propagations from the options or background script and apply settings afterwards
 **/
chrome.runtime.onMessage.addListener((message) => {
  if (message.subject === "settingsChange") {
    applySettings(message.data);
	}
});


/**
 * get necessary data from storage
 * apply settings afterwards
 **/
chrome.storage.local.get("Settings", (data) => {
	if (Object.keys(data).length !== 0) {
    applySettings(data.Settings);
	}
});


function applySettings (Settings) {
  // apply all settings
  GestureHandler.applySettings(Settings);
  GestureHandler.enable();

  // gestureIndicator only necessary for main page and does not work on pure svg pages
  if (!inIframe() && document.documentElement.tagName.toUpperCase() !== "SVG") {
    GestureIndicator.applySettings(Settings);
    GestureIndicator.enable();
  }

  // enable/disable rocker gesture
  Settings.Rocker.active ? RockerHandler.enable() : RockerHandler.disable();

  // enable/disable wheel gesture
  if (Settings.Wheel.active) {
    WheelHandler.applySettings(Settings);
    WheelHandler.enable();
  }
  else WheelHandler.disable();
}
