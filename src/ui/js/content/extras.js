'use strict'

const Commands = window.top.Commands;
const SettingTemplates = window.top.document.getElementById("CommandSettings").content;
      CommandBar.init(Commands, SettingTemplates);

// apply values to input fields and add their event function
const commandSelects = document.querySelectorAll(".command-select-field");
      for (let select of commandSelects) {
        const commandObject = getObjectPropertyByString(Config.Settings, select.dataset.hierarchy)[select.name];
        select.title = browser.i18n.getMessage(`commandLabel${commandObject.command}`);

        // mit after im css anzeigen
        select.addEventListener('click', onCommandSelect);
      }


function onCommandSelect () {
  const configObject = getObjectPropertyByString(Config.Settings, this.dataset.hierarchy);

  Overlay.open();
  Overlay.onClick(closeAll);
  CommandBar.open(configObject[this.name]);
  CommandBar.onSelect((commandObject) => {
    closeAll();

    this.addEventListener("animationend", (event) => {
      this.classList.remove("pop-out-animation");
    }, { once: true });
    this.classList.add("pop-out-animation");

    const configObject = getObjectPropertyByString(Config.Settings, this.dataset.hierarchy);
    configObject[this.name] = cloneObjectInto(
      commandObject,
      window.top
    );

    this.title = browser.i18n.getMessage(`commandLabel${commandObject.command}`);
  });
  CommandBar.onCancel(closeAll);
}

function closeAll () {
  Overlay.close();
  CommandBar.close();
}
