import {
  isURL,
  isLegalURL,
  dataURItoBlob,
  displayNotification
} from "/core/commons.js";

/*
 * Commands
 */

export function DuplicateTab (sender, data) {
  if (this.getSetting("focus") === false) {
    const tabId = sender.tab.id;
    browser.tabs.onActivated.addListener(function handleDuplicateTabFocus (activeInfo) {
      if (activeInfo.previousTabId === tabId) {
        browser.tabs.update(tabId, { active: true });
      }
      browser.tabs.onActivated.removeListener(handleDuplicateTabFocus);
    });
  }
  browser.tabs.duplicate(sender.tab.id);
}


export function NewTab (sender, data) {
  let index;

  switch (this.getSetting("position")) {
    case "before":
      index = sender.tab.index;
    break;
    case "after":
      index = sender.tab.index + 1;
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
    active: this.getSetting("focus"),
    index: index
  })
}


export function CloseTab (sender, data) {
  // remove tab if not pinned or remove-pinned-tabs option is enabled
  if (this.getSetting("closePinned") || !sender.tab.pinned) {
    const queryTabs = browser.tabs.query({
      windowId: sender.tab.windowId,
      active: false,
      hidden: false
    });
    queryTabs.then((tabs) => {
      // if there are other tabs to focus
      if (tabs.length > 0) {
        let nextTab = null;
        if (this.getSetting("nextFocus") === "next") {
          // get closest tab to the right or the closest tab to the left
          nextTab = tabs.reduce((acc, cur) =>
            (acc.index <= sender.tab.index && cur.index > acc.index) || (cur.index > sender.tab.index && cur.index < acc.index) ? cur : acc
          );
        }
        else if (this.getSetting("nextFocus") === "previous") {
          // get closest tab to the left or the closest tab to the right
          nextTab = tabs.reduce((acc, cur) =>
            (acc.index >= sender.tab.index && cur.index < acc.index) || (cur.index < sender.tab.index && cur.index > acc.index) ? cur : acc
          );
        }
        // get the previous tab
        else if (this.getSetting("nextFocus") === "recent") {
          nextTab = tabs.reduce((acc, cur) => acc.lastAccessed > cur.lastAccessed ? acc : cur);
        }
        if (nextTab) browser.tabs.update(nextTab.id, { active: true });
      }
      browser.tabs.remove(sender.tab.id);
    });
  }
}


export function CloseRightTabs (sender, data) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    pinned: false,
    hidden: false
  });
  queryTabs.then((tabs) => {
    // filter all tabs to the right
    tabs = tabs.filter((tab) => tab.index > sender.tab.index);
    // create array of tap ids
    tabs = tabs.map((tab) => tab.id);
    browser.tabs.remove(tabs);
  });
}


export function CloseLeftTabs (sender, data) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    pinned: false,
    hidden: false
  });
  queryTabs.then((tabs) => {
    // filter all tabs to the left
    tabs = tabs.filter((tab) => tab.index < sender.tab.index);
    // create array of tap ids
    tabs = tabs.map((tab) => tab.id);
    browser.tabs.remove(tabs);
  });
}


export function CloseOtherTabs (sender, data) {
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


export function RestoreTab (sender, data) {
  const queryClosedTabs = browser.sessions.getRecentlyClosed();
  queryClosedTabs.then((sessions) => {
    // exclude windows and tabs from different windows
    if (this.getSetting("currentWindowOnly")) {
      sessions = sessions.filter((session) => {
        return session.tab && session.tab.windowId === sender.tab.windowId;
      });
    }
    if (sessions.length > 0) {
      const mostRecently = sessions.reduce((prev, cur) => prev.lastModified > cur.lastModified ? prev : cur);
      const sessionId = mostRecently.tab ? mostRecently.tab.sessionId : mostRecently.window.sessionId;
      browser.sessions.restore(sessionId);
    }
  });
}


export function ReloadTab (sender, data) {
  browser.tabs.reload(sender.tab.id, { bypassCache: this.getSetting("cache") });
}


export function StopLoading (sender, data) {
  browser.tabs.executeScript(sender.tab.id, {
    code: 'window.stop()',
    runAt: 'document_start'
  });
}


export function ReloadFrame (sender, data) {
  if (sender.frameId) browser.tabs.executeScript(sender.tab.id, {
    code: `window.location.reload(${this.getSetting("cache")})`,
    runAt: 'document_start',
    frameId: sender.frameId
  });
}


export function ReloadAllTabs (sender, data) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    hidden: false
  });
  queryTabs.then((tabs) => {
    for (let tab of tabs)
      browser.tabs.reload(tab.id, { bypassCache: this.getSetting("cache") });
  });
}


