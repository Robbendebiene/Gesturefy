'use strict'

/**
 * TODO:
 * - rework import and export functionality
 * - forget permissions on reset? request permissions on import
 */

// data management buttons
const resetButton = document.getElementById("resetButton");
      resetButton.onclick = onResetButton;
const backupButton = document.getElementById("backupButton");
      backupButton.onclick = onBackupButton;
const restoreButton = document.getElementById("restoreButton");
      restoreButton.onchange = onRestoreButton;


/**
 * merges the default config into the current config
 * reloads the options page afterwards
 **/
function onResetButton () {
  if (window.confirm(browser.i18n.getMessage('aboutResetNotificationConfirm')))
    Core.getJsonFileAsObject(chrome.runtime.getURL("res/json/defaults.json"), (config) => {
      // keep the reference by using assign
      Object.assign(Config, config);
      // reload option page to update the ui and save/propagate new data
      window.location.reload(false);
    });
}


/**
 * creates a json file with the current config and prompts a download dialog
 **/
function onBackupButton () {
  let url = URL.createObjectURL(
        new Blob([JSON.stringify(Config, null, '  ')], {type: 'application/json'})
      );
  let date = new Date().toDateString();

  chrome.downloads.download({
    url: url,
    filename: `${Manifest.name} ${Manifest.version} ${date}.json`,
    saveAs: true
  }, (downloadId) => {
    // catch error and free the blob for gc
    if (chrome.runtime.lastError) URL.revokeObjectURL(url);
    else chrome.downloads.onChanged.addListener(function clearURL(downloadDelta) {
      if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
        URL.revokeObjectURL(url);
        chrome.downloads.onChanged.removeListener(clearURL);
      }
    });
  });
}


/**
 * creates a json file with the current config and prompts a download dialog
 **/
function onRestoreButton (event) {
  if (this.files[0].type === "application/json") {
    let reader = new FileReader();
        reader.onloadend = () => {
          let restoredConfig = JSON.parse(reader.result),
              count = 0;

          // this will iterate through the current config and check if there is a corresponding value in the restore config
          function updateDeep(target, source) {
            for (let key in target) {
              if (key in source) {
                if (Core.isObject(target[key]) && Core.isObject(source[key]))
                  updateDeep(target[key], source[key]);
                else if (!Core.isObject(target[key]) && !Core.isObject(source[key])) {
                  target[key] = source[key];
                  count++;
                }
              }
            }
          }
          updateDeep(Config, restoredConfig);

          alert(browser.i18n.getMessage('aboutRestoreNotificationSuccess', count));
          // reload option page to update the ui and save/propagate new data
          window.location.reload(false);
        }
        reader.readAsText(this.files[0]);
  }
  else alert(browser.i18n.getMessage('aboutRestoreNotificationWrongFile'));
}
