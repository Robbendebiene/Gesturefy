'use strict'

let Actions = {
  // reverts the action if already bookmarked
  Bookmark: function (tab) {
    chrome.bookmarks.search({ url: tab.url }, (bookmarks) => {
      if (bookmarks.length > 0)
        chrome.bookmarks.remove(bookmarks[0].id)
      else chrome.bookmarks.create({
        url: tab.url,
        title: tab.title
      });
    });
  },

  Duplicate: function (tab) {
    chrome.tabs.duplicate(tab.id);
  },

  NewTab: function () {
    chrome.tabs.create({
      active: true
    })
  },

  NewTabAfter: function (tab) {
    chrome.tabs.create({
      active: true,
      index: tab.index + 1
    })
  },

  NewTabBefore: function (tab) {
    chrome.tabs.create({
      active: true,
      index: tab.index
    })
  },

  Reload: function (tab) {
    chrome.tabs.reload(tab.id);
  },

  ReloadCache: function (tab) {
    chrome.tabs.reload(tab.id, { bypassCache: true });
  },

  Remove: function (tab) {
    chrome.tabs.remove(tab.id);
  },

  Restore: function () {
    chrome.sessions.getRecentlyClosed((sessions) => {
      console.log(sessions[0].tab.title);
      chrome.sessions.restore(sessions[0].sessionId);
    });
  },

  ZoomIn: function (tab) {
    chrome.tabs.getZoom(tab.id, (z) => {
      z = Math.min(3, z * 2);
      chrome.tabs.setZoom(tab.id, z);
    });
  },

  ZoomOut: function (tab) {
    chrome.tabs.getZoom(tab.id, (z) => {
      z = Math.max(0.3, z / 2);
      chrome.tabs.setZoom(tab.id, z);
    });
  },

  ZoomReset: function (tab) {
    chrome.tabs.setZoom(tab.id, 1);
  },

  Back: function (tab) {
    chrome.tabs.executeScript(tab.id, {
      code: 'history.back();'
    });
  },

  Forth: function (tab) {
    chrome.tabs.executeScript(tab.id, {
      code: 'history.forward();'
    });
  },

  // reverts the action if already pinned
  Pin: function (tab) {
    chrome.tabs.update(tab.id, { pinned: !tab.pinned });
  },

  // reverts the action if already muted
  Mute: function (tab) {
    chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted });
  },

  ScrollTop: function (tab) {
    chrome.tabs.executeScript(tab.id, {
      code: 'window.scrollTo(0, 0);'
    });
  },

  ScrollBottom: function (tab) {
    chrome.tabs.executeScript(tab.id, {
      code: 'window.scrollTo(0, document.body.scrollHeight);'
    });
  },

  Next: function (tab) {
    chrome.tabs.query({
      index: tab.index + 1,
      currentWindow: true
    }, (tabs) => {
      if (tabs.length > 0) chrome.tabs.update(tabs[0].id, { active: true });
    });
  },

  Previous: function (tab) {
    chrome.tabs.query({
      index: tab.index - 1,
      currentWindow: true
    }, (tabs) => {
      if (tabs.length > 0) chrome.tabs.update(tabs[0].id, { active: true });
    });
  }
};