export function ZoomIn (sender, data) {
  const zoomLevels = [.3, .5, .67, .8, .9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];

  const queryZoom = browser.tabs.getZoom(sender.tab.id);
  queryZoom.then((z) => {
    if (this.getSetting("step"))
      z = Math.min(3, z + this.getSetting("step")/100);
    else
      z = zoomLevels.find((element) => element > z) || 3;
    browser.tabs.setZoom(sender.tab.id, z);
  });
}


export function ZoomOut (sender, data) {
  const zoomLevels = [3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, .9, .8, .67, .5, .3];

  const queryZoom = browser.tabs.getZoom(sender.tab.id);
  queryZoom.then((z) => {
    if (this.getSetting("step"))
      z = Math.max(.3, z - this.getSetting("step")/100);
    else
      z = zoomLevels.find((element) => element < z) || .3;
    browser.tabs.setZoom(sender.tab.id, z);
  });
}


export function ZoomReset (sender, data) {
  browser.tabs.setZoom(sender.tab.id, 1);
}


export function PageBack (sender, data) {
  browser.tabs.executeScript(sender.tab.id, {
    code: 'history.back();',
    runAt: 'document_start'
  });
}


export function PageForth (sender, data) {
  browser.tabs.executeScript(sender.tab.id, {
    code: 'history.forward();',
    runAt: 'document_start'
  });
}


// reverts the action if already pinned
export function TogglePin (sender, data) {
  browser.tabs.update(sender.tab.id, { pinned: !sender.tab.pinned });
}


// reverts the action if already muted
export function ToggleMute (sender, data) {
  browser.tabs.update(sender.tab.id, { muted: !sender.tab.mutedInfo.muted });
}


// reverts the action if already bookmarked
export function ToggleBookmark (sender, data) {
  const queryBookmarks = browser.bookmarks.search({
    url: sender.tab.url
  });
  queryBookmarks.then((bookmarks) => {
    if (bookmarks.length > 0)
      browser.bookmarks.remove(bookmarks[0].id)
    else browser.bookmarks.create({
      url: sender.tab.url,
      title: sender.tab.title
    });
  });
}


export function ScrollTop (sender, data) {
  // returns true if there exist a scrollable element in the injected frame else false
  const runScroll = browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const element = getClosestElement(TARGET, node => isScrollableY(node));
      if (element) scrollToY(element, 0, ${this.getSetting("duration")});
      !!element;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  runScroll.then((results) => {
    if (!results[0] && sender.frameId !== 0) {
      browser.tabs.executeScript(sender.tab.id, {
        code: `{
          const element = document.scrollingElement;
          if (isScrollableY(element)) {
            scrollToY(element, 0, ${this.getSetting("duration")});
          }
        }`,
        runAt: 'document_start',
        frameId: 0
      });
    }
  });
}


export function ScrollBottom (sender, data) {
  // returns true if there exist a scrollable element in the injected frame else false
  const runScroll = browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const element = getClosestElement(TARGET, node => isScrollableY(node));
      if (element) scrollToY(element, element.scrollHeight - element.clientHeight, ${this.getSetting("duration")});
      !!element;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  runScroll.then((results) => {
    if (!results[0] && sender.frameId !== 0) {
      browser.tabs.executeScript(sender.tab.id, {
        code: `{
          const element = document.scrollingElement;
          if (isScrollableY(element)) {
            scrollToY(element, element.scrollHeight - element.clientHeight, ${this.getSetting("duration")});
          }
        }`,
        runAt: 'document_start',
        frameId: 0
      });
    }
  });
}


export function ScrollPageDown (sender, data) {
  // returns true if there exist a scrollable element in the injected frame else false
  const runScroll = browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const element = getClosestElement(TARGET, node => isScrollableY(node));
      if (element) scrollToY(element, element.scrollTop + element.clientHeight * 0.95, ${this.getSetting("duration")});
      !!element;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  runScroll.then((results) => {
    if (!results[0] && sender.frameId !== 0) {
      browser.tabs.executeScript(sender.tab.id, {
        code: `{
          const element = document.scrollingElement;
          if (isScrollableY(element)) {
            scrollToY(element, element.scrollTop + element.clientHeight * 0.95, ${this.getSetting("duration")});
          }
        }`,
        runAt: 'document_start',
        frameId: 0
      });
    }
  });
}


