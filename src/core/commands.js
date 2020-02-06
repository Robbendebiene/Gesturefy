import {
  isURL,
  isLegalURL,
  dataURItoBlob,
  displayNotification
} from "/core/commons.js";

/*
 * Commands
 */

export function DuplicateTab (data, settings) {
  if (settings && settings.focus === false) {
    const tabId = this.id;
    browser.tabs.onActivated.addListener(function handleDuplicateTabFocus (activeInfo) {
      if (activeInfo.previousTabId === tabId) {
        browser.tabs.update(tabId, { active: true });
      }
      browser.tabs.onActivated.removeListener(handleDuplicateTabFocus);
    });
  }
  browser.tabs.duplicate(this.id);
}


export function NewTab (data, settings) {
  let index;

  switch (settings.position) {
    case "before":
      index = this.index;
    break;
    case "after":
      index = this.index + 1;
    break;
    case "start":
      index = 0;
    break;
    case "end":
      index = Number.MAX_SAFE_INTEGER;
    break;
    default:
      index = null;
    break;    
  }

  browser.tabs.create({
    active: settings.focus,
    index: index
  })
}


export function CloseTab (data, settings) {
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
}


export function CloseRightTabs () {
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
}


export function CloseLeftTabs () {
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
}


export function CloseOtherTabs () {
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
}


export function RestoreTab (data, settings) {
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
}


export function ReloadTab (data, settings) {
  browser.tabs.reload(this.id, { bypassCache: settings.cache });
}


export function StopLoading () {
  browser.tabs.executeScript(this.id, {
    code: 'window.stop()',
    runAt: 'document_start'
  });
}


export function ReloadFrame (data, settings) {
  if (data.frameId) browser.tabs.executeScript(this.id, {
    code: `window.location.reload(${settings.cache})`,
    runAt: 'document_start',
    frameId: data.frameId
  });
}


export function ReloadAllTabs (data, settings) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    hidden: false
  });
  queryTabs.then((tabs) => {
    for (let tab of tabs)
      browser.tabs.reload(tab.id, { bypassCache: settings.cache });
  });
}


export function ZoomIn (data, settings) {
  const zoomLevels = [.3, .5, .67, .8, .9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];

  const queryZoom = browser.tabs.getZoom(this.id);
  queryZoom.then((z) => {
    if (settings.step)
      z = Math.min(3, z + settings.step/100);
    else
      z = zoomLevels.find((element) => element > z) || 3;
    browser.tabs.setZoom(this.id, z);
  });
}


export function ZoomOut (data, settings) {
  const zoomLevels = [3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, .9, .8, .67, .5, .3];

  const queryZoom = browser.tabs.getZoom(this.id);
  queryZoom.then((z) => {
    if (settings.step)
      z = Math.max(.3, z - settings.step/100);
    else
      z = zoomLevels.find((element) => element < z) || .3;
    browser.tabs.setZoom(this.id, z);
  });
}


export function ZoomReset () {
  browser.tabs.setZoom(this.id, 1);
}


export function PageBack () {
  browser.tabs.executeScript(this.id, {
    code: 'history.back();',
    runAt: 'document_start'
  });
}


export function PageForth () {
  browser.tabs.executeScript(this.id, {
    code: 'history.forward();',
    runAt: 'document_start'
  });
}


// reverts the action if already pinned
export function TogglePin () {
  browser.tabs.update(this.id, { pinned: !this.pinned });
}


// reverts the action if already muted
export function ToggleMute () {
  browser.tabs.update(this.id, { muted: !this.mutedInfo.muted });
}


// reverts the action if already bookmarked
export function ToggleBookmark () {
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
}


export function ScrollTop (data, settings) {
  browser.tabs.executeScript(this.id, {
    code: `
        {
          let element = getClosestElement(TARGET, node => isScrollableY(node));
          if (element) scrollToY(element, 0, ${settings.duration});
        }
    `,
    runAt: 'document_start',
    frameId: data.frameId || 0
  });
}


export function ScrollBottom (data, settings) {
  browser.tabs.executeScript(this.id, {
    code: `
    {
      let element = getClosestElement(TARGET, node => isScrollableY(node));
      if (element) scrollToY(element, element.scrollHeight - element.clientHeight, ${settings.duration});
    }
    `,
    runAt: 'document_start',
    frameId: data.frameId || 0
  });
}


