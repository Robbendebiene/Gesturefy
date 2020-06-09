const messageSubjects = ["mouseGestureControllerPreparePreventDefault", "mouseGestureControllerNeglectPreventDefault"];

/**
 * message handler - listens for content tab script messages
 * forwards them to all other frames
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // check for iframe message subjects
  if (messageSubjects.includes(message.subject)) {
    // forwards the message to all frames
    browser.tabs.sendMessage(sender.tab.id, message);
  }
});