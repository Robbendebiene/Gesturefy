import {
  getObjectPropertyByString,
  cloneObjectInto
} from "/core/commons.js";

import {
  Config,
  Commands,
  CommandSettingTemplates
} from "/ui/js/content.js";

import Overlay from "/ui/js/modules/overlay.js";

import CommandBar from "/ui/js/modules/command-bar.js";

// main code

// initialize command bar module
CommandBar.init(Commands, CommandSettingTemplates);

// apply values to input fields and add their event function
const commandSelects = document.querySelectorAll(".command-select-field");
for (let commandSelect of commandSelects) {
  const commandObject = getObjectPropertyByString(Config, commandSelect.dataset.configHierarchy)[commandSelect.name];
  commandSelect.title = browser.i18n.getMessage(`commandLabel${commandObject.command}`);
  commandSelect.addEventListener('click', onCommandSelect);
}


/**
 * Opens the command bar and overlay on command button click
 **/
function onCommandSelect () {
  const configObject = getObjectPropertyByString(Config, this.dataset.configHierarchy);

  Overlay.open();
  Overlay.onClick(closeCommandBar);

  CommandBar.open(configObject[this.name]);
  CommandBar.onCancel(closeCommandBar);

  CommandBar.onSubmit((commandObject) => {
    closeCommandBar();
    // add popout animation for the updated command button
    this.addEventListener("animationend", (event) => {
      this.classList.remove("pop-out-animation");
    }, { once: true });
    this.classList.add("pop-out-animation");
    // update the command button title
    this.title = browser.i18n.getMessage(`commandLabel${commandObject.command}`);
    // save command object to config
    configObject[this.name] = cloneObjectInto(
      commandObject,
      window.top
    );
  });
}


/**
 * Closes the command bar and overlay
 **/
function closeCommandBar () {
  Overlay.close();
  CommandBar.close();
}