export function ScrollPageDown (data, settings) {
  browser.tabs.executeScript(this.id, {
    code: `
      {
        let element = getClosestElement(TARGET, node => isScrollableY(node));
        if (element) scrollToY(element, element.scrollTop + element.clientHeight * 0.95, ${settings.duration});
      }
    `,
    runAt: 'document_start',
    frameId: data.frameId || 0
  });
}


export function ScrollPageUp (data, settings) {
  browser.tabs.executeScript(this.id, {
    code: `
      {
        let element = getClosestElement(TARGET, node => isScrollableY(node));
        if (element) scrollToY(element, element.scrollTop - element.clientHeight * 0.95, ${settings.duration});
      }
    `,
    runAt: 'document_start',
    frameId: data.frameId || 0
  });
}


export function FocusRightTab (data, settings = { excludeDiscarded: false, cycling: true }) {
  const queryInfo = {
    currentWindow: true,
    active: false,
    hidden: false
  }

  if (settings.excludeDiscarded) queryInfo.discarded = false;

  const queryTabs = browser.tabs.query(queryInfo);
  queryTabs.then((tabs) => {
    let nextTab;
    // if there is at least one tab to the right of the current
    if (tabs.some(cur => cur.index > this.index)) {
      // get closest tab to the right or the closest tab to the left
      nextTab = tabs.reduce((acc, cur) =>
        (acc.index <= this.index && cur.index > acc.index) || (cur.index > this.index && cur.index < acc.index) ? cur : acc
      );
    }
    // get the most left tab if tab cycling is activated 
    else if (settings.cycling) {
      nextTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
    }
    // focus next tab if available
    if (nextTab) browser.tabs.update(nextTab.id, { active: true });
  });
}


export function FocusLeftTab (data, settings = { excludeDiscarded: false, cycling: true }) {
  const queryInfo = {
    currentWindow: true,
    active: false,
    hidden: false
  }

  if (settings.excludeDiscarded) queryInfo.discarded = false;

  const queryTabs = browser.tabs.query(queryInfo);
  queryTabs.then((tabs) => {
    let nextTab;
    // if there is at least one tab to the left of the current
    if (tabs.some(cur => cur.index < this.index)) {
      // get closest tab to the left or the closest tab to the right
      nextTab = tabs.reduce((acc, cur) =>
        (acc.index >= this.index && cur.index < acc.index) || (cur.index < this.index && cur.index > acc.index) ? cur : acc
      );
    }
    // else get most right tab if tab cycling is activated 
    else if (settings.cycling) {
      nextTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
    }
    // focus next tab if available
    if (nextTab) browser.tabs.update(nextTab.id, { active: true });
  });
}


export function FocusFirstTab (data, settings) {
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
}


export function FocusLastTab () {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    hidden: false
  });
  queryTabs.then((tabs) => {
    const lastTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
    browser.tabs.update(lastTab.id, { active: true });
  });
}


export function FocusPreviousSelectedTab () {
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
}


export function MaximizeWindow () {
  const queryWindow = browser.windows.getCurrent();
  queryWindow.then((win) => {
    browser.windows.update(win.id, {
      state: 'maximized'
    });
  });
}


export function MinimizeWindow () {
  const queryWindow = browser.windows.getCurrent();
  queryWindow.then((win) => {
    browser.windows.update(win.id, {
      state: 'minimized'
    });
  });
}


export function ToggleWindowSize () {
  const queryWindow = browser.windows.getCurrent();
  queryWindow.then((win) => {
    if (win.state === 'maximized') browser.windows.update(win.id, {
        state: 'normal'
    });
    else browser.windows.update(win.id, {
        state: 'maximized'
    });
  });
}


// maximizes the window if it is already in full screen mode
export function ToggleFullscreen () {
  const queryWindow = browser.windows.getCurrent();
  queryWindow.then((win) => {
    if (win.state === 'fullscreen') browser.windows.update(win.id, {
      state: 'maximized'
    });
    else browser.windows.update(win.id, {
      state: 'fullscreen'
    });
  });
}


export function NewWindow () {
  browser.windows.create({});
}


export function NewPrivateWindow () {
  browser.windows.create({
    incognito: true
  });
}


export function MoveTabToStart () {
  // query pinned tabs if current tab is pinned or vice versa
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    pinned: this.pinned,
    hidden: false
  });
  queryTabs.then((tabs) => {
    const mostLeftTab = tabs.reduce((acc, cur) => cur.index < acc.index ? cur : acc);
    browser.tabs.move(this.id, {
      index: mostLeftTab.index
    });
  });
}


