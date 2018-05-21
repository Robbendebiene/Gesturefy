'use strict'

// global variable containing the target html element
var TARGET = null;

/**
 * listen for related storage changes
 * and apply settings afterwards
 **/
browser.storage.onChanged.addListener((changes) => {
  if (changes.Settings || changes.Blacklist) {
    applySettings(changes.Settings.newValue, changes.Blacklist.newValue);
  }
});


/**
 * get necessary data from storage
 * apply settings afterwards
 **/
const fetchSettings = browser.storage.sync.get(["Settings", "Blacklist"]);
fetchSettings.then((storage) => {
  if (Object.keys(storage).length !== 0) {
    applySettings(storage.Settings, storage.Blacklist);
  }
});


function applySettings (Settings, Blacklist) {
  if (!Blacklist.some(matchesCurrentURL)) {
    // apply all settings
    GestureHandler.applySettings(Settings);
    GestureHandler.enable();

    // enable/disable rocker gesture
    if (Settings.Rocker.active) {
      RockerHandler.enable();
    }
    else RockerHandler.disable();

    // enable/disable wheel gesture
    if (Settings.Wheel.active) {
      WheelHandler.applySettings(Settings);
      WheelHandler.enable();
    }
    else WheelHandler.disable();

    // zoomHandler, gestureIndicator and popupHandler only necessary for main page and do not work on pure svg pages
    if (!inIframe() && document.documentElement.tagName.toUpperCase() !== "SVG") {
      ZoomHandler.enable();

      GestureIndicator.applySettings(Settings);
      GestureIndicator.enable();

      PopupHandler.enable();
    }
  }
  else {
    GestureHandler.disable();
    RockerHandler.disable();
    WheelHandler.disable();
    ZoomHandler.disable();
    PopupHandler.disable();
  }
}
