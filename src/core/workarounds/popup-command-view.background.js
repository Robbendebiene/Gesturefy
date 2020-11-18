const messageSubjects = ["popupInitiation", "popupTermination"];

/**
 * message handler - listens for content tab script messages
 * forwards them to main frame
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // check for iframe message subjects
  if (messageSubjects.includes(message.subject)) {
    // forwards the message to the main page containing all the data that was previously sent
    // also forward the promise responses
    return browser.tabs.sendMessage(sender.tab.id, message, { frameId: 0 });
  }
});