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

  NewTab: function (data) {
    let index = null;

    if (data.newTabPosition === "after")
      index = this.index + 1;
    else if (data.newTabPosition === "before")
      index = this.index;

    chrome.tabs.create({
      active: true,
      index: index
    })
  },

  Reload: function () {
    chrome.tabs.reload(this.id);
  },

  ReloadCache: function () {
    chrome.tabs.reload(this.id, { bypassCache: true });
  },

  StopLoading: function () {
    chrome.tabs.executeScript(this.id, {
      code: 'window.stop()',
      runAt: 'document_start'
    });
  },

  Remove: function (data) {
    chrome.tabs.query({
      windowId: this.windowId
    }, (tabs) => {
      // if there are other tabs to focus
      if (tabs.length > 1) {
        let nextTab = null, index;
        // get right or left tab if existing
        if (data.removeTabFocus === "right" || data.removeTabFocus === "left") {
          if (data.removeTabFocus === "right")
            index = this.index < tabs.length - 1 ? this.index + 1 : this.index - 1;
          else
            index = this.index > 0 ? this.index - 1 : this.index + 1;
          nextTab = tabs.find((element) => element.index === index);
        }
        // get the previous tab
        else if (data.removeTabFocus === "previous") {
          nextTab = tabs.reduce((previous, current) => {
            return previous.lastAccessed > current.lastAccessed || current.active ? previous : current;
          });
        }
        if (nextTab) chrome.tabs.update(nextTab.id, { active: true });
      }
      // remove tab
      chrome.tabs.remove(this.id);
    });
  },

  RemoveRight: function () {
    chrome.tabs.query({
      currentWindow: true,
      pinned: false
    }, (tabs) => {
      // filter all tabs to the right
      tabs = tabs.filter((tab) => tab.index > this.index);
      // create array of tap ids
      tabs = tabs.map((tab) => tab.id);
      chrome.tabs.remove(tabs);
    });
  },

  RemoveLeft: function () {
    chrome.tabs.query({
      currentWindow: true,
      pinned: false
    }, (tabs) => {
      // filter all tabs to the left
      tabs = tabs.filter((tab) => tab.index < this.index);
      // create array of tap ids
      tabs = tabs.map((tab) => tab.id);
      chrome.tabs.remove(tabs);
    });
  },

  RemoveOther: function () {
    chrome.tabs.query({
      currentWindow: true,
      pinned: false,
      active: false
    }, (tabs) => {
      // create array of tap ids
      tabs = tabs.map((tab) => tab.id);
      chrome.tabs.remove(tabs);
    });
  },

  Restore: function () {
    chrome.sessions.getRecentlyClosed((sessions) => {
      chrome.sessions.restore(sessions[0].sessionId);
    });
  },

  ZoomIn: function (data) {
    let zoomLevels = [.3, .5, .67, .8, .9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];

    chrome.tabs.getZoom(this.id, (z) => {
      if (data.zoomStep)
        z = Math.min(3, z + data.zoomStep/100);
      else
        z = zoomLevels.find((element) => element > z) || 3;
      chrome.tabs.setZoom(this.id, z);
    });
  },

  ZoomOut: function (data) {
    let zoomLevels = [3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, .9, .8, .67, .5, .3];

    chrome.tabs.getZoom(this.id, (z) => {
      if (data.zoomStep)
        z = Math.max(.3, z - data.zoomStep/100);
      else
        z = zoomLevels.find((element) => element < z) || .3;
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
            if (element) scrollToY(element, 0, ${data.scrollDuration});
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
        if (element) scrollToY(element, element.scrollHeight - element.clientHeight, ${data.scrollDuration});
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
          if (element) scrollToY(element, element.scrollTop + element.clientHeight * 0.95, ${data.scrollPageDuration});
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
          if (element) scrollToY(element, element.scrollTop - element.clientHeight * 0.95, ${data.scrollPageDuration});
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

      let tab = tabs.find((element) => element.index === index);
      chrome.tabs.update(tab.id, { active: true });
    });
  },

  Previous: function () {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      let index = this.index - 1;
      if (index < 0) index = tabs.length - 1;

      let tab = tabs.find((element) => element.index === index);
      chrome.tabs.update(tab.id, { active: true });
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
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src)
      chrome.tabs.create({
        url: data.target.src,
        active: true,
        index: this.index + 1
      })
  },

  LinkToForegroundTab: function (data) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;

    if (url || data.newTabOnEmptyLink) chrome.tabs.create({
      url: url,
      active: true,
      index: this.index + 1
    })
  },

  LinkToBackgroundTab: function (data) {
    let url = null;
    let index = this.index + 1;

    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;
    // get tabs previously opened by this tab
    chrome.tabs.query({
      openerTabId: this.id
    }, (tabs) => {
      // if there are any previously opened tabs
      if (tabs.length > 0) {
        // get highest index and increment it
        index = tabs.reduce((pre, cur) => pre.index > cur.index ? pre : cur).index + 1;
      }
      // if not then this is the first time a background tab gets opened
      else {
        let tabId = this.id;
        // add "active tab changed" event once
        chrome.tabs.onActivated.addListener(function handler () {
          // get affected tabs
          chrome.tabs.query({
            openerTabId: tabId
          }, (tabs) => {
            // remove openerTabId by setting it to the tabs id
            for (let tab of tabs) chrome.tabs.update(tab.id, {openerTabId: tab.id});
          });
          // remove listener
          chrome.tabs.onActivated.removeListener(handler);
        });
      }

      // open new tab
      if (url || data.newTabOnEmptyLink) chrome.tabs.create({
        url: url,
        active: false,
        index: index,
        openerTabId: this.id
      })
    });
  },

  LinkToBookmark: function (data) {
    let url = null, title = null;

    if (isURL(data.textSelection))
      url = data.textSelection;
    else if (data.link && data.link.href) {
      url = data.link.href;
      title = data.link.title || data.link.textContent || data.target.title || null;
    }

    if (url) chrome.bookmarks.create({
      url: url,
      title: title || new URL(url).hostname
    });
  },

  SearchSelection: function (data) {
    chrome.tabs.create({
      url: data.searchEngineURL + encodeURIComponent(data.textSelection),
      active: data.focusSearchResult,
      index: this.index + 1
    })
  },

  OpenHomepage: function (data) {
    if (this.pinned) chrome.tabs.create({
      url: data.homepageURL,
      active: true,
    });
    else chrome.tabs.update(this.id, {
      url: data.homepageURL
    });
  },

  OpenLink: function (data) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;

    if (url) {
      if (this.pinned) {
        chrome.tabs.query({
          currentWindow: true,
          pinned: false
        }, (tabs) => {
          // get the lowest index excluding pinned tabs
          let mostLeftTabIndex = tabs.reduce((min, cur) => min.index < cur.index ? min : cur).index;
          chrome.tabs.create({
            url: url,
            active: true,
            index: mostLeftTabIndex
          });
        });
      }
      else chrome.tabs.update(this.id, {
        url: url
      });
    }
  },

  SaveAsPDF: function () {
    browser.tabs.saveAsPDF({});
  },

  Print: function () {
    browser.tabs.print();
  },

  PrintPreview: function () {
    browser.tabs.printPreview();
  },

  SaveScreenshot: function () {
    chrome.tabs.captureVisibleTab((url) => {
      // convert data uri to blob
      let binary = atob(url.split(',')[1]),
          array = [];
      for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      // convert blob to object url
      url = URL.createObjectURL(
        new Blob([new Uint8Array(array)], {type: "image/png"})
      );

      // remove special windows file name characters
      chrome.downloads.download({
        url: url,
        filename: this.title.replace(/[\\\/\:\*\?"\|]/g, '') + '.png',
        saveAs: true
      }, (downloadId) => {
        // catch error and free the blob for gc
        if (chrome.runtime.lastError) URL.revokeObjectURL(url);
        else chrome.downloads.onChanged.addListener(function clearURL(downloadDelta) {
          if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
            URL.revokeObjectURL(url);
            chrome.downloads.onChanged.removeListener(clearURL);
          }
        });
      });
    });
  },

  CopyTabURL: function () {
    let input = document.createElement("textarea");
    document.body.append(input);
    input.value = this.url;
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  },

  CopyTextSelection: function (data) {
    let input = document.createElement("textarea");
    document.body.append(input);
    input.value = data.textSelection;
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  },

  CopyImage: function (data) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      // get type by file extension, default type is png
      let fileType = "png", mimeType = "image/png";
      if (data.target.src.split('.').pop().toLowerCase() === "jpg") {
        fileType = "jpeg";
        mimeType = "image/jpeg";
      }
      // load image
      let image = new Image();
          image.onload = () => {
            let canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                // draw image to canvas
                canvas.getContext("2d").drawImage(image, 0, 0);
                // get image as blob
                canvas.toBlob((blob) => {
                  let fileReader = new FileReader();
                      // convert blob to array buffer
                      fileReader.onload = () => chrome.clipboard.setImageData(fileReader.result, fileType);
                      fileReader.readAsArrayBuffer(blob);
                }, mimeType);
          };
          image.src = data.target.src;
    }
  }
};
