import { fetchJSONAsObject } from "/core/commons.js";

import { ContentLoaded, Config } from "/options/js/index.js";

ContentLoaded.then(main);

/**
 * main function
 * run code that depends on async resources
 **/
function main () {
  // data management buttons
  const resetButton = document.getElementById("resetButton");
        resetButton.onclick = onResetButton;
  const backupButton = document.getElementById("backupButton");
        backupButton.onclick = onBackupButton;
  const restoreButton = document.getElementById("restoreButton");
        restoreButton.onchange = onRestoreButton;
}


/**
 * clears the current config so the defaults will be used
 * resets all optional permissions
 * reloads the options page afterwards
 **/
function onResetButton () {
  const popup = document.getElementById("resetConfirm");
  popup.addEventListener("close", (event) => {
    if (event.detail) {
      const manifest = browser.runtime.getManifest();
      const removePermissions = browser.permissions.remove(
        { permissions: manifest.optional_permissions }
      );
      removePermissions.then((values) => {
        Config.clear();
        // reload option page to update the ui
        window.location.reload();
      });
    }
  }, { once: true });
  popup.open = true;
}


/**
 * saves the current config as a json file
 **/
function onBackupButton () {
  const manifest = browser.runtime.getManifest();
  const linkElement = document.createElement("a");
  linkElement.download = `${manifest.name} ${manifest.version} ${ new Date().toDateString() }.json`;
  // creates a json file with the current config
  linkElement.href = URL.createObjectURL(
    new Blob([JSON.stringify(Config.get(), null, '  ')], {type: 'application/json'})
  );
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
}


/**
 * overwrites the current config with the selected config
 * and resets all optional permissions
 * reloads the options page afterwards
 **/
async function onRestoreButton (event) {
  if (this.files[0].type !== "application/json") {
    const popup = document.getElementById("restoreAlertWrongFile");
    popup.open = true;
    // terminate function
    return;
  }

  // catch rejected promises and errors
  try {
    // load file data
    const file = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const restoredConfig = JSON.parse(reader.result);
          resolve(restoredConfig)
        }
        catch (e) {
          reject();
        }
      }
      reader.onerror = reject;
      reader.readAsText(this.files[0]);
    });
    // load the commands data in order to request the right permissions
    const commands = await fetchJSONAsObject(browser.runtime.getURL("/resources/json/commands.json"));

    // get the necessary permissions
    const requiredPermissions = [];
    // combine all gestures to one array
    const gestures = [
      ...file.Gestures,
      file.Settings.Rocker.rightMouseClick,
      file.Settings.Rocker.leftMouseClick,
      file.Settings.Wheel.wheelUp,
      file.Settings.Wheel.wheelDown
    ];
    for (let gesture of gestures) {
      const commandItem = commands.find((element) => {
        return element.command === gesture.command;
      });
      if (commandItem.permissions) commandItem.permissions.forEach((permission) => {
        if (!requiredPermissions.includes(permission)) requiredPermissions.push(permission);
      });
    }

    // if optional permissions are required request them
    if (requiredPermissions.length > 0) {
      // display popup because permission request requires user interaction
      const popup = document.getElementById("restoreAlertAdditionalPermissions");
      popup.addEventListener("close", () => {
        const permissionRequest = browser.permissions.request({
          permissions: requiredPermissions,
        });
        permissionRequest.then((granted) => {
          if (granted) proceed();
        });
      }, { once: true });
      popup.open = true;
    }
    else proceed();

    // helper function to fnish the process
    // reload option page to update the ui
    function proceed () {
      Config.set(file);
      const popup = document.getElementById("restoreAlertSuccess");
      popup.addEventListener("close", () => window.location.reload(), { once: true });
      popup.open = true;
    }
  }
  catch (e) {
    const popup = document.getElementById("restoreAlertNoConfigFile");
    popup.open = true;
    // terminate function
    return;
  }
}