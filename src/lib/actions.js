'use strict'

let Actions = {
  // reverts the action if already bookmarked
  Bookmark: function () {
    chrome.bookmarks.search({ url: this.url }, (bookmarks) => {
      if (bookmarks.length > 0)
        chrome.bookmarks.remove(bookmarks[0].id)
      else chrome.bookmarks.create({
        url: this.url,
        title: this.title
      });
    });
  },

  Duplicate: function () {
    chrome.thiss.duplicate(this.id);
  },

  NewTab: function () {
    chrome.tabs.create({
      active: true
    })
  },

  NewTabAfter: function () {
    chrome.tabs.create({
      active: true,
      index: this.index + 1
    })
  },

  NewTabBefore: function () {
    chrome.tabs.create({
      active: true,
      index: this.index
    })
  },

  Reload: function () {
    chrome.tabs.reload(this.id);
  },

  ReloadCache: function () {
    chrome.tabs.reload(this.id, { bypassCache: true });
  },

  Remove: function () {
    chrome.tabs.remove(this.id);
  },

  Restore: function () {
    chrome.sessions.getRecentlyClosed((sessions) => {
      chrome.sessions.restore(sessions[0].sessionId);
    });
  },

  ZoomIn: function () {
    chrome.tabs.getZoom(this.id, (z) => {
      z = Math.min(3, z * 2);
      chrome.tabs.setZoom(this.id, z);
    });
  },

  ZoomOut: function () {
    chrome.tabs.getZoom(this.id, (z) => {
      z = Math.max(0.3, z / 2);
      chrome.tabs.setZoom(this.id, z);
    });
  },

  ZoomReset: function () {
    chrome.tabs.setZoom(this.id, 1);
  },

  Back: function () {
    chrome.tabs.executeScript(this.id, {
      code: 'history.back();'
    });
  },

  Forth: function () {
    chrome.tabs.executeScript(this.id, {
      code: 'history.forward();'
    });
  },

  // reverts the action if already pinned
  Pin: function () {
    chrome.tabs.update(this.id, { pinned: !this.pinned });
  },

  // reverts the action if already muted
  Mute: function () {
    chrome.tabs.update(this.id, { muted: !this.mutedInfo.muted });
  },

  ScrollTop: function () {
    chrome.tabs.executeScript(this.id, {
      code: 'window.scrollTo(0, 0);'
    });
  },

  ScrollBottom: function () {
    chrome.tabs.executeScript(this.id, {
      code: 'window.scrollTo(0, document.body.scrollHeight);'
    });
  },

  Next: function () {
    chrome.tabs.query({
      index: this.index + 1,
      currentWindow: true
    }, (tabs) => {
      if (tabs.length > 0) chrome.tabs.update(tabs[0].id, { active: true });
    });
  },

  Previous: function () {
    chrome.tabs.query({
      index: this.index - 1,
      currentWindow: true
    }, (tabs) => {
      if (tabs.length > 0) chrome.tabs.update(tabs[0].id, { active: true });
    });
  },

  Maximize: function () {
    chrome.windows.getCurrent((win) => {
      chrome.windows.update(win.id, {
        state: 'maximized'
      });
    });
  },

  Minimize: function () {
    chrome.windows.getCurrent((win) => {
      chrome.windows.update(win.id, {
        state: 'minimized'
      });
    });
  },

  // maximizes the window if it is already in full screen mode
  Fullscreen: function () {
    chrome.windows.getCurrent((win) => {
      if (win.state === 'fullscreen') chrome.windows.update(win.id, {
        state: 'maximized'
      });
      else chrome.windows.update(win.id, {
        state: 'fullscreen'
      });
    });
  },

  NewWindow: function () {
    chrome.windows.create({});
  },

  NewPrivateWindow: function () {
    chrome.windows.create({
      incognito: true
    });
  },

  TabToWindow: function () {
    chrome.windows.create({
      tabId: this.id
    });
  },

  CloseWindow: function () {
    chrome.windows.remove(this.windowId);
  },

  ReloadAll: function () {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      for (let tab of tabs)
        chrome.tabs.reload(tab.id);
    });
  },

  ReloadAllCaches: function () {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      for (let tab of tabs)
        chrome.tabs.reload(tab.id, { bypassCache: true });
    });
  },

  URLLevelUp: function () {
    chrome.tabs.executeScript(this.id, {
      code: `
    		if (window.location.href[window.location.href.length - 1] === "/")
    			window.location.href = "../";
    		else
    			window.location.href = "./";
	    `
    });
  },

  ImageToTab: function (data) {
    if (data.src) chrome.tabs.create({
      url: data.src,
      active: true,
      index: this.index + 1
    })
  },

  LinkToForegroundTab: function (data) {
    if (data.href) chrome.tabs.create({
      url: data.href,
      active: true,
      index: this.index + 1
    })
  },

  LinkToBackgroundTab: function (data) {
    if (data.href) chrome.tabs.create({
      url: data.href,
      active: false,
      index: this.index + 1
    })
  },

  SearchSelection: function (data) {
    chrome.tabs.create({
      url: 'https://www.google.com/search?q=' + data.selection,
      active: true,
      index: this.index + 1
    })
  }
};