export function MoveTabToEnd () {
  // query pinned tabs if current tab is pinned or vice versa
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    pinned: this.pinned,
    hidden: false
  });
  queryTabs.then((tabs) => {
    const mostRightTab = tabs.reduce((acc, cur) => cur.index > acc.index ? cur : acc);
    browser.tabs.move(this.id, {
      index: mostRightTab.index + 1
    });
  });
}


export function MoveTabToNewWindow () {
  browser.windows.create({
    tabId: this.id
  });
}


export function MoveRightTabsToNewWindow (data, settings) {
  const queryProperties = {
    currentWindow: true,
    pinned: false,
    hidden: false
  };
  // exclude current tab if specified
  if (!settings.includeCurrent) queryProperties.active = false;
  // query only unpinned tabs
  const queryTabs = browser.tabs.query(queryProperties);
  queryTabs.then((tabs) => {
    const rightTabs = tabs.filter((ele) => ele.index >= this.index);
    const rightTabIds = rightTabs.map((ele) => ele.id);
    // create new window with the first tab and move corresponding tabs to the new window
    if (rightTabIds.length > 0) {
      const windowProperties = {
        tabId: rightTabIds.shift()
      };
      if (!settings.focus) windowProperties.state = "minimized";
      const createWindow = browser.windows.create(windowProperties);
      createWindow.then((win) => {
        browser.tabs.move(rightTabIds, {
          windowId: win.id,
          index: 1
        });
      });
    }
  });
}


export function MoveLeftTabsToNewWindow (data, settings) {
  const queryProperties = {
    currentWindow: true,
    pinned: false,
    hidden: false
  };
  // exclude current tab if specified
  if (!settings.includeCurrent) queryProperties.active = false;
  // query only unpinned tabs
  const queryTabs = browser.tabs.query(queryProperties);
  queryTabs.then((tabs) => {
    const leftTabs = tabs.filter((ele) => ele.index <= this.index);
    const leftTabIds = leftTabs.map((ele) => ele.id);
    // create new window with the last tab and move corresponding tabs to the new window
    if (leftTabIds.length > 0) {
      const windowProperties = {
        tabId: leftTabIds.pop()
      };
      if (!settings.focus) windowProperties.state = "minimized";
      const createWindow = browser.windows.create(windowProperties);
      createWindow.then((win) => {
        browser.tabs.move(leftTabIds, {
          windowId: win.id,
          index: 0
        });
      });
    }
  });
}


export function CloseWindow () {
  browser.windows.remove(this.windowId);
}


export function URLLevelUp () {
  browser.tabs.executeScript(this.id, {
    code: `
      const newPath = window.location.pathname.replace(/\\/([^/]+)\\/?$/g, '');
      window.location.assign( window.location.origin + newPath );
    `,
    runAt: 'document_start'
  });
}


export function IncreaseURLNumber () {
  if (isLegalURL(this.url)) {
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
}


export function DecreaseURLNumber () {
  if (isLegalURL(this.url)) {
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
}


export function OpenImageInNewTab (data, settings) {
  let index;

  switch (settings.position) {
    case "before":
      index = this.index;
    break;
    case "after":
      index = this.index + 1;
    break;
    case "start":
      index = 0;
    break;
    case "end":
      index = Number.MAX_SAFE_INTEGER;
    break;
    default:
      index = null;
    break;    
  }

  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
    browser.tabs.create({
      url: data.target.src,
      active: settings.focus,
      index: index,
      openerTabId: this.id
    });
  }
}


export function OpenLinkInNewTab (data, settings) {
  let url = null;

  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || settings.emptyTab) {
    let index;

    switch (settings.position) {
      case "before":
        index = this.index;
      break;
      case "after":
        index = this.index + 1;
      break;
      case "start":
        index = 0;
      break;
      case "end":
        index = Number.MAX_SAFE_INTEGER;
      break;
      default:
        // default behaviour - insert new tabs as adjacent children
        // depnds on browser.tabs.insertRelatedAfterCurrent and browser.tabs.insertAfterCurrent
        index = null;
      break;
    }

    // open new tab
    browser.tabs.create({
      url: url,
      active: settings.focus,
      index: index,
      openerTabId: this.id
    });
  }
}


export function OpenLinkInNewWindow (data, settings) {
  let url = null;
  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || settings.emptyWindow) browser.windows.create({
    url: url
  })
}


export function OpenLinkInNewPrivateWindow (data, settings) {
  let url = null;
  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || settings.emptyWindow) browser.windows.create({
    url: url,
    incognito: true
  })
}


