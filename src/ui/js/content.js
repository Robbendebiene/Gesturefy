import {
  getObjectPropertyByString
} from "/core/commons.js";

export const Config = window.top.Config;
export const Manifest = browser.runtime.getManifest();
export const Commands = window.top.Commands;
export const CommandSettingTemplates = window.top.document.getElementById("CommandSettings").content;

/**
 * insert text and data
 * apply default event listeners
 **/

// insert text from manifest
const manifestTextElements = document.querySelectorAll('[data-manifest]');
      for (let element of manifestTextElements) {
        element.textContent = Manifest[element.dataset.manifest];
      }

// insert text from language files
const i18nTextElements = document.querySelectorAll('[data-i18n]');
      for (let element of i18nTextElements) {
        element.textContent = browser.i18n.getMessage(element.dataset.i18n);
      }

// apply values to input fields and add their event function
const inputs = document.querySelectorAll(".color-select-field, .select-field, .input-field, .toggle-button");
      for (let input of inputs) {
        const value = getObjectPropertyByString(Config, input.dataset.configHierarchy)[input.name];
        if (input.type === "checkbox") input.checked = value;
        else input.value = value;
        input.addEventListener('change', onInput);
      }

// toggle collapsables and add their event function
const collapses = document.querySelectorAll("[data-collapse]");
      for (let collapse of collapses) {
        collapse.addEventListener('change', onCollapse);
        onCollapse.call(collapse);
      }

// apply theme
const themeStylesheet = document.getElementById("Theme");
      themeStylesheet.href = `/ui/css/themes/${Config.Settings.General.theme}.css`;


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
    // set property to given object hierarchy https://stackoverflow.com/a/33397682/3771196
    getObjectPropertyByString(Config, this.dataset.configHierarchy)[this.name] = value;
  }
}


/**
 * hide or show on collapse toggle
 **/
function onCollapse (event) {
  const targetElements = document.querySelectorAll(this.dataset["collapse"]);

  for (let element of targetElements) {
    // if user dispatched the function, then hide with animation, else hide without animation
    if (event) {
      element.addEventListener("transitionend", (event) => {
        event.currentTarget.classList.remove("animate");
      }, { once: true });
      element.classList.add("animate");

      if (!this.checked) {
        element.style.height = element.scrollHeight + "px";
        // trigger reflow
        element.offsetHeight;
      }
    }

    if (element.style.height === "0px" && this.checked)
      element.style.height = element.scrollHeight + "px";

    else if (!this.checked)
      element.style.height = "0px";
  }
}
