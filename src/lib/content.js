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

  // gestureIndicator only necessary for main page
  if (!inIframe()) {
    GestureIndicator.applySettings(Settings);
    GestureIndicator.enable();
  }

  // enable/disable rocker gesture
  Settings.Rocker.active ? RockerHandler.enable() : RockerHandler.disable();
}