export function ScrollPageUp (sender, data) {
  // returns true if there exist a scrollable element in the injected frame else false
  const runScroll = browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const element = getClosestElement(TARGET, node => isScrollableY(node));
      if (element) scrollToY(element, element.scrollTop - element.clientHeight * 0.95, ${this.getSetting("duration")});
      !!element;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  runScroll.then((results) => {
    if (!results[0] && sender.frameId !== 0) {
      browser.tabs.executeScript(sender.tab.id, {
        code: `{
          const element = document.scrollingElement;
          if (isScrollableY(element)) {
            scrollToY(element, element.scrollTop - element.clientHeight * 0.95, ${this.getSetting("duration")});
          }
        }`,
        runAt: 'document_start',
        frameId: 0
      });
    }
  });
}


export function FocusRightTab (sender, data) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    active: false,
    hidden: false
  });
  queryTabs.then((tabs) => {
    let nextTab;
    // if there is at least one tab to the right of the current
    if (tabs.some(cur => cur.index > sender.tab.index)) {
      // get closest tab to the right or the closest tab to the left
      nextTab = tabs.reduce((acc, cur) =>
        (acc.index <= sender.tab.index && cur.index > acc.index) || (cur.index > sender.tab.index && cur.index < acc.index) ? cur : acc
      );
    }
    // else get most left tab
    else {
      nextTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
    }
    browser.tabs.update(nextTab.id, { active: true });
  });
}


export function FocusLeftTab (sender, data) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    active: false,
    hidden: false
  });
  queryTabs.then((tabs) => {
    let nextTab;
    // if there is at least one tab to the left of the current
    if (tabs.some(cur => cur.index < sender.tab.index)) {
      // get closest tab to the left or the closest tab to the right
      nextTab = tabs.reduce((acc, cur) =>
        (acc.index >= sender.tab.index && cur.index < acc.index) || (cur.index < sender.tab.index && cur.index > acc.index) ? cur : acc
      );
    }
    // else get most right tab
    else {
      nextTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
    }
    browser.tabs.update(nextTab.id, { active: true });
  });
}


export function FocusFirstTab (sender, data) {
  const queryInfo = {
    currentWindow: true,
    hidden: false
  };
  if (!this.getSetting("includePinned")) queryInfo.pinned = false;

  const queryTabs = browser.tabs.query(queryInfo);
  queryTabs.then((tabs) => {
    const firstTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
    browser.tabs.update(firstTab.id, { active: true });
  });
}


export function FocusLastTab (sender, data) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    hidden: false
  });
  queryTabs.then((tabs) => {
    const lastTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
    browser.tabs.update(lastTab.id, { active: true });
  });
}


export function FocusPreviousSelectedTab (sender, data) {
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


export function MaximizeWindow (sender, data) {
  const queryWindow = browser.windows.getCurrent();
  queryWindow.then((win) => {
    browser.windows.update(win.id, {
      state: 'maximized'
    });
  });
}


export function MinimizeWindow (sender, data) {
  const queryWindow = browser.windows.getCurrent();
  queryWindow.then((win) => {
    browser.windows.update(win.id, {
      state: 'minimized'
    });
  });
}


export function ToggleWindowSize (sender, data) {
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
export function ToggleFullscreen (sender, data) {
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


export function NewWindow (sender, data) {
  browser.windows.create({});
}


export function NewPrivateWindow (sender, data) {
  browser.windows.create({
    incognito: true
  });
}


export function MoveTabToStart (sender, data) {
  // query pinned tabs if current tab is pinned or vice versa
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    pinned: sender.tab.pinned,
    hidden: false
  });
  queryTabs.then((tabs) => {
    const mostLeftTab = tabs.reduce((acc, cur) => cur.index < acc.index ? cur : acc);
    browser.tabs.move(sender.tab.id, {
      index: mostLeftTab.index
    });
  });
}


export function MoveTabToEnd (sender, data) {
  // query pinned tabs if current tab is pinned or vice versa
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    pinned: sender.tab.pinned,
    hidden: false
  });
  queryTabs.then((tabs) => {
    const mostRightTab = tabs.reduce((acc, cur) => cur.index > acc.index ? cur : acc);
    browser.tabs.move(sender.tab.id, {
      index: mostRightTab.index + 1
    });
  });
}


