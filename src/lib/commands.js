'use strict'

const Commands = {
  DuplicateTab: function () {
    browser.tabs.duplicate(this.id);
  },

  NewTab: function (data, settings) {
    let index = null;

    if (settings.position === "after")
      index = this.index + 1;
    else if (settings.position === "before")
      index = this.index;

    browser.tabs.create({
      active: true,
      index: index
    })
  },

  ReloadTab: function (data, settings) {
    browser.tabs.reload(this.id, { bypassCache: settings.cache });
  },

  StopLoading: function () {
    browser.tabs.executeScript(this.id, {
      code: 'window.stop()',
      runAt: 'document_start'
    });
  },

  CloseTab: function (data, settings) {
    // remove tab if not pinned or remove-pinned-tabs option is enabled
    if (settings.pinnedTabs || !this.pinned) {
      chrome.tabs.query({
        windowId: this.windowId
      }, (tabs) => {
        // if there are other tabs to focus
        if (tabs.length > 1) {
          let nextTab = null, index;
          // get right or left tab if existing
          if (settings.focus === "right" || settings.focus === "left") {
            if (settings.focus === "right")
              index = this.index < tabs.length - 1 ? this.index + 1 : this.index - 1;
            else
              index = this.index > 0 ? this.index - 1 : this.index + 1;
            nextTab = tabs.find((element) => element.index === index);
          }
          // get the previous tab
          else if (settings.focus === "previous") {
            nextTab = tabs.reduce((previous, current) => {
              return previous.lastAccessed > current.lastAccessed || current.active ? previous : current;
            });
          }
          if (nextTab) chrome.tabs.update(nextTab.id, { active: true });
        }
        chrome.tabs.remove(this.id);
      });
    }
  },

  CloseRightTabs: function () {
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

  CloseLeftTabs: function () {
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

  CloseOtherTabs: function () {
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

  RestoreTab: function () {

// ÄNDERN NICHT VERGESSEN + OPTION RESTORE https://github.com/Robbendebiene/Gesturefy/pull/251


    chrome.sessions.getRecentlyClosed((sessions) => {
      const tabsOfCurrentWindow = sessions.filter(session => session.tab && session.tab.windowId === this.windowId);

      if (tabsOfCurrentWindow.length > 0) {
        console.log(tabsOfCurrentWindow, sessions);
      }

      const mostRecently = sessions.reduce((prev, curr) => prev.lastModified > curr.lastModified ? prev : curr);
      for (let session of sessions) {
        console.log(mostRecently, this, session);
      }



      chrome.sessions.restore(sessions[0].sessionId);
    });
  },

  ZoomIn: function (data, settings) {
    let zoomLevels = [.3, .5, .67, .8, .9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];

    chrome.tabs.getZoom(this.id, (z) => {
      if (settings.step)
        z = Math.min(3, z + settings.step/100);
      else
        z = zoomLevels.find((element) => element > z) || 3;
      chrome.tabs.setZoom(this.id, z);
    });
  },

  ZoomOut: function (data, settings) {
    let zoomLevels = [3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, .9, .8, .67, .5, .3];

    chrome.tabs.getZoom(this.id, (z) => {
      if (settings.step)
        z = Math.max(.3, z - settings.step/100);
      else
        z = zoomLevels.find((element) => element < z) || .3;
      chrome.tabs.setZoom(this.id, z);
    });
  },

  ZoomReset: function () {
    browser.tabs.setZoom(this.id, 1);
  },

  PageBack: function () {
    browser.tabs.executeScript(this.id, {
      code: 'history.back();',
      runAt: 'document_start'
    });
  },

  PageForth: function () {
    browser.tabs.executeScript(this.id, {
      code: 'history.forward();',
      runAt: 'document_start'
    });
  },

  // reverts the action if already pinned
  TogglePin: function () {
    browser.tabs.update(this.id, { pinned: !this.pinned });
  },

  // reverts the action if already muted
  ToggleMute: function () {
    browser.tabs.update(this.id, { muted: !this.mutedInfo.muted });
  },

  // reverts the action if already bookmarked
  ToggleBookmark: function () {
    chrome.bookmarks.search({ url: this.url }, (bookmarks) => {
      if (bookmarks.length > 0)
        chrome.bookmarks.remove(bookmarks[0].id)
      else chrome.bookmarks.create({
        url: this.url,
        title: this.title
      });
    });
  },


  ScrollTop: function (data, settings) {
    browser.tabs.executeScript(this.id, {
      code: `
          {
            let element = closestScrollableY(TARGET);
            if (element) scrollToY(element, 0, ${settings.duration});
          }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },

  ScrollBottom: function (data, settings) {
    browser.tabs.executeScript(this.id, {
      code: `
      {
        let element = closestScrollableY(TARGET);
        if (element) scrollToY(element, element.scrollHeight - element.clientHeight, ${settings.duration});
      }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },

  ScrollPageDown: function (data, settings) {
    browser.tabs.executeScript(this.id, {
      code: `
        {
          let element = closestScrollableY(TARGET);
          if (element) scrollToY(element, element.scrollTop + element.clientHeight * 0.95, ${settings.duration});
        }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },


  ScrollPageUp: function (data, settings) {
    browser.tabs.executeScript(this.id, {
      code: `
        {
          let element = closestScrollableY(TARGET);
          if (element) scrollToY(element, element.scrollTop - element.clientHeight * 0.95, ${settings.duration});
        }
      `,
      runAt: 'document_start',
      frameId: data.frameId || 0
    });
  },

  FocusRightTab: function () {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      let index = this.index + 1;
      if (index >= tabs.length) index = 0;

      let tab = tabs.find((element) => element.index === index);
      chrome.tabs.update(tab.id, { active: true });
    });
  },

  FocusLeftTab: function () {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      let index = this.index - 1;
      if (index < 0) index = tabs.length - 1;

      let tab = tabs.find((element) => element.index === index);
      chrome.tabs.update(tab.id, { active: true });
    });
  },

  FocusFirstTab: function (data, settings) {
    const queryInfo = { currentWindow: true };
    if (!settings.includePinned) queryInfo.pinned = false;

    const query = browser.tabs.query(queryInfo);
    query.then((tabs) => {
      const firstTab = tabs.reduce((min, cur) => min.index < cur.index ? min : cur);
      browser.tabs.update(firstTab.id, { active: true });
    });
  },

  FocusLastTab: function () {
    const query = browser.tabs.query({
      currentWindow: true
    });
    query.then((tabs) => {
      const lastTab = tabs.reduce((max, cur) => max.index > cur.index ? max : cur);
      browser.tabs.update(lastTab.id, { active: true });
    });
  },

  FocusPreviousSelectedTab: function () {
    const query = browser.tabs.query({
      active: false
    });
    query.then((tabs) => {
      if (tabs.length > 0) {
        const lastAccessedTab = tabs.reduce((max, cur) => max.lastAccessed > cur.lastAccessed ? max : cur);
        browser.tabs.update(lastAccessedTab.id, { active: true });
      }
    });
  },

  MaximizeWindow: function () {
    chrome.windows.getCurrent((win) => {
      chrome.windows.update(win.id, {
        state: 'maximized'
      });
    });
  },

  MinimizeWindow: function () {
    chrome.windows.getCurrent((win) => {
      chrome.windows.update(win.id, {
        state: 'minimized'
      });
    });
  },

  ToggleWindowSize: function () {
    chrome.windows.getCurrent((win) => {
      if (win.state === 'maximized') chrome.windows.update(win.id, {
          state: 'normal'
      });
      else chrome.windows.update(win.id, {
          state: 'maximized'
      });
    });
  },

  // maximizes the window if it is already in full screen mode
  ToggleFullscreen: function () {
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

  TabToNewWindow: function (data, settings) {
    chrome.windows.create({
      tabId: this.id,
      incognito: settings.private
    });
  },

  CloseWindow: function () {
    chrome.windows.remove(this.windowId);
  },

  ReloadAllTabs: function (data, settings) {
    chrome.tabs.query({
      currentWindow: true
    }, (tabs) => {
      for (let tab of tabs)
        browser.tabs.reload(tab.id, { bypassCache: settings.cache });
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

  IncreaseURLNumber: function () {
    if (isURL(this.url)) {
      const url = new URL(this.url),
            numbers = /[0-9]+/;

      if (url.pathname.match(numbers)) {
        url.pathname = incrementLastNumber(url.pathname);
      }
      else if (url.search.match(numbers)) {
        url.search = incrementLastNumber(url.search);
      }
      // only update url on number occurrence
      else return;

      browser.tabs.update(this.id, { "url": url.href });
    }

    function incrementLastNumber (string) {
      // regex matches only last number occurrence
      return string.replace(/(\d+)(?!.*\d)/, (match, offset, string) => {
        const incrementedNumber = Number(match) + 1;
        // calculate leading zeros | round to 0 in case the number got incremented by another digit and there are no leading zeros
        const leadingZeros = Math.max(match.length - incrementedNumber.toString().length, 0);
        // append leading zeros to number
        return '0'.repeat(leadingZeros) + incrementedNumber;
      });
    }

  },

  DecreaseURLNumber: function () {
    if (isURL(this.url)) {
      const url = new URL(this.url),
            // match number greater than zero
            numbers = /\d*[1-9]{1}\d*/;

      if (url.pathname.match(numbers)) {
        url.pathname = decrementLastNumber(url.pathname);
      }
      else if (url.search.match(numbers)) {
        url.search = decrementLastNumber(url.search);
      }
      // only update url on number occurrence
      else return;

      browser.tabs.update(this.id, { "url": url.href });
    }

    function decrementLastNumber (string) {
      // regex matches only last number occurrence
      return string.replace(/(\d+)(?!.*\d)/, (match, offset, string) => {
        const decrementedNumber = Number(match) - 1;
        // calculate leading zeros | round to 0 in case the number got incremented by another digit and there are no leading zeros
        const leadingZeros = Math.max(match.length - decrementedNumber.toString().length, 0);
        // append leading zeros to number
        return '0'.repeat(leadingZeros) + decrementedNumber;
      });
    }
  },

  ImageToNewTab: function (data, settings) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      browser.tabs.create({
        url: data.target.src,
        active: settings.focusImageToTab,
        index: this.index + 1,
        openerTabId: this.id
      });
    }
  },

  LinkToNewTab: function () {
    // global tab index counter variable
    let lastIndex = 0;
    // global event handler function
    function handleTabChange () {
      lastIndex = 0;
      browser.tabs.onActivated.removeListener(handleTabChange);
    }

    // actual action function
    return function (data, settings) {
      let url = null;

      if (isURL(data.textSelection)) url = data.textSelection;
      else if (data.link && data.link.href) url = data.link.href;

      // first time this tab opens a child tab
      if (!browser.tabs.onActivated.hasListener(handleTabChange)) {
        lastIndex = this.index + 1;
        browser.tabs.onActivated.addListener(handleTabChange);
      }
      else lastIndex++;

      // open new tab
      if (url || settings.emptyTab) browser.tabs.create({
        url: url,
        active: settings.focus,
        index: lastIndex,
        openerTabId: this.id
      })
    }
  }(),

  LinkToNewWindow: function (data) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;

    if (url) chrome.windows.create({
      url: url
    })
  },

  LinkToNewPrivateWindow: function (data) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;

    if (url) chrome.windows.create({
      url: url,
      incognito: true
    })
  },

  LinkToNewBookmark: function (data) {
    let url = null, title = null;

    if (isURL(data.textSelection))
      url = data.textSelection;
    else if (data.link && data.link.href) {
      url = data.link.href;
      title = data.link.title || data.link.textContent || data.target.title || null;
    }

    if (url) browser.bookmarks.create({
      url: url,
      title: title || new URL(url).hostname
    });
  },

  SearchSelection: function (data, settings) {
    browser.tabs.create({
      url: settings.searchEngineURL + encodeURIComponent(data.textSelection),
      active: settings.focus,
      index: this.index + 1,
      openerTabId: this.id
    })
  },

  OpenHomepage: function (data) {
    const fetchHomepage = browser.browserSettings.homepageOverride.get({});
    fetchHomepage.then((result) => {
      if (this.pinned) browser.tabs.create({
        url: result.value,
        active: true,
      });
      else browser.tabs.update(this.id, {
        url: result.value
      });
    });
  },

  OpenCustomURL: function (data, settings) {

// REWORK SO IT TAKES THE USERS SITE (vlt. nicht open sondern "toNewTab")

    if (this.pinned) browser.tabs.create({
      url: settings.url,
      active: true,
    });
    else browser.tabs.update(this.id, {
      url: settings.url
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
          let mostLeftTabIndex = 0;
          if (tabs.length > 0) mostLeftTabIndex = tabs.reduce((min, cur) => min.index < cur.index ? min : cur).index;
          chrome.tabs.create({
            url: url,
            active: true,
            index: mostLeftTabIndex,
            openerTabId: this.id
          });
        });
      }
      else chrome.tabs.update(this.id, {
        url: url
      });
    }
  },

  OpenImage: function (data) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      if (this.pinned) {
        chrome.tabs.query({
          currentWindow: true,
          pinned: false
        }, (tabs) => {
          // get the lowest index excluding pinned tabs
          let mostLeftTabIndex = 0;
          if (tabs.length > 0) mostLeftTabIndex = tabs.reduce((min, cur) => min.index < cur.index ? min : cur).index;
          chrome.tabs.create({
            url: data.target.src,
            active: true,
            index: mostLeftTabIndex,
            openerTabId: this.id
          });
        });
      }
      else chrome.tabs.update(this.id, {
        url: data.target.src
      });
    }
  },

  SaveTabAsPDF: function () {
    browser.tabs.saveAsPDF({});
  },

  PrintTab: function () {
    browser.tabs.print();
  },

  OpenPrintPreview: function () {
    browser.tabs.printPreview();
  },

  SaveScreenshot: function () {
    chrome.tabs.captureVisibleTab((url) => {
      // convert data uri to blob
      url = URL.createObjectURL(dataURItoBlob(url));

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
    const input = document.createElement("textarea");
    document.body.append(input);
    input.value = this.url;
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  },

  CopyLinkURL: function (data) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;
    else return;

    const input = document.createElement("textarea");
    document.body.append(input);
    input.value = url;
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  },

  CopyTextSelection: function (data) {
    const input = document.createElement("textarea");
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
  },

  SaveImage: function (data, settings) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      let url, title = null, blob = false;

      if (isDataURL(data.target.src)) {
        blob = true;
        url = URL.createObjectURL(dataURItoBlob(data.target.src));
        // get file extension from mime type
        const fileExtension = "." + data.target.src.split("data:image/").pop().split(";")[0];
        // construct file name
        title = data.target.alt || data.target.title || this.title;
        // remove special characters and add file extension
        title = title.replace(/[\\\/\:\*\?"\|]/g, '') + fileExtension;
      }
      else if (isURL(data.target.src)) {
        url = data.target.src;
      }
      else return;

      // remove special windows file name characters
      chrome.downloads.download({
        url: url,
        filename: title,
        saveAs: settings.promptDialog
      }, (downloadId) => {
        // if blob file was created
        if (blob) {
          // catch error and free the blob for gc
          if (chrome.runtime.lastError) URL.revokeObjectURL(url);
          else chrome.downloads.onChanged.addListener(function clearURL(downloadDelta) {
            if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
              URL.revokeObjectURL(url);
              chrome.downloads.onChanged.removeListener(clearURL);
            }
          });
        }
      });
    }
  },

  ViewPageSourceCode: function () {
    browser.tabs.create({
      active: true,
      index: this.index + 1, // open next to current Tab
      url: "view-source:" + this.url
    });
  },

  OpenAddonSettings: function () {
    browser.runtime.openOptionsPage();
  },

  PopupAllTabs: function (data) {
    const queryTabs = browser.tabs.query({ currentWindow: true });
    queryTabs.then((tabs) => {
      const dataset = tabs.map((tab) => ({
        id: tab.id,
        label: tab.title,
        icon: tab.favIconUrl || null
      }));
      const response = browser.tabs.sendMessage(this.id, {
        subject: "PopupRequest",
        data: {
          mousePosition: {
            x: data.mousePosition.x,
            y: data.mousePosition.y
          },
          dataset: dataset
        }
      });
      response.then(handleResponse);
    }, { frameId: 0 });

    function handleResponse (message) {
      if (message) browser.tabs.update(Number(message), {active: true})
    }
  },

  PopupRecentlyClosedTabs: function (data) {
    const queryTabs = browser.sessions.getRecentlyClosed({});
    queryTabs.then((session) => {
      // filter windows
      let dataset = session.filter((element) => "tab" in element)
          dataset = dataset.map((element) => ({
            id: element.tab.sessionId,
            label: element.tab.title,
            icon: element.tab.favIconUrl || null
          }));
      const response = browser.tabs.sendMessage(this.id, {
        subject: "PopupRequest",
        data: {
          mousePosition: {
            x: data.mousePosition.x,
            y: data.mousePosition.y
          },
          dataset: dataset
        }
      }, { frameId: 0 });
      response.then(handleResponse);
    });

    function handleResponse (message) {
      if (message) browser.sessions.restore(message);
    }
  },

  ClearBrowsingData: function (data, settings) {
    browser.browsingData.remove({}, settings);
  }
};
