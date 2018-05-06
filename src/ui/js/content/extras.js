'use strict'

const Commands = window.top.Commands;
const SettingTemplates = window.top.document.getElementById("CommandSettings").content;
      CommandBar.init(Commands, SettingTemplates);

// apply values to input fields and add their event function
const commandSelects = document.querySelectorAll(".command-select-field");
      for (let select of commandSelects) {
        const commandItem = getObjectPropertyByString(Config.Settings, select.dataset.hierarchy)[select.name];
        select.title = browser.i18n.getMessage(`commandName${commandItem.command}`);

        // mit after im css anzeigen
        select.addEventListener('click', onCommandSelect);
      }


function onCommandSelect () {
  Overlay.open();
  Overlay.onClick(() => {
    Overlay.close();
    CommandBar.close();
  });
  CommandBar.open(Config.Commands);
  CommandBar.onChoice((commandItem) => {
    Overlay.close();
    CommandBar.close();

    this.addEventListener("animationend", (event) => {
      this.classList.remove("pop-out-animation");
    }, { once: true });
    this.classList.add("pop-out-animation");

    const configObject = getObjectPropertyByString(Config.Settings, this.dataset.hierarchy);
    configObject[this.name] = cloneObjectInto(
      commandItem,
      window.top
    );

    this.title = browser.i18n.getMessage(`commandName${commandItem.command}`);
  });
}
