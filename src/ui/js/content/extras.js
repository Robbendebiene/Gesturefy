'use strict'

const Commands = window.top.Commands;
const SettingTemplates = window.top.document.getElementById("CommandSettings").content;
      CommandBar.init(Commands, SettingTemplates);

// apply values to input fields and add their event function
const commandSelects = document.querySelectorAll(".command-select-field");
for (let commandSelect of commandSelects) {
  const commandObject = getObjectPropertyByString(Config.Settings, commandSelect.dataset.hierarchy)[commandSelect.name];
  commandSelect.title = browser.i18n.getMessage(`commandLabel${commandObject.command}`);
  commandSelect.addEventListener('click', onCommandSelect);
}


/**
 * Opens the command bar and overlay on command button click
 **/
function onCommandSelect () {
  const configObject = getObjectPropertyByString(Config.Settings, this.dataset.hierarchy);

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
