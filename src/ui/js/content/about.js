import {
  Config,
  Manifest
} from "/ui/js/content.js";

import {
  getJsonFileAsObject,
  cloneObjectInto
} from "/core/commons.js";


// data management buttons
const resetButton = document.getElementById("resetButton");
      resetButton.onclick = onResetButton;
const backupButton = document.getElementById("backupButton");
      // build the file export name
      backupButton.download = `${Manifest.name} ${Manifest.version} ${ new Date().toDateString() }.json`;
      // creates a json file with the current config
      backupButton.href = URL.createObjectURL(
        new Blob([JSON.stringify(Config, null, '  ')], {type: 'application/json'})
      );
const restoreButton = document.getElementById("restoreButton");
      restoreButton.onchange = onRestoreButton;


/**
 * overwrites the current config with the defaults
 * and resets all optional permissions
 * reloads the options page afterwards
 **/
function onResetButton () {
  if (window.confirm(browser.i18n.getMessage('aboutResetNotificationConfirm'))) {
    const queryDefaults = getJsonFileAsObject(browser.runtime.getURL("res/json/defaults.json"));
    const removePermissions = browser.permissions.remove(
      { permissions: Manifest.optional_permissions }
    );

    Promise.all([queryDefaults, removePermissions]).then((values) => {
      // reset data and keep the reference by using assign
      Object.assign(Config, cloneObjectInto(values[0], window.top));
      // reload option page to update the ui and save/propagate new data
      window.top.location.reload(true);
    });
  }
}


/**
 * overwrites the current config with the selected config
 * and resets all optional permissions
 * reloads the options page afterwards
 **/
function onRestoreButton (event) {
  if (this.files[0].type === "application/json") {
    const reader = new FileReader();
    reader.onloadend = () => {
      const restoredConfig = JSON.parse(reader.result);
      // some weak file content checks
      if (!Array.isArray(restoredConfig.Blacklist) || !Array.isArray(restoredConfig.Gestures) || typeof restoredConfig.Settings !== 'object') {
        alert(browser.i18n.getMessage('aboutRestoreNotificationNoConfigFile'));
        return;
      }

      // request necessary permissions
      /*
      const requiredPermissions = [];
      for (let gesture of restoredConfig.Gestures) {
        const commandItem = window.top.Commands.find((element) => {
          return element.command === gesture.command;
        });
        if (commandItem.permissions) commandItem.permissions.forEach((permission) => {
          if (!requiredPermissions.includes(permission)) requiredPermissions.push(permission);
        });
      }
      const permissionRequest = browser.permissions.request({
        permissions: requiredPermissions,
      });
      permissionRequest.then((granted) => {
        if (granted) console.log("hallo");
      });
      */

      // overwrite data and keep the reference by using assign
      Object.assign(Config, cloneObjectInto(restoredConfig, window.top));
      alert(browser.i18n.getMessage('aboutRestoreNotificationSuccess'));
      // reload option page to update the ui and save/propagate new data
      window.top.location.reload(true);
    }
    reader.readAsText(this.files[0]);
  }
  else alert(browser.i18n.getMessage('aboutRestoreNotificationWrongFile'));
}
