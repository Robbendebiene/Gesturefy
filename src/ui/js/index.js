'use strict'

/**
 * TODO:
 * - massive code tidy up
 * - background script - only hold necessary settings?
 * - update command setting templates + language descriptions
 */

var Config, Commands;

let themes = [
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

/**
 * Get content iframe
 **/
const Content = document.getElementById("Content");


const fetchStorage = getData();
const fetchCommands = getJsonFileAsObject(browser.runtime.getURL("res/json/commands.json"));

Promise.all([fetchStorage, fetchCommands]).then((values) => {
  if (Object.keys(values[0]).length > 0 && values[1]) {
    Config = values[0];
    Commands = values[1];
    main();
  }
});



// setup iframes content
Content.addEventListener("load", () => {

  console.log("iframe load");
  insertTextualData(Content.contentDocument);

  // run the iframes main function if existing
  if (Content.contentWindow.main) {
    Content.contentWindow.main();
  }

  const fileName = Content.contentDocument.location.pathname.split("/").pop();
  const activeEntry = document.querySelector('#Sidebar > ul > li > a.active');
  const entryLink = document.querySelector('#Sidebar > ul > li > a[href="'+ fileName +'"]');
  if (activeEntry !== null) activeEntry.classList.remove("active");
  if (entryLink !== null) entryLink.classList.add("active");

  const hash = "Settings";
  const sectionName = browser.i18n.getMessage(`navigation${hash}`);
  document.title = `Gesturefy - ${decodeHtml(sectionName)}`;

  let themeInput = document.getElementById('themeValue');
      themeInput.innerHTML = browser.i18n.getMessage(`themeLabel`) + " " + browser.i18n.getMessage(`${Config.Settings.General.theme}Theme`);

  appendLinkInIframe();
});


document.addEventListener("DOMContentLoaded", () => {
    console.log("document load");
  insertTextualData(document);
});



// automatically propagate messages on storage change?
// should be defined in the background script

window.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveData(Config);
    propagateData({
      subject: "configChange",
      data: {
        Settings: Config.Settings,
        Blacklist: Config.Blacklist
      }
    });
  }
});


// instead maybe send a message/propagete the settings change to the background


// -- FUNCTIONS -- \\


/**
 * convert a string containing entities
 * https://stackoverflow.com/a/7394787
 **/
function decodeHtml (html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}


function insertTextualData (doc) {
  const manifest = browser.runtime.getManifest();
  // insert text from manifest
  const manifestTextElements = doc.querySelectorAll('[data-manifest]');
        for (let element of manifestTextElements) {
          element.textContent = manifest[element.dataset.manifest];
        }

  // insert text from language files (innerHTML required for entities)
  const i18nTextElements = doc.querySelectorAll('[data-i18n]');
        for (let element of i18nTextElements) {
          element.textContent = decodeHtml(
            browser.i18n.getMessage(element.dataset.i18n)
          )
        }
}


function insertConfigurationData (node) {

}












// -- MAIN CODE -- \\

function main () {



}

function appendLinkInIframe() {
  const doc = document.getElementById('Content').contentWindow.document;
  const linkElement = doc.createElement("link");
        linkElement.rel = "stylesheet";
        linkElement.id = "themeStylesheet";
  doc.head.appendChild(linkElement);

  setTheme(Config.Settings.General.theme, linkElement);
}

function setTheme(theme, linkElement) {
  linkElement.href = `../../css/themes/${theme}Theme.css`;
  document.getElementById('themeStylesheet').href=`../css/themes/${theme}Theme.css`;
}

let timer;
function onMouseEvent(event) {
  if (event.type === "click") {
    const stylesheetIframe = document.getElementById('Content').contentWindow.document.getElementById('themeStylesheet');
    Config.Settings.General.theme = this.dataset.val;
    document.getElementById('themeValue').innerHTML = browser.i18n.getMessage(`themeLabel`) + " " + browser.i18n.getMessage(`${Config.Settings.General.theme}Theme`);
    document.getElementById('themeCheckbox').checked = false;
    setTheme(Config.Settings.General.theme, stylesheetIframe);
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
  setTheme(value, stylesheetIframe);
}