export function MoveTabToNewWindow (sender, data) {
  browser.windows.create({
    tabId: sender.tab.id
  });
}


export function MoveRightTabsToNewWindow (sender, data) {
  const queryProperties = {
    currentWindow: true,
    pinned: false,
    hidden: false
  };
  // exclude current tab if specified
  if (!this.getSetting("includeCurrent")) queryProperties.active = false;
  // query only unpinned tabs
  const queryTabs = browser.tabs.query(queryProperties);
  queryTabs.then((tabs) => {
    const rightTabs = tabs.filter((ele) => ele.index >= sender.tab.index);
    const rightTabIds = rightTabs.map((ele) => ele.id);
    // create new window with the first tab and move corresponding tabs to the new window
    if (rightTabIds.length > 0) {
      const windowProperties = {
        tabId: rightTabIds.shift()
      };
      if (!this.getSetting("focus")) windowProperties.state = "minimized";
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


export function MoveLeftTabsToNewWindow (sender, data) {
  const queryProperties = {
    currentWindow: true,
    pinned: false,
    hidden: false
  };
  // exclude current tab if specified
  if (!this.getSetting("includeCurrent")) queryProperties.active = false;
  // query only unpinned tabs
  const queryTabs = browser.tabs.query(queryProperties);
  queryTabs.then((tabs) => {
    const leftTabs = tabs.filter((ele) => ele.index <= sender.tab.index);
    const leftTabIds = leftTabs.map((ele) => ele.id);
    // create new window with the last tab and move corresponding tabs to the new window
    if (leftTabIds.length > 0) {
      const windowProperties = {
        tabId: leftTabIds.pop()
      };
      if (!this.getSetting("focus")) windowProperties.state = "minimized";
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


export function CloseWindow (sender, data) {
  browser.windows.remove(sender.tab.windowId);
}


export function URLLevelUp (sender, data) {
  browser.tabs.executeScript(sender.tab.id, {
    code: `
      const newPath = window.location.pathname.replace(/\\/([^/]+)\\/?$/g, '');
      window.location.assign( window.location.origin + newPath );
    `,
    runAt: 'document_start'
  });
}


export function IncreaseURLNumber (sender, data) {
  if (isLegalURL(sender.tab.url)) {
    const url = new URL(sender.tab.url),
          numbers = /[0-9]+/;

    if (url.pathname.match(numbers)) {
      url.pathname = incrementLastNumber(url.pathname);
    }
    else if (url.search.match(numbers)) {
      url.search = incrementLastNumber(url.search);
    }
    // only update url on number occurrence
    else return;

    browser.tabs.update(sender.tab.id, { "url": url.href });
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


export function DecreaseURLNumber (sender, data) {
  if (isLegalURL(sender.tab.url)) {
    const url = new URL(sender.tab.url),
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

    browser.tabs.update(sender.tab.id, { "url": url.href });
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


export function OpenImageInNewTab (sender, data) {
  let index;

  switch (this.getSetting("position")) {
    case "before":
      index = sender.tab.index;
    break;
    case "after":
      index = sender.tab.index + 1;
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
      active: this.getSetting("focus"),
      index: index,
      openerTabId: sender.tab.id
    });
  }
}


export function OpenLinkInNewTab (sender, data) {
  let url = null;

  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || this.getSetting("emptyTab")) {
    let index;

    switch (this.getSetting("position")) {
      case "before":
        index = sender.tab.index;
      break;
      case "after":
        index = sender.tab.index + 1;
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
      active: this.getSetting("focus"),
      index: index,
      openerTabId: sender.tab.id
    });
  }
}


export function OpenLinkInNewWindow (sender, data) {
  let url = null;
  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || this.getSetting("emptyWindow")) browser.windows.create({
    url: url
  })
}


export function OpenLinkInNewPrivateWindow (sender, data) {
  let url = null;
  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || this.getSetting("emptyWindow")) browser.windows.create({
    url: url,
    incognito: true
  })
}


export function LinkToNewBookmark (sender, data) {
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


export function SearchTextSelection (sender, data) {
  const tabProperties = {
    active: this.getSetting("focus"),
    openerTabId: sender.tab.id
  };

  // define tab position
  switch (this.getSetting("position")) {
    case "before":
      tabProperties.index = sender.tab.index;
    break;
    case "after":
      tabProperties.index = sender.tab.index + 1;
    break;
    case "start":
      tabProperties.index = 0;
    break;
    case "end":
      tabProperties.index = Number.MAX_SAFE_INTEGER;
    break;  
  }

  // either use specified search engine url or default search engine
  if (this.getSetting("searchEngineURL")) {
    tabProperties.url = this.getSetting("searchEngineURL") + encodeURIComponent(data.textSelection);
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


export function SearchClipboard (sender, data) {
  const queryClipboardText = navigator.clipboard.readText();
  const tabProperties = {
    active: this.getSetting("focus"),
    openerTabId: sender.tab.id
  };

  queryClipboardText.then((clipboardText) => {
    // define tab position
    switch (this.getSetting("position")) {
      case "before":
        tabProperties.index = sender.tab.index;
      break;
      case "after":
        tabProperties.index = sender.tab.index + 1;
      break;
      case "start":
        tabProperties.index = 0;
      break;
      case "end":
        tabProperties.index = Number.MAX_SAFE_INTEGER;
      break;   
    }
      
    // either use specified search engine url or default search engine
    if (this.getSetting("searchEngineURL")) {
      tabProperties.url = this.getSetting("searchEngineURL") + encodeURIComponent(clipboardText);
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


export function OpenCustomURLInNewTab (sender, data) {
  let index;

  switch (this.getSetting("position")) {
    case "before":
      index = sender.tab.index;
    break;
    case "after":
      index = sender.tab.index + 1;
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
    url: this.getSetting("url"),
    active: this.getSetting("focus"),
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


export function OpenCustomURL (sender, data) {
  const createTab = browser.tabs.update(sender.tab.id, {
    url: this.getSetting("url")
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


export function OpenHomepage (sender, data) {
  const fetchHomepage = browser.browserSettings.homepageOverride.get({});
  fetchHomepage.then((result) => {
    let url = result.value,
        createHomepageTab;

    // try adding protocol on invalid url
    if (!isURL(url)) url = 'http://' + url;

    if (sender.tab.pinned) {
      createHomepageTab = browser.tabs.create({
        url: url,
        active: true,
      });
    }
    else {
      createHomepageTab = browser.tabs.update(sender.tab.id, {
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


export function OpenLink (sender, data) {
  let url = null;
  if (isLegalURL(data.textSelection)) url = data.textSelection;
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url) {
    if (sender.tab.pinned) {
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
          openerTabId: sender.tab.id
        });
      });
    }
    else browser.tabs.update(sender.tab.id, {
      url: url
    });
  }
}


export function ViewImage (sender, data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
    if (sender.tab.pinned) {
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
          openerTabId: sender.tab.id
        });
      });
    }
    else browser.tabs.update(sender.tab.id, {
      url: data.target.src
    });
  }
}


export function OpenURLFromClipboard (sender, data) {
  const queryClipboard = navigator.clipboard.readText();
  queryClipboard.then((clipboardText) => {
    if (clipboardText && isLegalURL(clipboardText)) browser.tabs.update(sender.tab.id, {
      url: clipboardText
    });
  });
}


export function OpenURLFromClipboardInNewTab (sender, data) {
  let index;

  switch (this.getSetting("position")) {
    case "before":
      index = sender.tab.index;
    break;
    case "after":
      index = sender.tab.index + 1;
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
      active: this.getSetting("focus"),
      index: index
    });
  });
}


export function PasteClipboard (sender, data) {
  // other possible usable target elements: event.target, document.activeElement
  browser.tabs.executeScript(sender.tab.id, {
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
    frameId: sender.frameId || 0
  });
}


export function SaveTabAsPDF (sender, data) {
  browser.tabs.saveAsPDF({});
}


export function PrintTab (sender, data) {
  browser.tabs.print();
}


export function OpenPrintPreview (sender, data) {
  browser.tabs.printPreview();
}


export function SaveScreenshot (sender, data) {
  const queryScreenshot = browser.tabs.captureVisibleTab();
  queryScreenshot.then((url) => {
    // convert data uri to blob
    url = URL.createObjectURL(dataURItoBlob(url));

    // remove special windows file name characters
    const queryDownload = browser.downloads.download({
      url: url,
      filename: sender.tab.title.replace(/[\\\/\:\*\?"\|]/g, '') + '.png',
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

export function CopyTabURL (sender, data) {
  navigator.clipboard.writeText(sender.tab.url);
}


export function CopyLinkURL (sender, data) {
  let url = null;
  if (isURL(data.textSelection)) url = data.textSelection;
  else if (data.link && data.link.href) url = data.link.href;
  else return;
  navigator.clipboard.writeText(url);
}


export function CopyTextSelection (sender, data) {
  navigator.clipboard.writeText(data.textSelection);
}


export function CopyImage (sender, data) {
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
}


export function SaveImage (sender, data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
    let url, title = null;

    if (isURL(data.target.src)) {
      const urlObject = new URL(data.target.src);
      // if data url
      if (urlObject.protocol === "data:") {
        url = URL.createObjectURL(dataURItoBlob(data.target.src));
        // get file extension from mime type
        const fileExtension = "." + data.target.src.split("data:image/").pop().split(";")[0];
        // construct file name
        title = data.target.alt || data.target.title || "image";
        // remove special characters and add file extension
        title = title.replace(/[\\\/\:\*\?"\|]/g, '') + fileExtension;
      }
      else url = data.target.src;
    }
    else return;

    const queryDownload = browser.downloads.download({
      url: url,
      filename: title,
      saveAs: this.getSetting("promptDialog")
    });
    queryDownload.then((downloadId) => {
      const urlObject = new URL(url);
      // if blob file was created
      if (urlObject.protocol === "blob:") {
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
}


export function SaveLink (sender, data) {
  let url = null;
  if (isURL(data.textSelection)) url = data.textSelection;
  else if (data.link && data.link.href) url = data.link.href;

  if (url) {
    browser.downloads.download({
      url: url,
      saveAs: this.getSetting("promptDialog")
    });
  }
}


export function ViewPageSourceCode (sender, data) {
  browser.tabs.create({
    active: true,
    index: sender.tab.index + 1,
    url: "view-source:" + sender.tab.url
  });
}


export function OpenAddonSettings (sender, data) {
  browser.runtime.openOptionsPage();
}


export function PopupAllTabs (sender, data) {
  const queryTabs = browser.tabs.query({
    currentWindow: true,
    hidden: false
  });
  queryTabs.then((tabs) => {
    // sort tabs if defined
    switch (this.getSetting("order")) {
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

    const response = browser.tabs.sendMessage(sender.tab.id, {
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


export function PopupRecentlyClosedTabs (sender, data) {
  const queryTabs = browser.sessions.getRecentlyClosed({});
  queryTabs.then((session) => {
    // filter windows
    let dataset = session.filter((element) => "tab" in element)
        dataset = dataset.map((element) => ({
          id: element.tab.sessionId,
          label: element.tab.title,
          icon: element.tab.favIconUrl || null
        }));
    const response = browser.tabs.sendMessage(sender.tab.id, {
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


export function PopupSearchEngines (sender, data) {
  const tabProperties = {
    active: this.getSetting("focus"),
    openerTabId: sender.tab.id
  };
  // define tab position
  switch (this.getSetting("position")) {
    case "before":
      tabProperties.index = sender.tab.index;
    break;
    case "after":
      tabProperties.index = sender.tab.index + 1;
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

    const response = browser.tabs.sendMessage(sender.tab.id, {
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


export function SendMessageToOtherAddon (sender, data) {
  let message = this.getSetting("message");

  if (this.getSetting("parseJSON")) {
    // parse message to json object if serializeable
    try {
      message = JSON.parse(this.getSetting("message"));
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
  const sending = browser.runtime.sendMessage(this.getSetting("extensionId"), message, {});
  sending.catch((error) => {
    if (error.message === 'Could not establish connection. Receiving end does not exist.') displayNotification(
      browser.i18n.getMessage('commandErrorNotificationTitle', "SendMessageToOtherAddon"),
      browser.i18n.getMessage('commandErrorNotificationMessageMissingRecipient'),
      "https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon#error-missing-recipient"
    );
  });
}


export function InjectUserScript (sender, data) {

}