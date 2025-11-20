import { fetchHTMLAsFragment } from "/views/shared/commons.mjs";

import ConfigManager from "/core/services/config-manager.mjs";

import DefaultConfig from "/resources/configs/defaults.mjs";

export const Config = new ConfigManager({
  defaults: DefaultConfig
});

const Resources = [ Config.loaded ];

// load and insert external html fragments
for (let element of document.querySelectorAll('[data-include]')) {
  const fetchingHTML = fetchHTMLAsFragment(browser.runtime.getURL(element.dataset.include));
        fetchingHTML.then((fragment) => element.appendChild(fragment));
  // add to resources
  Resources.push(fetchingHTML);
}

export const ContentLoaded = Promise.all(Resources);

ContentLoaded.then(main);

/**
 * main function
 * run code that depends on async resources
 **/
function main () {
  // insert text from manifest
  const manifest = browser.runtime.getManifest();
  for (const element of document.querySelectorAll('[data-manifest]')) {
    element.textContent = manifest[element.dataset.manifest];
  }

  // apply values to input fields and add their event function
  for (const input of document.querySelectorAll("[data-config]")) {
    const value = Config.get(input.dataset.config);
    if (input.type === "checkbox") {
      input.checked = value;
    }
    else if (input.type === "radio") {
      input.checked = input.value === value;
    }
    else input.value = value;
    input.addEventListener('change', onChange);
  }

  // register event listener for collapsible items and toggle them
  for (const trigger of document.querySelectorAll('input[type="checkbox"][data-collapse]')) {
    trigger.addEventListener('change', onCollapseTrigger);
    onCollapseTrigger.call(trigger);
  }

  // apply onchange handler and add title to every theme button
  for (const themeButton of document.querySelectorAll('#themeSwitch .theme-button')) {
    themeButton.onchange = onThemeButtonChange;
    themeButton.title = browser.i18n.getMessage(`${themeButton.value}Theme`);
  }
  // apply theme class
  const themeValue = Config.get("Settings.General.theme");
  document.documentElement.classList.add(`${themeValue}-theme`);

  // set default page if not specified and trigger page navigation handler
  window.addEventListener("hashchange", onPageNavigation, true);
  if (!window.location.hash) location.replace('#Gestures');
  else onPageNavigation();

  // set loaded class and render everything
  document.documentElement.classList.add("loaded");
}

/**
 * on hash change / page navigation
 * updates the document title and navbar
 **/
function onPageNavigation () {
  // update the navbar entries highlighting
  const activeItem = document.querySelector('#Sidebar .navigation .nav-item > a.active');
  const nextItem = document.querySelector('#Sidebar .navigation .nav-item > a[href="'+ window.location.hash +'"]');

  if (activeItem) {
    activeItem.classList.remove("active");
  }
  if (nextItem) {
    nextItem.classList.add("active");
    // update document title
    const sectionKey = nextItem.querySelector("locale-text[key]").key;
    document.title = `Gesturefy - ${browser.i18n.getMessage(sectionKey)}`;
  }
}

/**
 * on theme/radio button change
 * store the new theme value
 **/
function onThemeButtonChange () {
  // remove current theme class if any
  document.documentElement.classList.forEach((className) => {
    if (className.endsWith('-theme')) {
      document.documentElement.classList.remove(className);
    }
  });
  // apply theme class + transition class
  document.documentElement.classList.add(`${this.value}-theme`, "theme-transition");
  // remove temporary transition
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 400);
}

/**
 * save input value if valid
 **/
function onChange () {
  // check if valid, if there is no validity property check if value is set
  if ((this.validity && this.validity.valid) || (!this.validity && this.value)) {
    let value;
    // get true or false for checkboxes
    if (this.type === "checkbox") value = this.checked;
    // get value either as string or number
    else value = isNaN(this.valueAsNumber) ? this.value : this.valueAsNumber;
    // save to config
    Config.set(this.dataset.config, value);
  }
}

/**
 * trigger collapsible-items from toggle buttons using custom selector supplied via dataset attribute
 **/
function onCollapseTrigger (event) {
  document.querySelector(this.dataset.collapse).collapsed = !this.checked;
}
