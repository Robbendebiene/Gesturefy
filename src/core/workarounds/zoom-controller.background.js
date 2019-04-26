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


/**
 * propagate zoom factor on zoom change
 * necessary to calculate the correct mouse position for iframes
 **/
browser.tabs.onZoomChange.addListener((info) => propagateZoomFactor(info.tabId, info.newZoomFactor));

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.subject === "zoomFactorRequest") {
    const zoomQuery = browser.tabs.getZoom(sender.tab.id);
    zoomQuery.then((zoom) => propagateZoomFactor(sender.tab.id, zoom));
  }
});