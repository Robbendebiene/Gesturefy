'use strict'

/**
 * TODO:
 * - massive code tidy up
 * - background script - only hold necessary settings?
 * - update command setting templates + language descriptions
 */

var Config, Commands;

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
});


document.addEventListener("DOMContentLoaded", () => {
    console.log("document load");
  insertTextualData(document);
});



window.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveData(Config);
    propagateData({
      subject: "settingsChange",
      data: Config.Settings
    });
  }
});



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