export function LinkToNewBookmark (data) {
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
}


export function SearchTextSelection (data, settings) {
  const tabProperties = {
    active: settings.focus,
    openerTabId: this.id
  };

  // define tab position
  switch (settings.position) {
    case "before":
      tabProperties.index = this.index;
    break;
    case "after":
      tabProperties.index = this.index + 1;
    break;
    case "start":
      tabProperties.index = 0;
    break;
    case "end":
      tabProperties.index = Number.MAX_SAFE_INTEGER;
    break;  
  }

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
}


export function SearchClipboard (data, settings) {
  const queryClipboardText = navigator.clipboard.readText();
  const tabProperties = {
    active: settings.focus,
    openerTabId: this.id
  };

  queryClipboardText.then((clipboardText) => {
    // define tab position
    switch (settings.position) {
      case "before":
        tabProperties.index = this.index;
      break;
      case "after":
        tabProperties.index = this.index + 1;
      break;
      case "start":
        tabProperties.index = 0;
      break;
      case "end":
        tabProperties.index = Number.MAX_SAFE_INTEGER;
      break;   
    }
      
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
}


export function OpenCustomURLInNewTab (data, settings) {
  let index;

  switch (settings.position) {
    case "before":
      index = this.index;
    break;
    case "after":
      index = this.index + 1;
    break;
    case "start":
      index = 0;
    break;
    case "end":
      index = Number.MAX_SAFE_INTEGER;
    break;
    default:
      index = null;
    break;    
  }

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
}


export function OpenCustomURL (data, settings) {
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
}


export function OpenHomepage (data) {
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
}


export function OpenLink (data) {
  let url = null;
  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

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
}


export function ViewImage (data) {
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
}


export function OpenURLFromClipboard (data, settings) {
  const queryClipboard = navigator.clipboard.readText();
  queryClipboard.then((clipboardText) => {
    if (clipboardText && isLegalURL(clipboardText)) browser.tabs.update(this.id, {
      url: clipboardText
    });
  });
}


export function OpenURLFromClipboardInNewTab (data, settings) {
  let index;

  switch (settings.position) {
    case "before":
      index = this.index;
    break;
    case "after":
      index = this.index + 1;
    break;
    case "start":
      index = 0;
    break;
    case "end":
      index = Number.MAX_SAFE_INTEGER;
    break;
    default:
      index = null;
    break;    
  }

  const queryClipboard = navigator.clipboard.readText();
  queryClipboard.then((clipboardText) => {
    if (clipboardText && isLegalURL(clipboardText)) browser.tabs.create({
      url: clipboardText,
      active: settings.focus,
      index: index
    });
  });
}


export function PasteClipboard (data) {
  browser.tabs.executeScript(this.id, {
    code: 'document.execCommand("paste")',
    runAt: 'document_start',
    frameId: data.frameId || 0
  });
}


export function SaveTabAsPDF () {
  browser.tabs.saveAsPDF({});
}


export function PrintTab () {
  browser.tabs.print();
}


export function OpenPrintPreview () {
  browser.tabs.printPreview();
}


export function SaveScreenshot () {
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
}

export function CopyTabURL () {
  navigator.clipboard.writeText(this.url);
}


export function CopyLinkURL (data) {
  let url = null;
  if (isURL(data.textSelection)) url = data.textSelection;
  else if (data.link && data.link.href) url = data.link.href;
  else return;
  navigator.clipboard.writeText(url);
}


export function CopyTextSelection (data) {
  navigator.clipboard.writeText(data.textSelection);
}


export function CopyImage (data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
    fetch(data.target.src).then(response => {
      // get file type by mime type
      let fileType;
      const mimeType = response.headers.get("Content-Type");
    
      switch (mimeType) {
        case "image/jpeg":
          fileType = "jpeg";
        break;
      
        case "image/png":
        default:
          fileType = "png";
        break;
      }

      response.arrayBuffer().then(buffer => browser.clipboard.setImageData(buffer, fileType));
    });
  }
}


export function SaveImage (data, settings) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src && isURL(data.target.src)) {
    const queryOptions = {
      saveAs: settings.promptDialog
    };

    const urlObject = new URL(data.target.src);
    // if data url create blob
    if (urlObject.protocol === "data:") {
      queryOptions.url = URL.createObjectURL(dataURItoBlob(data.target.src));
      // get file extension from mime type
      const fileExtension = "." + data.target.src.split("data:image/").pop().split(";")[0];
      // construct file name
      queryOptions.filename = data.target.alt || data.target.title || "image";
      // remove special characters and add file extension
      queryOptions.filename = queryOptions.filename.replace(/[\\\/\:\*\?"\|]/g, '') + fileExtension;
    }
    // otherwise use normal url
    else queryOptions.url = data.target.src;

    // add referer header, because some websites modify the image if the referer is missing
    // get referrer from content script
    const executeScript = browser.tabs.executeScript(this.id, {
      code: "({ referrer: document.referrer, url: window.location.href })",
      runAt: "document_start",
      frameId: data.frameId || 0
    });
    executeScript.then(returnValues => {
      // if the image is embedded in a website use the url of that website as the referer
      if (data.target.src !== returnValues[0].url) {
        // emulate no-referrer-when-downgrade
        // The origin, path, and querystring of the URL are sent as a referrer when the protocol security level stays the same (HTTP→HTTP, HTTPS→HTTPS)
        // or improves (HTTP→HTTPS), but isn't sent to less secure destinations (HTTPS→HTTP).
        if (!(new URL(returnValues[0].url).protocol === "https:" && new URL(data.target.src).protocol === "http:")) {
          queryOptions.headers = [ { name: "Referer", value: returnValues[0].url.split("#")[0] } ];
        }
      }
      // if the image is not embedded, but a referrer is set use the referrer
      else if (returnValues[0].referrer) {
        queryOptions.headers = [ { name: "Referer", value: returnValues[0].referrer } ];
      }
      
      // download image
      const queryDownload = browser.downloads.download(queryOptions);
      // handle blobs
      queryDownload.then((downloadId) => {
        const urlObject = new URL(queryOptions.url);
        // if blob file was created
        if (urlObject.protocol === "blob:") {
          // catch error and free the blob for gc
          if (browser.runtime.lastError) URL.revokeObjectURL(queryOptions.url);
          else browser.downloads.onChanged.addListener(function clearURL(downloadDelta) {
            if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
              URL.revokeObjectURL(queryOptions.url);
              browser.downloads.onChanged.removeListener(clearURL);
            }
          });
        }
      });
    });
  }
}


