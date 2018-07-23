'use strict'

var Config, Commands;

// fetch addon config and command data
const fetchStorage = getData();
const fetchCommands = getJsonFileAsObject(browser.runtime.getURL("res/json/commands.json"));
// run main function on data arrival
Promise.all([fetchStorage, fetchCommands]).then(main);

// get the content iframe
// note: src="#" in index.html is important to prevent the browser from loading the last dynamically set src on a normal reload
const Content = document.getElementById("Content");

// insert text from language files
const i18nTextElements = document.querySelectorAll('[data-i18n]');
      for (let element of i18nTextElements) {
        element.textContent = browser.i18n.getMessage(element.dataset.i18n);
      }

// apply onchange handler and add title to every theme button
for (const themeButton of document.querySelectorAll('#themeSwitch .theme-button')) {
  const input = document.getElementById(themeButton.htmlFor);
        input.onchange = onThemeButtonChange;
  themeButton.title = browser.i18n.getMessage(`${input.value}Theme`);
}


/**
 * main function
 * run code that depends on config data
 **/
function main (values) {
  if (Object.keys(values[0]).length > 0 && values[1]) {
    // save data to global variables
    Config = values[0];
    Commands = values[1];

    // set default page if not specified and trigger page navigation handler
    window.addEventListener("hashchange", onPageNavigation, true);
    if (!window.location.hash) location.replace('#settings');
    else onPageNavigation();

    // add data save event listeners
    window.addEventListener("visibilitychange", onTabSwitch, true);
    window.addEventListener("beforeunload", onUnload, true);

    // apply theme
    const themeStylesheet = document.getElementById("Theme");
          themeStylesheet.href = `/ui/css/themes/${Config.Settings.General.theme}.css`;
    // set corresponding theme button as active
    const themeSwitchForm = document.getElementById('themeSwitch');
          themeSwitchForm.theme.value = Config.Settings.General.theme;
  }
}


/**
 * on hash change / page navigation
 * updates the document title, navbar and the iframes content
 **/
function onPageNavigation () {
  // update the navbar entries highlighting
  const activeEntry = document.querySelector('#Sidebar .navigation .nav-item > a.active');
  const entryLink = document.querySelector('#Sidebar .navigation .nav-item > a[href="'+ window.location.hash +'"]');
  if (activeEntry) activeEntry.classList.remove("active");

  if (entryLink) {
    entryLink.classList.add("active");
    // update document title
    const sectionKey = entryLink.querySelector("[data-i18n]").dataset.i18n;
    document.title = `Gesturefy - ${browser.i18n.getMessage(sectionKey)}`;

    const hashName = window.location.hash.slice(1);
    // set iframe src location.replace is used instead of src because src adds a history entry
    Content.contentWindow.location.replace(`content/${hashName}.html`);
  }
}


/**
 * Save the current config to the storage
 * called on tab switch
 **/
function onTabSwitch () {
  if (document.visibilityState === "hidden") {
    saveData(Config);
  }
}


/**
 * Save the current config to the storage
 * called on tab close and reload
 **/
function onUnload () {
  // remove visibility event to prevent double code execution
  window.removeEventListener("visibilitychange", onTabSwitch, true);
  saveData(Config);
}


/**
* on theme/radio button change
* store the new theme
* change the theme in the main document and iframe
**/
function onThemeButtonChange () {
  // store theme in the config
  Config.Settings.General.theme = this.value;
  // create temporary transition for all elements
  const transitionStyle = document.createElement("style");
        transitionStyle.appendChild(document.createTextNode("* {transition: all .3s !important;}"));
  const transitionStyle_clone = transitionStyle.cloneNode(true);
  // apply transition to main document
  document.head.appendChild(transitionStyle);
  // apply transition to iframe
  Content.contentDocument.head.appendChild(transitionStyle_clone);

  //set theme to iframe and document
  Content.contentDocument.getElementById('Theme').href=`/ui/css/themes/${this.value}.css`;
  document.getElementById('Theme').href=`/ui/css/themes/${this.value}.css`;

  //remove temporary transition
  window.setTimeout(() => {
    transitionStyle.remove();
    transitionStyle_clone.remove();
  }, 400);
}
