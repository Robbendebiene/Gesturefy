'use strict'


const Config = window.top.Config;
const Commands = window.top.Commands;
const SettingTemplates = window.top.document.getElementById("CommandSettings").content;
      CommandBar.init(Commands, SettingTemplates);


// apply values to input fields and add their event function
const inputs = document.querySelectorAll(".select-field, .toggle-button");
      for (let input of inputs) {
        const value = getObjectPropertyByString(Config.Settings, input.dataset.hierarchy)[input.name];
        if (input.type === "checkbox") input.checked = value;
        else input.value = value;
        input.addEventListener('change', onInput);
      }


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

    getObjectPropertyByString(Config.Settings, this.dataset.hierarchy)[this.name] = commandItem;
    this.title = browser.i18n.getMessage(`commandName${commandItem.command}`);
  });
}


/**
 * save input value if valid
 **/
function onInput () {
  if (this.validity.valid) {
    let value;
    // get true or false for checkboxes
    if (this.type === "checkbox") value = this.checked;
    // get value either as string or number
    else value = isNaN(this.valueAsNumber) ? this.value : this.valueAsNumber;
    // set property to given object hierarchy
    getObjectPropertyByString(Config.Settings, this.dataset.hierarchy)[this.name] = value;
  }
}




/**
 * helper function do get property by string concatenated with dots
 **/
function getObjectPropertyByString (object, string) {
  // get property from object hierarchy https://stackoverflow.com/a/33397682/3771196
  return string.split('.').reduce((o,i) => o[i], object);
}