export function SaveLink (data, settings) {
  let url = null;
  if (isURL(data.textSelection)) url = data.textSelection;
  else if (data.link && data.link.href) url = data.link.href;

  if (url) {
    browser.downloads.download({
      url: url,
      saveAs: settings.promptDialog
    });
  }
}


export function ViewPageSourceCode () {
  browser.tabs.create({
    active: true,
    index: this.index + 1,
    url: "view-source:" + this.url
  });
}


export function OpenAddonSettings () {
  browser.runtime.openOptionsPage();
}


export function PopupAllTabs (data, settings) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    hidden: false
  });
  queryTabs.then((tabs) => {
    // sort tabs if defined
    switch (settings.order) {
      case "lastAccessedAsc":
        tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
      break;
      case "lastAccessedDesc":
        tabs.sort((a, b) => a.lastAccessed - b.lastAccessed);
      break;
      case "alphabeticalAsc":
        tabs.sort((a, b) => a.title.localeCompare(b.title));
      break;
      case "alphabeticalDesc":
        tabs.sort((a, b) => -a.title.localeCompare(b.title));
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
    }, { frameId: 0 });
    response.then(handleResponse);
  });

  function handleResponse (message) {
    if (message) browser.tabs.update(Number(message), {active: true})
  }
}


export function PopupRecentlyClosedTabs (data) {
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
}


export function PopupSearchEngines (data, settings) {
  const tabProperties = {
    active: settings.focus,
    openerTabId: this.id
  };
  // define tab position
  switch (settings.position) {
    case "before":
      tabProperties.index = this.index;
    break;
    case "after":
      tabProperties.index = this.index + 1;
    break;
    case "start":
      tabProperties.index = 0;
    break;
    case "end":
      tabProperties.index = Number.MAX_SAFE_INTEGER;
    break;  
  }

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
}


export function SendMessageToOtherAddon (data, settings) {
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
}


export function ExecuteUserScript (data, settings) {
  // sends a message to the user script controller
  browser.tabs.sendMessage(
    this.id,
    {
      subject: "executeUserScript",
      data: settings.userScript
    },
    { frameId: data.frameId || 0 }
  );
}


export function ClearBrowsingData (data, settings) {
  browser.browsingData.remove({}, settings);
}
