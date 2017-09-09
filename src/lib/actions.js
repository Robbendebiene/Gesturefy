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
    chrome.tabs.duplicate(this.id);
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

  RemoveRight: function () {
    chrome.tabs.query({
      currentWindow: true,
      pinned: false
    }, (tabs) => {
      for (let i = tabs.length - 1; i >= 0; i--) {
        if (tabs[i].index <= this.index) break;
        chrome.tabs.remove(tabs[i].id);
      }
    });
  },

  RemoveLeft: function () {
    chrome.tabs.query({
      currentWindow: true,
      pinned: false
    }, (tabs) => {
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].index >= this.index) break;
        chrome.tabs.remove(tabs[i].id);
      }
    });
  },

  RemoveOther: function () {
    chrome.tabs.query({
      currentWindow: true,
      pinned: false
    }, (tabs) => {
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].index !== this.index) chrome.tabs.remove(tabs[i].id);
      }
    });
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
      code: 'history.back();',
      runAt: 'document_start'
    });
  },

  Forth: function () {
    chrome.tabs.executeScript(this.id, {
      code: 'history.forward();',
      runAt: 'document_start'
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

  ScrollTop: function (data) {
    chrome.tabs.executeScript(this.id, {
      code: `
          {
            let element = closestScrollableY(TARGET);
            if (element) scrollToY(element, 0, 100);
          }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },

  ScrollBottom: function (data) {
    chrome.tabs.executeScript(this.id, {
      code: `
      {
        let element = closestScrollableY(TARGET);
        if (element) scrollToY(element, element.scrollHeight - element.clientHeight, 100);
      }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },

  ScrollPageDown: function (data) {
    chrome.tabs.executeScript(this.id, {
      code: `
        {
          let element = closestScrollableY(TARGET);
          if (element) scrollToY(element, element.scrollTop + element.clientHeight, 300);
        }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },


  ScrollPageUp: function (data) {
    chrome.tabs.executeScript(this.id, {
      code: `
        {
          let element = closestScrollableY(TARGET);
          if (element) scrollToY(element, element.scrollTop - element.clientHeight, 300);
        }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },

  Next: function () {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      let index = this.index + 1;
      if (index >= tabs.length) index = 0;
      chrome.tabs.update(tabs[index].id, { active: true });
    });
  },

  Previous: function () {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      let index = this.index - 1;
      if (index < 0) index = tabs.length - 1;
      chrome.tabs.update(tabs[index].id, { active: true });
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
	    `,
      runAt: 'document_start'
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
    if (isURL(data.selection)) data.href = data.selection;
    if (data.href) chrome.tabs.create({
      url: data.href,
      active: true,
      index: this.index + 1
    })
  },

  LinkToBackgroundTab: function (data) {
    if (isURL(data.selection)) data.href = data.selection;
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
  },

  SaveAsPDF: function () {
    browser.tabs.saveAsPDF({});
  },

  Print: function () {
    browser.tabs.print();
  },

  PrintPreview: function () {
    browser.tabs.printPreview();
  }
};
