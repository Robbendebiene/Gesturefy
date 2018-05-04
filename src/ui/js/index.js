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

// Get content iframe and add onload listener
const Content = document.getElementById("Content");
      Content.addEventListener("load", onContentLoad, true);

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

    // set default page
    Content.src = "content/settings.html"

    // add data save event listeners
    window.addEventListener("visibilitychange", onTabSwitch, true);
    window.addEventListener("beforeunload", onUnload, true);

    // apply theme
    const themeStylesheet = document.getElementById("Theme");
          themeStylesheet.href = `../css/themes/${Config.Settings.General.theme}.css`;

    let themeInput = document.getElementById('themeValue');
        themeInput.textContent = browser.i18n.getMessage(`themeLabel`) + " " + browser.i18n.getMessage(`${Config.Settings.General.theme}Theme`);

  }
}


/**
 * run code on iframe load
 * mainly used to update the document title and navbar
 **/
function onContentLoad () {
  // mark nav entry as active
  const fileName = Content.contentDocument.location.pathname.split("/").pop();
  const activeEntry = document.querySelector('#Sidebar > ul > li > a.active');
  const entryLink = document.querySelector('#Sidebar > ul > li > a[href="content/'+ fileName +'"]');
  if (activeEntry) activeEntry.classList.remove("active");
  if (entryLink) entryLink.classList.add("active");

  // update document title
  const sectionKey = entryLink.querySelector("[data-i18n]").dataset.i18n;
  const sectionName = browser.i18n.getMessage(sectionKey);
  document.title = `Gesturefy - ${sectionName}`;
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

















const themes = [
  "dark",
  "default"
];

let themeValues = document.getElementById('themeValues');
for (const theme of themes) {
  const valueElement = document.createElement("span");
        valueElement.dataset.val = theme;
        valueElement.innerHTML = browser.i18n.getMessage(`${theme}Theme`);
        valueElement.onmouseover = onMouseEvent;
        valueElement.onmouseout = onMouseEvent;
        valueElement.onclick = onMouseEvent;
  themeValues.appendChild(valueElement);
}


function setTheme(theme) {
  Content.contentDocument.getElementById('Theme').href=`../../css/themes/${theme}.css`;
  document.getElementById('Theme').href=`../css/themes/${theme}.css`;
}

let timer;
function onMouseEvent(event) {
  if (event.type === "click") {
    const stylesheetIframe = document.getElementById('Content').contentWindow.document.getElementById('themeStylesheet');
    Config.Settings.General.theme = this.dataset.val;
    document.getElementById('themeValue').innerHTML = browser.i18n.getMessage(`themeLabel`) + " " + browser.i18n.getMessage(`${Config.Settings.General.theme}Theme`);
    document.getElementById('themeCheckbox').checked = false;
    setTheme(Config.Settings.General.theme);
  }
  if (event.type === "mouseover") timer = window.setTimeout(hoverTheme, 300, event, this);
  if (event.type === "mouseout") {
    hoverTheme(event, this);
    window.clearTimeout(timer);
  }
}

function hoverTheme(event, element) {
  const value = event.type === "mouseout" ? Config.Settings.General.theme : element.dataset.val;
  const stylesheetIframe = document.getElementById('Content').contentWindow.document.getElementById('themeStylesheet');
  setTheme(value);
}
