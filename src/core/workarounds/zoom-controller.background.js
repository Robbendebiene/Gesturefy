/**
 * propagate zoom factor on zoom change
 * necessary to calculate the correct mouse position for iframes
 **/
browser.tabs.onZoomChange.addListener((info) => {
  propagateZoomFactor(info.tabId, info.newZoomFactor);
});


/**
 * return zoom factor on content script zoom requests
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.subject === "zoomFactorRequest") {
    return browser.tabs.getZoom(sender.tab.id);
  }
});


/**
 * propagates a zoomChange message to a specific tab
 * this is used to inform tabs about their zoom factor
 **/
function propagateZoomFactor (tabId, zoom) {
  browser.tabs.sendMessage(
    tabId,
    {
      subject: "zoomChange",
      data: {zoomFactor: zoom}
    },
    { frameId: 0 }
  );
}