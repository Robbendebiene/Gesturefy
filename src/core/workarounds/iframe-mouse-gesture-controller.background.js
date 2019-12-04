const messageSubjects = ["mouseGestureStart", "mouseGestureUpdate", "mouseGestureEnd"];

/**
 * message handler - listens for iframe content tab script messages
 * forward iframe message data to main page
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // check for iframe message subjects and the message source
  if (messageSubjects.includes(message.subject) && sender.frameId > 0) {
    // forwards the message to the main page containing all the data that was previously sent
    browser.tabs.sendMessage(sender.tab.id, message, { frameId: 0 });
  }
});