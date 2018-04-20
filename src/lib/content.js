'use strict'

// global variable containing the target html element
var TARGET = null;


/**
 * message handler
 * listen for propagations from the options or background script and apply settings afterwards
 **/
browser.runtime.onMessage.addListener((message) => {
  if (message.subject === "settingsChange") {
    applySettings(message.data);
  }
});

/**
 * get necessary data from storage
 * apply settings afterwards
 **/
const fetchSettings = browser.storage.local.get(null);
fetchSettings.then((data) => {
  if (Object.keys(data).length !== 0) {
    applySettings(data);
  }
});



function applySettings (Config) {
  if (!Config.Blacklist.some(matchesCurrentURL)) {
    console.log("x");
    // apply all settings
    GestureHandler.applySettings(Config.Settings);
    GestureHandler.enable();

    // enable/disable rocker gesture
    if (Config.Settings.Rocker.active) {
      RockerHandler.enable();
    }
    else RockerHandler.disable();

    // enable/disable wheel gesture
    if (Config.Settings.Wheel.active) {
      WheelHandler.applySettings(Config.Settings);
      WheelHandler.enable();
    }
    else WheelHandler.disable();

    // zoomHandler, gestureIndicator and popupHandler only necessary for main page and do not work on pure svg pages
    if (!inIframe() && document.documentElement.tagName.toUpperCase() !== "SVG") {
      ZoomHandler.enable();

      GestureIndicator.applySettings(Config.Settings);
      GestureIndicator.enable();

      PopupHandler.enable();
    }

  }
}


/* blacklist
if (!array.some(matchesCurrentURL)) {

}
*/
