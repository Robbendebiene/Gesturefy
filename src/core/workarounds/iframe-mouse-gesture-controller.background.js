const messageSubjects = ["gestureFrameMousedown", "gestureFrameMousemove", "gestureFrameMouseup"];

/**
 * message handler - listens for iframe content tab script messages
 * forward iframe message data to main page
 **/
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (messageSubjects.includes(message.subject)) {
    // message was sent by frame
    if (sender.frameId > 0) {
      // forwards the message to the main page containing all the data that was previously sent including the frameId
      browser.tabs.sendMessage(
        sender.tab.id,
        {
          subject: message.subject,
          data: Object.assign(
            message.data,
            { frameId: sender.frameId }
          )
        },
        { frameId: 0 }
      );
    }
  }
});