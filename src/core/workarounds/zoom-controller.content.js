/**
 * ZoomController "singleton"
 * detects zoom changes propagated by the background script
 **/


// public methods and variables


export default {
  get zoomFactor () {
    return zoomFactor;
  }
}


// private variables and methods


// initialize zoom factor
let zoomFactor = 1;

// add the message event listener
browser.runtime.onMessage.addListener(handleMessage);

// request the zoom factor on initial load
const requestZoomFactor = browser.runtime.sendMessage({
  subject: "zoomFactorRequest",
  data: {}
});
requestZoomFactor.then(value => zoomFactor = value);


/**
 * Handles zoom factor changes messages from the background page
 **/
function handleMessage (message, sender, sendResponse) {
  if (message.subject === "zoomChange") zoomFactor = message.data.zoomFactor;
}