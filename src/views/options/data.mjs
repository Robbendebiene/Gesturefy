import { ContentLoaded } from "/views/options/main.mjs";

import CommandStack from "/core/models/command-stack.mjs";

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
async function onFileBackupButton () {
  const localConfig = await browser.storage.local.get(null);
  const manifest = browser.runtime.getManifest();
  const linkElement = document.createElement("a");
  linkElement.download = `${manifest.name} ${manifest.version} ${ new Date().toDateString() }.json`;
  // creates a json file with the current config
  linkElement.href = URL.createObjectURL(
    new Blob([JSON.stringify(localConfig, null, '  ')], {type: 'application/json'})
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
      await browser.storage.local.clear();
      await browser.storage.local.set(json);
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
  // write local config to sync config
  const localConfig = await browser.storage.local.get(null);
  await browser.storage.sync.clear();
  await browser.storage.sync.set(localConfig);
  prompt("uploadAlertSuccess");
}

/**
 * Loads and applies the config from the sync storage.
 * Reloads the options page afterwards.
 **/
async function onCloudRestoreButton () {
  const syncConfig = await browser.storage.sync.get(null);

  const proceed = await new Promise((resolve) => {
    // display popup because permission request requires user interaction
    // also to ensure that the user really wants to override the current config
    const popup = document.getElementById("downloadConfirm");
    popup.addEventListener("close", async (event) => {
      // if user declined exit function
      if (!event.detail) return resolve(false);
      // if optional permissions are required request them
      const permissionsGranted = await requestPermissionsForConfig(syncConfig);
      resolve(permissionsGranted);
    }, { once: true });
    popup.open = true;
  });

  if (proceed) {
    await browser.storage.local.clear();
    await browser.storage.local.set(syncConfig);
    await prompt("downloadAlertSuccess");
    // reload option page to update the ui
    window.location.reload();
  }
}

/**
 * Clears the current config so the defaults will be used.
 * Resets all optional permissions.
 * Reloads the options page afterwards
 **/
async function onConfigResetButton () {
  const proceed = await prompt("resetConfirm");
  if (proceed) {
    const manifest = browser.runtime.getManifest();
    await Promise.all([
      browser.permissions.remove({
        permissions: manifest.optional_permissions
      }),
      browser.storage.local.clear(),
    ]);
    // reload option page to update the ui
    window.location.reload();
  }
}

/**
 * Collects and requests all permissions that are required for the given config file.
 * This returns a promise that will either fulfil with true or false.
 * If no permissions are required this fulfils with true.
 **/
async function requestPermissionsForConfig (json) {
  // get the necessary permissions
  const requiredPermissions = new Set();
  // helper to add permissions from a command stack to the permission set
  function addPermissions(rawCommands) {
    for (const p of CommandStack.fromJSON(rawCommands).permissions)
      requiredPermissions.add(p);
  }

  json?.Gestures?.forEach(gesture => addPermissions(gesture.commands));
  if (json?.Settings?.Rocker?.rightMouseClick) addPermissions(json.Settings.Rocker.rightMouseClick)
  if (json?.Settings?.Rocker?.leftMouseClick) addPermissions(json.Settings.Rocker.leftMouseClick);
  if (json?.Settings?.Wheel?.wheelUp) addPermissions(json.Settings.Wheel.wheelUp);
  if (json?.Settings?.Wheel?.wheelDown) addPermissions(json.Settings.Wheel.wheelDown);

  const granted = [];
  // user scripts permission must be requested separately due to special dialog
  if (requiredPermissions.delete("userScripts")) {
    // cannot await here because subsequent permission requests wont work
    granted.push(browser.permissions.request({
      permissions: ["userScripts"],
    }));
  }
  // if further optional permissions are required request them
  if (requiredPermissions.size > 0) {
    granted.push(browser.permissions.request({
      permissions: Array.from(requiredPermissions),
    }));
  }
  // check whether all permissions were granted
  // if no permissions were required this resolves to true
  return (await Promise.all(granted)).every(Boolean);
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
