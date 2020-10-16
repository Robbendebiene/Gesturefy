import { fetchHTMLAsFragment } from "/core/commons.js";

import ConfigManager from "/core/config-manager.js";

export const Config = new ConfigManager("local", browser.runtime.getURL("/resources/json/defaults.json"));


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
  for (let element of document.querySelectorAll('[data-manifest]')) {
    element.textContent = manifest[element.dataset.manifest];
  }

  // insert text from language files
  for (let element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = browser.i18n.getMessage(element.dataset.i18n);
  }

  // apply onchange handler and add title to every theme button
  for (let themeButton of document.querySelectorAll('#themeSwitch .theme-button')) {
    themeButton.onchange = onThemeButtonChange;
    themeButton.title = browser.i18n.getMessage(`${themeButton.value}Theme`);
  }
  const themeValue = Config.get("Settings.General.theme");
  // set corresponding theme button as active
  const themeSwitchForm = document.getElementById('themeSwitch');
  themeSwitchForm.theme.value = themeValue;
  // apply theme class
  document.documentElement.classList.add(`${themeValue}-theme`);

  // set default page if not specified and trigger page navigation handler
  window.addEventListener("hashchange", onPageNavigation, true);
  if (!window.location.hash) location.replace('#Settings');
  else onPageNavigation();
}


/**
 * on hash change / page navigation
 * updates the document title and navbar
 **/
function onPageNavigation () {
  // update the navbar entries highlighting
  const activeItem = document.querySelector('#Sidebar .navigation .nav-item > a.active');
  const nextItem = document.querySelector('#Sidebar .navigation .nav-item > a[href="'+ window.location.hash +'"]');

  if (activeItem) activeItem.classList.remove("active");
  if (nextItem) {
    nextItem.classList.add("active");
    // update document title
    const sectionKey = nextItem.querySelector("[data-i18n]").dataset.i18n;
    document.title = `Gesturefy - ${browser.i18n.getMessage(sectionKey)}`;
  }
}


/**
* on theme/radio button change
* store the new theme value
**/
function onThemeButtonChange () {
  // remove current theme class if any
  document.documentElement.classList.forEach(className => {
    if (className.endsWith('-theme')) {
      document.documentElement.classList.remove(className);
    }
  });
  // store new theme value in the config
  Config.set("Settings.General.theme", this.value);
  // apply theme class + transition class
  document.documentElement.classList.add(`${this.value}-theme`, "theme-transition");
  // remove temporary transition
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 400);
}