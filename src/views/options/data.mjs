import { ContentLoaded, Config } from "/views/options/main.mjs";

import ConfigManager from "/core/services/config-manager.mjs";

import CommandDefinitions from "/resources/configs/commands.mjs";

ContentLoaded.then(main);


/**
 * main function
 * run code that depends on async resources
 **/
function main () {
  // data management buttons
  document.getElementById("fileBackupButton").onclick = onFileBackupButton;
  document.getElementById("fileRestoreButton").onchange = onFileRestoreButton;
  document.getElementById("cloudBackupButton").onclick = onCloudBackupButton;
  document.getElementById("cloudRestoreButton").onclick = onCloudRestoreButton;
  document.getElementById("configResetButton").onclick = onConfigResetButton;

  handleButtonStates();
  browser.storage.sync.onChanged.addListener(handleButtonStates);
}


/**
 * enabled/disables buttons according to different rules
 **/
async function handleButtonStates() {
  // disable download button when sync storage is empty
  const bytesInUse = await browser.storage.sync.getBytesInUse();
  const button = document.getElementById("cloudRestoreButton");
  button.disabled = bytesInUse <= 0;
}


/**
 * saves the current config as a json file
 **/
function onFileBackupButton () {
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
async function onFileRestoreButton (event) {
  if (this.files[0].type !== "application/json") {
    prompt("restoreAlertWrongFile");
    // terminate function
    return;
  }

  // catch rejected promises and errors
  try {
    // load file data
    const json = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const restoredConfig = JSON.parse(reader.result);
          resolve(restoredConfig)
        }
        catch (e) {
          reject(e);
        }
      }
      reader.onerror = reject;
      reader.readAsText(this.files[0]);
    });

    const proceed = await new Promise((resolve) => {
      // display popup because permission request requires user interaction
      // also to ensure that the user really wants to override the current config
      const popup = document.getElementById("restoreConfirm");
      popup.addEventListener("close", async (event) => {
        // if user declined exit function
        if (!event.detail) return resolve(false);
        // if optional permissions are required request them
        const permissionsGranted = await requestPermissionsForConfig(json);
        resolve(permissionsGranted);
      }, { once: true });
      popup.open = true;
    });

    if (proceed) {
      Config.clear();
      Config.set(json);
      await prompt("restoreAlertSuccess");
      // reload option page to update the ui
      window.location.reload();
    }
  }
  catch (e) {
    prompt("restoreAlertNoConfigFile");
    // terminate function
    return;
  }
}


/**
 * uploads the current config to the sync storage
 **/
async function onCloudBackupButton () {
  const bytesInUse = await browser.storage.sync.getBytesInUse();
  // check whether there is any pre-existing data in the sync storage and warn user
  if (bytesInUse > 0) {
    const proceed = await prompt("uploadConfirm");
    if (!proceed) return;
  }
  // create sync config manager and write current config to it
  const cloudConfig = new ConfigManager({
    storageArea: 'sync',
  });
  await cloudConfig.loaded;
  cloudConfig.set(
    Config.get(),
  );
  prompt("uploadAlertSuccess");
}


/**
 * loads and applies the config from the sync storage
 * reloads the options page afterwards
 **/
async function onCloudRestoreButton () {
  const cloudConfig = new ConfigManager({
    storageArea: 'sync',
  });
  await cloudConfig.loaded;
  const json = cloudConfig.get();

  const proceed = await new Promise((resolve) => {
    // display popup because permission request requires user interaction
    // also to ensure that the user really wants to override the current config
    const popup = document.getElementById("downloadConfirm");
    popup.addEventListener("close", async (event) => {
      // if user declined exit function
      if (!event.detail) return resolve(false);
      // if optional permissions are required request them
      const permissionsGranted = await requestPermissionsForConfig(json);
      resolve(permissionsGranted);
    }, { once: true });
    popup.open = true;
  });

  if (proceed) {
    Config.clear();
    Config.set(json);
    await prompt("downloadAlertSuccess");
    // reload option page to update the ui
    window.location.reload();
  }
}


/**
 * clears the current config so the defaults will be used
 * resets all optional permissions
 * reloads the options page afterwards
 **/
async function onConfigResetButton () {
  const proceed = await prompt("resetConfirm");
  if (proceed) {
    const manifest = browser.runtime.getManifest();
    await browser.permissions.remove(
      { permissions: manifest.optional_permissions }
    );
    Config.clear();
    // reload option page to update the ui
    window.location.reload();
  }
}


/**
 * Collects and requests all permissions that are required for the given config file
 * This returns a promise that will either fulfill with true or false
 * If no permissions are required this fulfills with true
 **/
function requestPermissionsForConfig (json) {
  // get the necessary permissions
  const requiredPermissions = [];
  // combine all commands to one array
  const usedCommands = [];
  if (json.Gestures && json.Gestures.length > 0) {
    json.Gestures.forEach(gesture => usedCommands.push(gesture.command));
  }
  if (json.Settings && json.Settings.Rocker) {
    if (json.Settings.Rocker.rightMouseClick) usedCommands.push(json.Settings.Rocker.rightMouseClick);
    if (json.Settings.Rocker.leftMouseClick) usedCommands.push(json.Settings.Rocker.leftMouseClick);
  }
  if (json.Settings && json.Settings.Wheel) {
    if (json.Settings.Wheel.wheelUp) usedCommands.push(json.Settings.Wheel.wheelUp);
    if (json.Settings.Wheel.wheelDown) usedCommands.push(json.Settings.Wheel.wheelDown);
  }

  for (let command of usedCommands) {
    const commandItem = CommandDefinitions.find((element) => {
      return element.command === command.name;
    });
    if (commandItem.permissions) commandItem.permissions.forEach((permission) => {
      if (!requiredPermissions.includes(permission)) requiredPermissions.push(permission);
    });
  }

  // if optional permissions are required request them
  if (requiredPermissions.length > 0) {
    return browser.permissions.request({
      permissions: requiredPermissions,
    });
  }
  // if no permissions are required resolve to true
  return Promise.resolve(true);
}


/**
 * Helper function to open popups by their ids.
 * Returns the result of the popup.
 **/
function prompt (popupId) {
  return new Promise((resolve) => {
    const popup = document.getElementById(popupId);
    popup.addEventListener("close",
      async (event) => resolve(event.detail),
      { once: true },
    );
    popup.open = true;
  });
}
