/**
 * User Script Controller
 * helper to safely execute custom user scripts in the page context
 * will hopefully one day be replaced with https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/userScripts
 **/

// add the message event listener
browser.runtime.onMessage.addListener(handleMessage);

/**
 * Handles user script execution messages from the user script command
 **/
function handleMessage (message, sender, sendResponse) {
  if (message.subject === "executeUserScript") {
    // create function in page script scope (not content script scope)
    // so it is not executed as privileged extension code and thus has no access to webextension apis
    // this also prevents interference with the extension code
    const executeUserScript = new window.wrappedJSObject.Function("TARGET", message.data);
    executeUserScript(window.TARGET_HIERARCHY[0]);
  }
}