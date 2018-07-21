'use strict'

/**
 * TODO:
 * - update command setting templates + language descriptions
 */

var Config, Commands;

// fetch addon config and command data
const fetchStorage = getData();
const fetchCommands = getJsonFileAsObject(browser.runtime.getURL("res/json/commands.json"));
// run main function on data arrival
Promise.all([fetchStorage, fetchCommands]).then(main);

// get the content iframe
// note: src="#" in index.html is important to prevent the browser from loading the last dynamically set src on a normal reload
const Content = document.getElementById("Content");

// insert text from language files (innerHTML required for entities)
const i18nTextElements = document.querySelectorAll('[data-i18n]');
      for (let element of i18nTextElements) {
        element.textContent = browser.i18n.getMessage(element.dataset.i18n);
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
          themeStylesheet.href = `../css/themes/${Config.Settings.General.theme}.css`;

    applyThemeButtons();
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















function applyThemeButtons() {
  for (const theme of document.querySelectorAll('#themes > label')) {
    if (theme.dataset.val === Config.Settings.General.theme) document.getElementById(theme.getAttribute('for')).checked = true;
    theme.onclick = onMouseEvent;
  }

  function onMouseEvent() {
    Config.Settings.General.theme = this.dataset.val;
    setTheme(Config.Settings.General.theme);
  }

  function setTheme(theme) {
    const transitionStyle = document.createElement("style");
          transitionStyle.appendChild(document.createTextNode("* {transition: all .3s !important;}"));
    const transitionStyle_clone = transitionStyle.cloneNode(true);
    document.head.appendChild(transitionStyle);
    Content.contentDocument.head.appendChild(transitionStyle_clone);

    Content.contentDocument.getElementById('Theme').href=`../../css/themes/${theme}.css`;
    document.getElementById('Theme').href=`../css/themes/${theme}.css`;

    window.setTimeout(function () {
      document.head.removeChild(transitionStyle);
      Content.contentDocument.head.removeChild(transitionStyle_clone);
    }, 400);
  }
}
