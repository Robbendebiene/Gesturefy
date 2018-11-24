'use strict'

const Commands = {
  DuplicateTab: function (data, settings) {
    if (settings.focus === false) {
      const createTab = browser.tabs.create({
        active: false,
        url: this.url,
        index: this.index + 1,
        pinned: this.pinned,
        openInReaderMode: this.isInReaderMode,
        openerTabId: this.openerTabId
      });
      createTab.then((tab) => {
        browser.tabs.update(tab.id, { muted: this.mutedInfo.muted });
      });
    }
    else {
      browser.tabs.duplicate(this.id);
    }
  },

  NewTab: function (data, settings) {
    let index = null;

    if (settings.position === "after")
      index = this.index + 1;
    else if (settings.position === "before")
      index = this.index;

    browser.tabs.create({
      active: settings.focus,
      index: index
    })
  },

  CloseTab: function (data, settings) {
    // remove tab if not pinned or remove-pinned-tabs option is enabled
    if (settings.closePinned || !this.pinned) {
      const queryTabs = browser.tabs.query({
        windowId: this.windowId,
        active: false,
        hidden: false
      });
      queryTabs.then((tabs) => {
        // if there are other tabs to focus
        if (tabs.length > 0) {
          let nextTab = null;
          if (settings.nextFocus === "next") {
            // get closest tab to the right or the closest tab to the left
            nextTab = tabs.reduce((acc, cur) =>
              (acc.index <= this.index && cur.index > acc.index) || (cur.index > this.index && cur.index < acc.index) ? cur : acc
            );
          }
          else if (settings.nextFocus === "previous") {
            // get closest tab to the left or the closest tab to the right
            nextTab = tabs.reduce((acc, cur) =>
              (acc.index >= this.index && cur.index < acc.index) || (cur.index < this.index && cur.index > acc.index) ? cur : acc
            );
          }
          // get the previous tab
          else if (settings.nextFocus === "recent") {
            nextTab = tabs.reduce((acc, cur) => acc.lastAccessed > cur.lastAccessed ? acc : cur);
          }
          if (nextTab) browser.tabs.update(nextTab.id, { active: true });
        }
        browser.tabs.remove(this.id);
      });
    }
  },

  CloseRightTabs: function () {
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      pinned: false,
      hidden: false
    });
    queryTabs.then((tabs) => {
      // filter all tabs to the right
      tabs = tabs.filter((tab) => tab.index > this.index);
      // create array of tap ids
      tabs = tabs.map((tab) => tab.id);
      browser.tabs.remove(tabs);
    });
  },

  CloseLeftTabs: function () {
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      pinned: false,
      hidden: false
    });
    queryTabs.then((tabs) => {
      // filter all tabs to the left
      tabs = tabs.filter((tab) => tab.index < this.index);
      // create array of tap ids
      tabs = tabs.map((tab) => tab.id);
      browser.tabs.remove(tabs);
    });
  },

  CloseOtherTabs: function () {
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      pinned: false,
      active: false,
      hidden: false
    });
    queryTabs.then((tabs) => {
      // create array of tap ids
      tabs = tabs.map((tab) => tab.id);
      browser.tabs.remove(tabs);
    });
  },

  RestoreTab: function (data, settings) {
    const queryClosedTabs = browser.sessions.getRecentlyClosed();
    queryClosedTabs.then((sessions) => {
      // exclude windows and tabs from different windows
      if (settings.currentWindowOnly) {
        sessions = sessions.filter((session) => {
          return session.tab && session.tab.windowId === this.windowId;
        });
      }
      if (sessions.length > 0) {
        const mostRecently = sessions.reduce((prev, cur) => prev.lastModified > cur.lastModified ? prev : cur);
        const sessionId = mostRecently.tab ? mostRecently.tab.sessionId : mostRecently.window.sessionId;
        browser.sessions.restore(sessionId);
      }
    });
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

  ReloadFrame: function (data, settings) {
    if (data.frameId) browser.tabs.executeScript(this.id, {
      code: `window.location.reload(${settings.cache})`,
      runAt: 'document_start',
      frameId: data.frameId
    });
  },

  ReloadAllTabs: function (data, settings) {
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      hidden: false
    });
    queryTabs.then((tabs) => {
      for (let tab of tabs)
        browser.tabs.reload(tab.id, { bypassCache: settings.cache });
    });
  },

  ZoomIn: function (data, settings) {
    const zoomLevels = [.3, .5, .67, .8, .9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];

    const queryZoom = browser.tabs.getZoom(this.id);
    queryZoom.then((z) => {
      if (settings.step)
        z = Math.min(3, z + settings.step/100);
      else
        z = zoomLevels.find((element) => element > z) || 3;
      browser.tabs.setZoom(this.id, z);
    });
  },

  ZoomOut: function (data, settings) {
    const zoomLevels = [3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, .9, .8, .67, .5, .3];

    const queryZoom = browser.tabs.getZoom(this.id);
    queryZoom.then((z) => {
      if (settings.step)
        z = Math.max(.3, z - settings.step/100);
      else
        z = zoomLevels.find((element) => element < z) || .3;
      browser.tabs.setZoom(this.id, z);
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
    const queryBookmarks = browser.bookmarks.search({
      url: this.url
    });
    queryBookmarks.then((bookmarks) => {
      if (bookmarks.length > 0)
        browser.bookmarks.remove(bookmarks[0].id)
      else browser.bookmarks.create({
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
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      active: false,
      hidden: false
    });
    queryTabs.then((tabs) => {
      let nextTab;
      // if there is at least one tab to the right of the current
      if (tabs.some(cur => cur.index > this.index)) {
        // get closest tab to the right or the closest tab to the left
        nextTab = tabs.reduce((acc, cur) =>
          (acc.index <= this.index && cur.index > acc.index) || (cur.index > this.index && cur.index < acc.index) ? cur : acc
        );
      }
      // else get most left tab
      else {
        nextTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
      }
      browser.tabs.update(nextTab.id, { active: true });
    });
  },

  FocusLeftTab: function () {
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      active: false,
      hidden: false
    });
    queryTabs.then((tabs) => {
      let nextTab;
      // if there is at least one tab to the left of the current
      if (tabs.some(cur => cur.index < this.index)) {
        // get closest tab to the left or the closest tab to the right
        nextTab = tabs.reduce((acc, cur) =>
          (acc.index >= this.index && cur.index < acc.index) || (cur.index < this.index && cur.index > acc.index) ? cur : acc
        );
      }
      // else get most right tab
      else {
        nextTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
      }
      browser.tabs.update(nextTab.id, { active: true });
    });
  },

  FocusFirstTab: function (data, settings) {
    const queryInfo = {
      currentWindow: true,
      hidden: false
    };
    if (!settings.includePinned) queryInfo.pinned = false;

    const queryTabs = browser.tabs.query(queryInfo);
    queryTabs.then((tabs) => {
      const firstTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
      browser.tabs.update(firstTab.id, { active: true });
    });
  },

  FocusLastTab: function () {
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      hidden: false
    });
    queryTabs.then((tabs) => {
      const lastTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
      browser.tabs.update(lastTab.id, { active: true });
    });
  },

  FocusPreviousSelectedTab: function () {
    const queryTabs = browser.tabs.query({
      active: false,
      hidden: false
    });
    queryTabs.then((tabs) => {
      if (tabs.length > 0) {
        const lastAccessedTab = tabs.reduce((acc, cur) => acc.lastAccessed > cur.lastAccessed ? acc : cur);
        browser.tabs.update(lastAccessedTab.id, { active: true });
      }
    });
  },

  MaximizeWindow: function () {
    const queryWindow = browser.windows.getCurrent();
    queryWindow.then((win) => {
      browser.windows.update(win.id, {
        state: 'maximized'
      });
    });
  },

  MinimizeWindow: function () {
    const queryWindow = browser.windows.getCurrent();
    queryWindow.then((win) => {
      browser.windows.update(win.id, {
        state: 'minimized'
      });
    });
  },

  ToggleWindowSize: function () {
    const queryWindow = browser.windows.getCurrent();
    queryWindow.then((win) => {
      if (win.state === 'maximized') browser.windows.update(win.id, {
          state: 'normal'
      });
      else browser.windows.update(win.id, {
          state: 'maximized'
      });
    });
  },

  // maximizes the window if it is already in full screen mode
  ToggleFullscreen: function () {
    const queryWindow = browser.windows.getCurrent();
    queryWindow.then((win) => {
      if (win.state === 'fullscreen') browser.windows.update(win.id, {
        state: 'maximized'
      });
      else browser.windows.update(win.id, {
        state: 'fullscreen'
      });
    });
  },

  NewWindow: function () {
    browser.windows.create({});
  },

  NewPrivateWindow: function () {
    browser.windows.create({
      incognito: true
    });
  },

  TabToNewWindow: function () {
    browser.windows.create({
      tabId: this.id
    });
  },

  CloseWindow: function () {
    browser.windows.remove(this.windowId);
  },

  URLLevelUp: function () {
    browser.tabs.executeScript(this.id, {
      code: `
        const newPath = window.location.pathname.replace(/\\/([^/]+)\\/?$/g, '');
        window.location.assign( window.location.origin + newPath );
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

  OpenImageInNewTab: function (data, settings) {
    let index = null;

    if (settings.position === "after")
      index = this.index + 1;
    else if (settings.position === "before")
      index = this.index;

    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      browser.tabs.create({
        url: data.target.src,
        active: settings.focus,
        index: index,
        openerTabId: this.id
      });
    }
  },

  OpenLinkInNewTab: function () {
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

      if (url || settings.emptyTab) {
        // first time this tab opens a child tab
        if (!browser.tabs.onActivated.hasListener(handleTabChange)) {
          lastIndex = this.index + 1;
          browser.tabs.onActivated.addListener(handleTabChange);
        }
        else lastIndex++;

        // open new tab
        browser.tabs.create({
          url: url,
          active: settings.focus,
          index: lastIndex,
          openerTabId: this.id
        });
      }
    }
  }(),

  OpenLinkInNewWindow: function (data, settings) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;

    if (url || settings.emptyWindow) browser.windows.create({
      url: url
    })
  },

  OpenLinkInNewPrivateWindow: function (data, settings) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;

    if (url || settings.emptyWindow) browser.windows.create({
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

  SearchTextSelection: function (data, settings) {
    const tabProperties = {
      active: settings.focus,
      openerTabId: this.id
    };
    // define tab position
    if (settings.position === "after")
      tabProperties.index = this.index + 1;
    else if (settings.position === "before")
      tabProperties.index = this.index;
    // either use specified search engine url or default search engine
    if (settings.searchEngineURL) {
      tabProperties.url = settings.searchEngineURL + encodeURIComponent(data.textSelection);
      browser.tabs.create(tabProperties);
    }
    else {
      const createTab = browser.tabs.create(tabProperties);
      createTab.then((tab) => {
        browser.search.search({
          query: data.textSelection,
          tabId: tab.id
        });
      });
    }
  },

  SearchClipboard: function (data, settings) {
    const queryClipboardText = navigator.clipboard.readText();
    const tabProperties = {
      active: settings.focus,
      openerTabId: this.id
    };

    queryClipboardText.then((clipboardText) => {
      // define tab position
      if (settings.position === "after")
        tabProperties.index = this.index + 1;
      else if (settings.position === "before")
        tabProperties.index = this.index;
      // either use specified search engine url or default search engine
      if (settings.searchEngineURL) {
        tabProperties.url = settings.searchEngineURL + encodeURIComponent(clipboardText);
        browser.tabs.create(tabProperties);
      }
      else {
        const createTab = browser.tabs.create(tabProperties);
        createTab.then((tab) => {
          browser.search.search({
            query: clipboardText,
            tabId: tab.id
          });
        });
      }
    });
  },

  OpenCustomURLInNewTab: function (data, settings) {
    let index = null;

    if (settings.position === "after")
      index = this.index + 1;
    else if (settings.position === "before")
      index = this.index;

    const createTab = browser.tabs.create({
      url: settings.url,
      active: settings.focus,
      index: index,
    });
    createTab.catch((error) => {
      // create error notification and open corresponding wiki page on click
      displayNotification(
        browser.i18n.getMessage('commandErrorNotificationTitle', "OpenCustomURLInNewTab"),
        browser.i18n.getMessage('commandErrorNotificationMessageIllegalURL'),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL"
      );
    });
  },

  OpenCustomURL: function (data, settings) {
    const createTab = browser.tabs.update(this.id, {
      url: settings.url
    });
    createTab.catch((error) => {
      // create error notification and open corresponding wiki page on click
      displayNotification(
        browser.i18n.getMessage('commandErrorNotificationTitle', "OpenCustomURL"),
        browser.i18n.getMessage('commandErrorNotificationMessageIllegalURL'),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL"
      );
    });
  },

  OpenHomepage: function (data) {
    const fetchHomepage = browser.browserSettings.homepageOverride.get({});
    fetchHomepage.then((result) => {
      let url = result.value,
          createHomepageTab;

      // try adding protocol on invalid url
      if (!isURL(url)) url = 'http://' + url;

      if (this.pinned) {
        createHomepageTab = browser.tabs.create({
          url: url,
          active: true,
        });
      }
      else {
        createHomepageTab = browser.tabs.update(this.id, {
          url: url
        });
      }

      createHomepageTab.catch((error) => {
        // create error notification and open corresponding wiki page on click
        displayNotification(
          browser.i18n.getMessage('commandErrorNotificationTitle', "OpenHomepage"),
          browser.i18n.getMessage('commandErrorNotificationMessageIllegalURL'),
          "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL"
        );
      });
    });
  },

  OpenLink: function (data) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;

    if (url) {
      if (this.pinned) {
        const queryTabs = browser.tabs.query({
          currentWindow: true,
          pinned: false
        });
        queryTabs.then((tabs) => {
          // get the lowest index excluding pinned tabs
          let mostLeftTabIndex = 0;
          if (tabs.length > 0) mostLeftTabIndex = tabs.reduce((min, cur) => min.index < cur.index ? min : cur).index;
          browser.tabs.create({
            url: url,
            active: true,
            index: mostLeftTabIndex,
            openerTabId: this.id
          });
        });
      }
      else browser.tabs.update(this.id, {
        url: url
      });
    }
  },

  ViewImage: function (data) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      if (this.pinned) {
        const queryTabs = browser.tabs.query({
          currentWindow: true,
          pinned: false
        });
        queryTabs.then((tabs) => {
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
      else browser.tabs.update(this.id, {
        url: data.target.src
      });
    }
  },

  OpenURLFromClipboard: function (data, settings) {
    const queryClipboard = navigator.clipboard.readText();
    queryClipboard.then((clipboardText) => {
      if (clipboardText && isURL(clipboardText)) browser.tabs.update(this.id, {
        url: clipboardText
      });
    });
  },

  OpenURLFromClipboardInNewTab: function (data, settings) {
    let index = null;

    if (settings.position === "after")
      index = this.index + 1;
    else if (settings.position === "before")
      index = this.index;

    const queryClipboard = navigator.clipboard.readText();
    queryClipboard.then((clipboardText) => {
      if (clipboardText && isURL(clipboardText)) browser.tabs.create({
        url: clipboardText,
        active: settings.focus,
        index: index
      });
    });
  },

  PasteClipboard: function (data) {
    // other possible usable target elements: event.target, document.activeElement
    browser.tabs.executeScript(this.id, {
        code: `
        {
          window.addEventListener('paste', (event) => {
            const clipboardText = event.clipboardData.getData('text');
            if (clipboardText && isEditableInput(TARGET)) {
              const cursorPosition = TARGET.selectionStart;
              TARGET.value = TARGET.value.slice(0, TARGET.selectionStart) + clipboardText + TARGET.value.slice(TARGET.selectionEnd);
              TARGET.selectionStart = TARGET.selectionEnd = cursorPosition + clipboardText.length;
            }
          }, { capture: true, once: true });
          document.execCommand('paste');
        }
        `,
        runAt: 'document_start',
        frameId: data.frameId || 0
      });
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
    const queryScreenshot = browser.tabs.captureVisibleTab();
    queryScreenshot.then((url) => {
      // convert data uri to blob
      url = URL.createObjectURL(dataURItoBlob(url));

      // remove special windows file name characters
      const queryDownload = browser.downloads.download({
        url: url,
        filename: this.title.replace(/[\\\/\:\*\?"\|]/g, '') + '.png',
        saveAs: true
      });
      queryDownload.then((downloadId) => {
        // catch error and free the blob for gc
        if (browser.runtime.lastError) URL.revokeObjectURL(url);
        else browser.downloads.onChanged.addListener(function clearURL(downloadDelta) {
          if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
            URL.revokeObjectURL(url);
            browser.downloads.onChanged.removeListener(clearURL);
          }
        });
      });
    });
  },

  CopyTabURL: function () {
    navigator.clipboard.writeText(this.url);
  },

  CopyLinkURL: function (data) {
    let url = null;
    if (isURL(data.textSelection)) url = data.textSelection;
    else if (data.link && data.link.href) url = data.link.href;
    else return;
    navigator.clipboard.writeText(url);
  },

  CopyTextSelection: function (data) {
    navigator.clipboard.writeText(data.textSelection);
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
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        // draw image to canvas
        canvas.getContext("2d").drawImage(image, 0, 0);
        // get image as blob
        canvas.toBlob((blob) => {
          const fileReader = new FileReader();
          // convert blob to array buffer
          fileReader.onload = () => browser.clipboard.setImageData(fileReader.result, fileType);
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
      const queryDownload = browser.downloads.download({
        url: url,
        filename: title,
        saveAs: settings.promptDialog
      });
      queryDownload.then((downloadId) => {
        // if blob file was created
        if (blob) {
          // catch error and free the blob for gc
          if (browser.runtime.lastError) URL.revokeObjectURL(url);
          else browser.downloads.onChanged.addListener(function clearURL(downloadDelta) {
            if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
              URL.revokeObjectURL(url);
              browser.downloads.onChanged.removeListener(clearURL);
            }
          });
        }
      });
    }
  },

  ViewPageSourceCode: function () {
    browser.tabs.create({
      active: true,
      index: this.index + 1,
      url: "view-source:" + this.url
    });
  },

  OpenAddonSettings: function () {
    browser.runtime.openOptionsPage();
  },

  PopupAllTabs: function (data, settings) {
    const queryTabs = browser.tabs.query({
      currentWindow: true,
      hidden: false
    });
    queryTabs.then((tabs) => {
      // sort tabs if defined
      switch (settings.order) {
        case "lastAccessedAsc": tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
          break;
        case "lastAccessedDesc": tabs.sort((a, b) => a.lastAccessed - b.lastAccessed);
          break;
        case "alphabeticalAsc": tabs.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "alphabeticalDesc": tabs.sort((a, b) => -a.title.localeCompare(b.title));
          break;
      }
      // map tabs to popup data structure
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

  PopupSearchEngines: function (data, settings) {
    const tabProperties = {
      active: settings.focus,
      openerTabId: this.id
    };
    // define tab position
    if (settings.position === "after")
      tabProperties.index = this.index + 1;
    else if (settings.position === "before")
      tabProperties.index = this.index;

    const querySearchEngines = browser.search.get();
    querySearchEngines.then((searchEngines) => {
      // map search engines
      const dataset = searchEngines.map((searchEngine) => ({
        id: searchEngine.name,
        label: searchEngine.name,
        icon: searchEngine.favIconUrl || null
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
      if (message) {
        const createTab = browser.tabs.create(tabProperties);
        createTab.then((tab) => {
          browser.search.search({
            query: data.textSelection,
            engine: message,
            tabId: tab.id
          });
        });
      }
    }
  },

  SendMessageToOtherAddon: function (data, settings) {
    let message = settings.message;

    if (settings.parseJSON) {
      // parse message to json object if serializeable
      try {
        message = JSON.parse(settings.message);
      }
      catch(error) {
        displayNotification(
          browser.i18n.getMessage('commandErrorNotificationTitle', "SendMessageToOtherAddon"),
          browser.i18n.getMessage('commandErrorNotificationMessageNotSerializeable'),
          "https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon#error-not-serializeable"
        );
        console.log(error);
        return;
      }
    }
    const sending = browser.runtime.sendMessage(settings.extensionId, message, {});
    sending.catch((error) => {
      if (error.message === 'Could not establish connection. Receiving end does not exist.') displayNotification(
        browser.i18n.getMessage('commandErrorNotificationTitle', "SendMessageToOtherAddon"),
        browser.i18n.getMessage('commandErrorNotificationMessageMissingRecipient'),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon#error-missing-recipient"
      );
    });
  },

  InjectCustomUserScript: function (data, settings) {

  },

  ClearBrowsingData: function (data, settings) {
    browser.browsingData.remove({}, settings);
  }
};
