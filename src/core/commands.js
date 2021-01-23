import {
  isURL,
  isHTTPURL,
  isLegalURL,
  isDomainName,
  sanitizeFilename,
  dataURItoBlob,
  displayNotification
} from "/core/utils/commons.js";

/*
 * Commands
 * Every command fullfills its promise when its internal processes finish
 * The promise will be rejected on error
 * If the command could be successfully executed true will be returned
 * Else nothing will be returned
 * The execution can fail for insufficient conditions like a missing url or image
 */

export async function DuplicateTab (sender, data) {
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

  await browser.tabs.duplicate(sender.tab.id, {
    active: this.getSetting("focus"),
    index: index
  });
  // confirm success
  return true;
}


export async function NewTab (sender, data) {
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

  await browser.tabs.create({
    active: this.getSetting("focus"),
    index: index
  });
  // confirm success
  return true;
}


export async function CloseTab (sender, data) {
  // remove tab if not pinned or remove-pinned-tabs option is enabled
  if (this.getSetting("closePinned") || !sender.tab.pinned) {
    const tabs = await browser.tabs.query({
      windowId: sender.tab.windowId,
      active: false,
      hidden: false
    });

    // if there are other tabs to focus
    if (tabs.length > 0) {
      let nextTab = null;

      switch (this.getSetting("nextFocus")) {
        case "next":
          // get closest tab to the right (if not found it will return the closest tab to the left)
          nextTab = tabs.reduce((acc, cur) =>
            (acc.index <= sender.tab.index && cur.index > acc.index) || (cur.index > sender.tab.index && cur.index < acc.index) ? cur : acc
          );
        break;

        case "previous":
          // get closest tab to the left (if not found it will return the closest tab to the right)
          nextTab = tabs.reduce((acc, cur) =>
            (acc.index >= sender.tab.index && cur.index < acc.index) || (cur.index < sender.tab.index && cur.index > acc.index) ? cur : acc
          );
        break;

        case "recent":
          // get the previous tab
          nextTab = tabs.reduce((acc, cur) => acc.lastAccessed > cur.lastAccessed ? acc : cur);
        break;
      }

      if (nextTab) await browser.tabs.update(nextTab.id, { active: true });
    }
    await browser.tabs.remove(sender.tab.id);
    // confirm success
    return true;
  }
}


export async function CloseRightTabs (sender, data) {
  let tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    pinned: false,
    hidden: false
  });

  // filter all tabs to the right
  tabs = tabs.filter((tab) => tab.index > sender.tab.index);

  if (tabs.length > 0) {
    // create array of tap ids
    const tabIds = tabs.map((tab) => tab.id);
    await browser.tabs.remove(tabIds);
    // confirm success
    return true;
  }
}


export async function CloseLeftTabs (sender, data) {
  let tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    pinned: false,
    hidden: false
  });

  // filter all tabs to the left
  tabs = tabs.filter((tab) => tab.index < sender.tab.index);

  if (tabs.length > 0) {
    // create array of tap ids
    const tabIds = tabs.map((tab) => tab.id);
    await browser.tabs.remove(tabIds);
    // confirm success
    return true;
  }
}


export async function CloseOtherTabs (sender, data) {
  const tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    pinned: false,
    active: false,
    hidden: false
  });

  if (tabs.length > 0) {
    // create array of tap ids
    const tabIds = tabs.map((tab) => tab.id);
    await browser.tabs.remove(tabIds);
    // confirm success
    return true;
  }
}


export async function RestoreTab (sender, data) {
  let recentlyClosedSessions = await browser.sessions.getRecentlyClosed();

  // exclude windows and tabs from different windows
  if (this.getSetting("currentWindowOnly")) {
    recentlyClosedSessions = recentlyClosedSessions.filter((session) => {
      return session.tab && session.tab.windowId === sender.tab.windowId;
    });
  }
  if (recentlyClosedSessions.length > 0) {
    const mostRecently = recentlyClosedSessions.reduce((prev, cur) => prev.lastModified > cur.lastModified ? prev : cur);
    const sessionId = mostRecently.tab ? mostRecently.tab.sessionId : mostRecently.window.sessionId;
    await browser.sessions.restore(sessionId);
    // confirm success
    return true;
  }
}


export async function ReloadTab (sender, data) {
  await browser.tabs.reload(sender.tab.id, { bypassCache: this.getSetting("cache") });
  // confirm success
  return true;
}


export async function StopLoading (sender, data) {
  // returns the ready state of each frame as an array
  const stopLoadingResults = await browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const readyState = document.readyState;
      window.stop();
      readyState;
    }`,
    runAt: 'document_start',
    allFrames: true
  });

  // if at least one frame was not finished loading
  if (stopLoadingResults.some(readyState => readyState !== "complete")) {
    // confirm success
    return true;
  }
}


export async function ReloadFrame (sender, data) {
  if (sender.frameId) {
    await browser.tabs.executeScript(sender.tab.id, {
      code: `window.location.reload(${Boolean(this.getSetting("cache"))})`,
      runAt: 'document_start',
      frameId: sender.frameId
    });
    // confirm success
    return true;
  }
}


export async function ReloadAllTabs (sender, data) {
  const tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    hidden: false
  });

  await Promise.all(tabs.map((tab) => {
    return browser.tabs.reload(tab.id, { bypassCache: this.getSetting("cache") });
  }));
  // confirm success
  return true;
}


export async function ZoomIn (sender, data) {
  const zoomSetting = this.getSetting("step");
  // try to get single number
  const zoomStep = Number(zoomSetting);
  // array of default zoom levels
  let zoomLevels = [.3, .5, .67, .8, .9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];
  // maximal zoom level
  let maxZoom = 3, newZoom;

  // if no zoom step value exists and string contains comma, assume a list of zoom levels
  if (!zoomStep && zoomSetting && zoomSetting.includes(",")) {
    // get and override default zoom levels
    zoomLevels = zoomSetting.split(",").map(z => parseFloat(z)/100);
    // get and override max zoom boundary but cap it to 300%
    maxZoom = Math.min(Math.max(...zoomLevels), maxZoom);
  }

  const currentZoom = await browser.tabs.getZoom(sender.tab.id);

  if (zoomStep) {
    newZoom = Math.min(maxZoom, currentZoom + zoomStep/100);
  }
  else {
    newZoom = zoomLevels.reduce((acc, cur) => cur > currentZoom && cur < acc ? cur : acc, maxZoom);
  }

  if (newZoom > currentZoom) {
    await browser.tabs.setZoom(sender.tab.id, newZoom);
    // confirm success
    return true;
  }
}


export async function ZoomOut (sender, data) {
  const zoomSetting = this.getSetting("step");
  // try to get single number
  const zoomStep = Number(zoomSetting);
  // array of default zoom levels
  let zoomLevels = [3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, .9, .8, .67, .5, .3];
  // minimal zoom level
  let minZoom = .3, newZoom;

  // if no zoom step value exists and string contains comma, assume a list of zoom levels
  if (!zoomStep && zoomSetting && zoomSetting.includes(",")) {
    // get and override default zoom levels
    zoomLevels = zoomSetting.split(",").map(z => parseFloat(z)/100);
    // get min zoom boundary but cap it to 30%
    minZoom = Math.max(Math.min(...zoomLevels), minZoom);
  }

  const currentZoom = await browser.tabs.getZoom(sender.tab.id);

  if (zoomStep) {
    newZoom = Math.max(minZoom, currentZoom - zoomStep/100);
  }
  else {
    newZoom = zoomLevels.reduce((acc, cur) => cur < currentZoom && cur > acc ? cur : acc, minZoom);
  }

  if (newZoom < currentZoom) {
    await browser.tabs.setZoom(sender.tab.id, newZoom);
    // confirm success
    return true;
  }
}


export async function ZoomReset (sender, data) {
  const currentZoom = await browser.tabs.getZoom(sender.tab.id);

  if (currentZoom !== 1) {
    await browser.tabs.setZoom(sender.tab.id, 1);
    // confirm success
    return true;
  }
}


export async function PageBack (sender, data) {
  await browser.tabs.goBack(sender.tab.id);
  // confirm success
  return true;
}


export async function PageForth (sender, data) {
  await browser.tabs.goForward(sender.tab.id);
  // confirm success
  return true;
}


// reverts the action if already pinned
export async function TogglePin (sender, data) {
  await browser.tabs.update(sender.tab.id, { pinned: !sender.tab.pinned });
  // confirm success
  return true;
}


// reverts the action if already muted
export async function ToggleMute (sender, data) {
  await browser.tabs.update(sender.tab.id, { muted: !sender.tab.mutedInfo.muted });
  // confirm success
  return true;
}


// reverts the action if already bookmarked
export async function ToggleBookmark (sender, data) {
  const bookmarks = await browser.bookmarks.search({
    url: sender.tab.url
  });

  if (bookmarks.length > 0) {
    await browser.bookmarks.remove(bookmarks[0].id);
  }
  else {
    await browser.bookmarks.create({
      url: sender.tab.url,
      title: sender.tab.title
    });
    // confirm success
    return true;
  }
}


// reverts the action if already pinned
export async function ToggleReaderMode (sender, data) {
  await browser.tabs.toggleReaderMode(sender.tab.id);
  // confirm success
  return true;
}


export async function ScrollTop (sender, data) {
  // returns true if there exists a scrollable element in the injected frame else false
  const scrollTopResults = await browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const scrollableElement = getClosestElement(TARGET, isScrollableY);
      if (scrollableElement) {
        scrollToY(0, ${Number(this.getSetting("duration"))}, scrollableElement);
      }
      !!scrollableElement;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  if (!scrollTopResults[0] && sender.frameId !== 0) {
    await browser.tabs.executeScript(sender.tab.id, {
      code: `{
        const scrollableElement = document.scrollingElement;
        if (isScrollableY(scrollableElement)) {
          scrollToY(0, ${Number(this.getSetting("duration"))}, scrollableElement);
        }
      }`,
      runAt: 'document_start',
      frameId: 0
    });
  }
  // confirm success
  return true;
}


export async function ScrollBottom (sender, data) {
  // returns true if there exists a scrollable element in the injected frame else false
  const scrollBottomResults = await browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const scrollableElement = getClosestElement(TARGET, isScrollableY);
      if (scrollableElement) {
        scrollToY(
          scrollableElement.scrollHeight - scrollableElement.clientHeight,
          ${Number(this.getSetting("duration"))},
          scrollableElement
        );
      }
      !!scrollableElement;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  if (!scrollBottomResults[0] && sender.frameId !== 0) {
    await browser.tabs.executeScript(sender.tab.id, {
      code: `{
        const scrollableElement = document.scrollingElement;
        if (isScrollableY(scrollableElement)) {
          scrollToY(
            scrollableElement.scrollHeight - scrollableElement.clientHeight,
            ${Number(this.getSetting("duration"))},
            scrollableElement
          );
        }
      }`,
      runAt: 'document_start',
      frameId: 0
    });
  }
  // confirm success
  return true;
}


export async function ScrollPageDown (sender, data) {
  // returns true if there exists a scrollable element in the injected frame else false
  const scrollPageDownResults = await browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const scrollableElement = getClosestElement(TARGET, isScrollableY);
      if (scrollableElement) {
        scrollToY(
          scrollableElement.scrollTop + scrollableElement.clientHeight * 0.95,
          ${Number(this.getSetting("duration"))},
          scrollableElement
        );
      }
      !!scrollableElement;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  if (!scrollPageDownResults[0] && sender.frameId !== 0) {
    await browser.tabs.executeScript(sender.tab.id, {
      code: `{
        const scrollableElement = document.scrollingElement;
        if (isScrollableY(scrollableElement)) {
          scrollToY(
            scrollableElement.scrollTop + scrollableElement.clientHeight * 0.95,
            ${Number(this.getSetting("duration"))},
            scrollableElement
          );
        }
      }`,
      runAt: 'document_start',
      frameId: 0
    });
  }
  // confirm success
  return true;
}


export async function ScrollPageUp (sender, data) {
  // returns true if there exists a scrollable element in the injected frame else false
  const scrollPageUpResults = await browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const scrollableElement = getClosestElement(TARGET, isScrollableY);
      if (scrollableElement) {
        scrollToY(
          scrollableElement.scrollTop - scrollableElement.clientHeight * 0.95,
          ${Number(this.getSetting("duration"))},
          scrollableElement
        );
      }
      !!scrollableElement;
    }`,
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });

  // if there was no scrollable element and the gesture was triggered from a frame
  // try scrolling the main scrollbar of the main frame
  if (!scrollPageUpResults[0] && sender.frameId !== 0) {
    await browser.tabs.executeScript(sender.tab.id, {
      code: `{
        const scrollableElement = document.scrollingElement;
        if (isScrollableY(scrollableElement)) {
          scrollToY(
            scrollableElement.scrollTop - scrollableElement.clientHeight * 0.95,
            ${Number(this.getSetting("duration"))},
            scrollableElement
          );
        }
      }`,
      runAt: 'document_start',
      frameId: 0
    });
  }
  // confirm success
  return true;
}


export async function FocusRightTab (sender, data) {
  const queryInfo = {
    windowId: sender.tab.windowId,
    active: false,
    hidden: false
  }

  if (this.getSetting("excludeDiscarded")) queryInfo.discarded = false;

  const tabs = await browser.tabs.query(queryInfo);

  let nextTab;
  // if there is at least one tab to the right of the current
  if (tabs.some(cur => cur.index > sender.tab.index)) {
    // get closest tab to the right (if not found it will return the closest tab to the left)
    nextTab = tabs.reduce((acc, cur) =>
      (acc.index <= sender.tab.index && cur.index > acc.index) || (cur.index > sender.tab.index && cur.index < acc.index) ? cur : acc
    );
  }
  // get the most left tab if tab cycling is activated
  else if (this.getSetting("cycling") && tabs.length > 0) {
    nextTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
  }
  // focus next tab if available
  if (nextTab) {
    await browser.tabs.update(nextTab.id, { active: true });
    // confirm success
    return true;
  }
}


export async function FocusLeftTab (sender, data) {
  const queryInfo = {
    windowId: sender.tab.windowId,
    active: false,
    hidden: false
  }

  if (this.getSetting("excludeDiscarded")) queryInfo.discarded = false;

  const tabs = await browser.tabs.query(queryInfo);

  let nextTab;
  // if there is at least one tab to the left of the current
  if (tabs.some(cur => cur.index < sender.tab.index)) {
    // get closest tab to the left (if not found it will return the closest tab to the right)
    nextTab = tabs.reduce((acc, cur) =>
      (acc.index >= sender.tab.index && cur.index < acc.index) || (cur.index < sender.tab.index && cur.index > acc.index) ? cur : acc
    );
  }
  // else get most right tab if tab cycling is activated
  else if (this.getSetting("cycling") && tabs.length > 0) {
    nextTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
  }
  // focus next tab if available
  if (nextTab) {
    await browser.tabs.update(nextTab.id, { active: true });
    // confirm success
    return true;
  }
}

export async function FocusFirstTab (sender, data) {
  const queryInfo = {
    windowId: sender.tab.windowId,
    active: false,
    hidden: false
  };

  if (!this.getSetting("includePinned")) queryInfo.pinned = false;

  const tabs = await browser.tabs.query(queryInfo);

  // if there is at least one tab to the left of the current
  if (tabs.some(cur => cur.index < sender.tab.index)) {
    const firstTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
    await browser.tabs.update(firstTab.id, { active: true });
    // confirm success
    return true;
  }
}


export async function FocusLastTab (sender, data) {
  const tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    active: false,
    hidden: false
  });

  // if there is at least one tab to the right of the current
  if (tabs.some(cur => cur.index > sender.tab.index)) {
    const lastTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
    await browser.tabs.update(lastTab.id, { active: true });
    // confirm success
    return true;
  }
}


export async function FocusPreviousSelectedTab (sender, data) {
  const tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    active: false,
    hidden: false
  });

  if (tabs.length > 0) {
    const lastAccessedTab = tabs.reduce((acc, cur) => acc.lastAccessed > cur.lastAccessed ? acc : cur);
    await browser.tabs.update(lastAccessedTab.id, { active: true });
    // confirm success
    return true;
  }
}


export async function MaximizeWindow (sender, data) {
  await browser.windows.update(sender.tab.windowId, {
    state: 'maximized'
  });
  // confirm success
  return true;
}


export async function MinimizeWindow (sender, data) {
  await browser.windows.update(sender.tab.windowId, {
    state: 'minimized'
  });
  // confirm success
  return true;
}


export async function ToggleWindowSize (sender, data) {
  const window = await browser.windows.get(sender.tab.windowId);

  await browser.windows.update(sender.tab.windowId, {
    state: window.state === 'maximized' ? 'normal' : 'maximized'
  });
  // confirm success
  return true;
}


// maximizes the window if it is already in full screen mode
export async function ToggleFullscreen (sender, data) {
  const window = await browser.windows.get(sender.tab.windowId);

  await browser.windows.update(sender.tab.windowId, {
    state: window.state === 'fullscreen' ? 'maximized' : 'fullscreen'
  });
  // confirm success
  return true;
}


export async function NewWindow (sender, data) {
  await browser.windows.create({});
  // confirm success
  return true;
}


export async function NewPrivateWindow (sender, data) {
  try {
    await browser.windows.create({
      incognito: true
    });
    // confirm success
    return true;
  }
  catch (error) {
    if (error.message === 'Extension does not have permission for incognito mode') displayNotification(
      browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelNewPrivateWindow")),
      browser.i18n.getMessage('commandErrorNotificationMessageMissingIncognitoPermissions'),
      "https://github.com/Robbendebiene/Gesturefy/wiki/Missing-incognito-permission"
    );
  }
}


export async function MoveTabToStart (sender, data) {
  // query pinned tabs if current tab is pinned or vice versa
  const tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    pinned: sender.tab.pinned,
    hidden: false
  });

  const mostLeftTab = tabs.reduce((acc, cur) => cur.index < acc.index ? cur : acc);

  // if tab is not already at the start
  if (mostLeftTab.index !== sender.tab.index) {
    await browser.tabs.move(sender.tab.id, {
      index: mostLeftTab.index
    });
    // confirm success
    return true;
  }
}


export async function MoveTabToEnd (sender, data) {
  // query pinned tabs if current tab is pinned or vice versa
  const tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    pinned: sender.tab.pinned,
    hidden: false
  });

  const mostRightTab = tabs.reduce((acc, cur) => cur.index > acc.index ? cur : acc);

  // if tab is not already at the end
  if (mostRightTab.index !== sender.tab.index) {
    await browser.tabs.move(sender.tab.id, {
      index: mostRightTab.index + 1
    });
    // confirm success
    return true;
  }
}


export async function MoveTabToNewWindow (sender, data) {
  await browser.windows.create({
    tabId: sender.tab.id
  });
  // confirm success
  return true;
}


export async function MoveRightTabsToNewWindow (sender, data) {
  const queryProperties = {
    windowId: sender.tab.windowId,
    pinned: false,
    hidden: false
  };
  // exclude current tab if specified
  if (!this.getSetting("includeCurrent")) queryProperties.active = false;

  // query only unpinned tabs
  const tabs = await browser.tabs.query(queryProperties);
  const rightTabs = tabs.filter((ele) => ele.index >= sender.tab.index);
  const rightTabIds = rightTabs.map((ele) => ele.id);

  // create new window with the first tab and move corresponding tabs to the new window
  if (rightTabIds.length > 0) {
    const windowProperties = {
      tabId: rightTabIds.shift()
    };

    if (!this.getSetting("focus")) windowProperties.state = "minimized";

    const window = await browser.windows.create(windowProperties);
    await browser.tabs.move(rightTabIds, {
      windowId: window.id,
      index: 1
    });
    // confirm success
    return true;
  }
}


export async function MoveLeftTabsToNewWindow (sender, data) {
  const queryProperties = {
    windowId: sender.tab.windowId,
    pinned: false,
    hidden: false
  };
  // exclude current tab if specified
  if (!this.getSetting("includeCurrent")) queryProperties.active = false;

  // query only unpinned tabs
  const tabs = await browser.tabs.query(queryProperties);
  const leftTabs = tabs.filter((ele) => ele.index <= sender.tab.index);
  const leftTabIds = leftTabs.map((ele) => ele.id);

  // create new window with the last tab and move corresponding tabs to the new window
  if (leftTabIds.length > 0) {
    const windowProperties = {
      tabId: leftTabIds.pop()
    };

    if (!this.getSetting("focus")) windowProperties.state = "minimized";

    const window = await browser.windows.create(windowProperties);
    await browser.tabs.move(leftTabIds, {
      windowId: window.id,
      index: 0
    });
    // confirm success
    return true;
  }
}


export async function CloseWindow (sender, data) {
  await browser.windows.remove(sender.tab.windowId);
  // confirm success
  return true;
}


export async function ToRootURL (sender, data) {
  await browser.tabs.executeScript(sender.tab.id, {
    code: 'window.location = "/"',
    runAt: 'document_start'
  });
  // confirm success
  return true;
}


export async function URLLevelUp (sender, data) {
  await browser.tabs.executeScript(sender.tab.id, {
    code: `{
      const newPath = window.location.pathname.replace(/\\/([^/]+)\\/?$/g, '');
      window.location.assign( window.location.origin + newPath );
    }`,
    runAt: 'document_start'
  });
  // confirm success
  return true;
}


export async function IncreaseURLNumber (sender, data) {
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

    await browser.tabs.update(sender.tab.id, { "url": url.href });
    // confirm success
    return true;
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


export async function DecreaseURLNumber (sender, data) {
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

    await browser.tabs.update(sender.tab.id, { "url": url.href });
    // confirm success
    return true;
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


export async function OpenImageInNewTab (sender, data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
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

    await browser.tabs.create({
      url: data.target.src,
      active: this.getSetting("focus"),
      index: index,
      openerTabId: sender.tab.id
    });
    // confirm success
    return true;
  }
}


export async function OpenLinkInNewTab (sender, data) {
  let url = null;
  // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
  if (isHTTPURL(data.textSelection)) url = data.textSelection;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(data.textSelection)) url = "http://" + data.textSelection.trim();
  // check if the provided url can be opened by webextensions (is not privileged)
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
    await browser.tabs.create({
      url: url,
      active: this.getSetting("focus"),
      index: index,
      openerTabId: sender.tab.id
    });
    // confirm success
    return true;
  }
}


export async function OpenLinkInNewWindow (sender, data) {
  let url = null;
  // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
  if (isHTTPURL(data.textSelection)) url = data.textSelection;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(data.textSelection)) url = "http://" + data.textSelection.trim();
  // check if the provided url can be opened by webextensions (is not privileged)
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || this.getSetting("emptyWindow")) {
    await browser.windows.create({
      url: url
    });
    // confirm success
    return true;
  }
}


export async function OpenLinkInNewPrivateWindow (sender, data) {
  let url = null;
  // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
  if (isHTTPURL(data.textSelection)) url = data.textSelection;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(data.textSelection)) url = "http://" + data.textSelection.trim();
  // check if the provided url can be opened by webextensions (is not privileged)
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url || this.getSetting("emptyWindow")) {
    try {
      await browser.windows.create({
        url: url,
        incognito: true
      });
      // confirm success
      return true;
    }
    catch (error) {
      if (error.message === 'Extension does not have permission for incognito mode') displayNotification(
        browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelNewPrivateWindow")),
        browser.i18n.getMessage('commandErrorNotificationMessageMissingIncognitoPermissions'),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Missing-incognito-permission"
      );
    }
  }
}


export async function LinkToNewBookmark (sender, data) {
  let url = null, title = null;
  // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
  if (isHTTPURL(data.textSelection)) url = data.textSelection;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(data.textSelection)) url = "http://" + data.textSelection.trim();
  else if (data.link && data.link.href) {
    url = data.link.href;
    title = data.link.title || data.link.textContent || data.target.title || null;
  }

  if (url) {
    await browser.bookmarks.create({
      url: url,
      title: title || new URL(url).hostname
    });
    // confirm success
    return true;
  }
}


export async function SearchTextSelection (sender, data) {
  if (data.textSelection.trim() === "" && this.getSetting("openEmptySearch") === false) {
    return;
  }

  // use about:blank to prevent the display of the new tab page
  const tabProperties = {
    active: this.getSetting("focus"),
    openerTabId: sender.tab.id,
    url: "about:blank"
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
  const searchEngineURL = this.getSetting("searchEngineURL");
  if (searchEngineURL) {
    // if contains placeholder replace it
    if (searchEngineURL.includes("%s")) {
      tabProperties.url = searchEngineURL.replace("%s", encodeURIComponent(data.textSelection));
    }
    // else append to url
    else {
      tabProperties.url = searchEngineURL + encodeURIComponent(data.textSelection);
    }
    await browser.tabs.create(tabProperties);
  }
  else {
    const tab = await browser.tabs.create(tabProperties);
    await browser.search.search({
      query: data.textSelection,
      tabId: tab.id
    });
  }
  // confirm success
  return true;
}


export async function SearchClipboard (sender, data) {
  const clipboardText = await navigator.clipboard.readText();

  if (clipboardText.trim() === "" && this.getSetting("openEmptySearch") === false) {
    return;
  }

  // use about:blank to prevent the display of the new tab page
  const tabProperties = {
    active: this.getSetting("focus"),
    openerTabId: sender.tab.id,
    url: "about:blank"
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
  const searchEngineURL = this.getSetting("searchEngineURL");
  if (searchEngineURL) {
    // if contains placeholder replace it
    if (searchEngineURL.includes("%s")) {
      tabProperties.url = searchEngineURL.replace("%s", encodeURIComponent(data.textSelection));
    }
    // else append to url
    else {
      tabProperties.url = searchEngineURL + encodeURIComponent(data.textSelection);
    }
    await browser.tabs.create(tabProperties);
  }
  else {
    const tab = await browser.tabs.create(tabProperties);
    await browser.search.search({
      query: clipboardText,
      tabId: tab.id
    });
  }
  // confirm success
  return true;
}


export async function OpenCustomURLInNewTab (sender, data) {
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

  try {
    await browser.tabs.create({
      url: this.getSetting("url"),
      active: this.getSetting("focus"),
      index: index,
    });
    // confirm success
    return true;
  }
  catch (error) {
    // create error notification and open corresponding wiki page on click
    displayNotification(
      browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelOpenCustomURLInNewTab")),
      browser.i18n.getMessage('commandErrorNotificationMessageIllegalURL'),
      "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL"
    );
  }
}


export async function OpenCustomURL (sender, data) {
  try {
    await browser.tabs.update(sender.tab.id, {
      url: this.getSetting("url")
    });
    // confirm success
    return true;
  }
  catch (error) {
    // create error notification and open corresponding wiki page on click
    displayNotification(
      browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelOpenCustomURL")),
      browser.i18n.getMessage('commandErrorNotificationMessageIllegalURL'),
      "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL"
    );
  };
}


export async function OpenHomepage (sender, data) {
  let homepageURL = (await browser.browserSettings.homepageOverride.get({})).value;
  // try adding protocol on invalid url
  if (!isURL(homepageURL)) homepageURL = 'http://' + homepageURL;

  try {
    if (sender.tab.pinned) {
      await browser.tabs.create({
        url: homepageURL,
        active: true,
      });
    }
    else {
      await browser.tabs.update(sender.tab.id, {
        url: homepageURL
      });
    }
    // confirm success
    return true;
  }
  catch (error) {
    // create error notification and open corresponding wiki page on click
    displayNotification(
      browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelOpenHomepage")),
      browser.i18n.getMessage('commandErrorNotificationMessageIllegalURL'),
      "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL"
    );
  }
}


export async function OpenLink (sender, data) {
  let url = null;
  // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
  if (isHTTPURL(data.textSelection)) url = data.textSelection;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(data.textSelection)) url = "http://" + data.textSelection.trim();
  // check if the provided url can be opened by webextensions (is not privileged)
  else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

  if (url) {
    if (sender.tab.pinned) {
      const tabs = await browser.tabs.query({
        windowId: sender.tab.windowId,
        pinned: false,
        hidden: false
      });

      // get the lowest index excluding pinned tabs
      let mostLeftTabIndex = 0;
      if (tabs.length > 0) mostLeftTabIndex = tabs.reduce((min, cur) => min.index < cur.index ? min : cur).index;

      await browser.tabs.create({
        url: url,
        active: true,
        index: mostLeftTabIndex,
        openerTabId: sender.tab.id
      });
    }
    else await browser.tabs.update(sender.tab.id, {
      url: url
    });
    // confirm success
    return true;
  }
}


export async function ViewImage (sender, data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
    if (sender.tab.pinned) {
      const tabs = await browser.tabs.query({
        windowId: sender.tab.windowId,
        pinned: false,
        hidden: false
      });

      // get the lowest index excluding pinned tabs
      let mostLeftTabIndex = 0;
      if (tabs.length > 0) mostLeftTabIndex = tabs.reduce((min, cur) => min.index < cur.index ? min : cur).index;

      await browser.tabs.create({
        url: data.target.src,
        active: true,
        index: mostLeftTabIndex,
        openerTabId: sender.tab.id
      });
    }
    else await browser.tabs.update(sender.tab.id, {
      url: data.target.src
    });
    // confirm success
    return true;
  }
}


export async function OpenURLFromClipboard (sender, data) {
  const clipboardText = await navigator.clipboard.readText();

  let url = null;
  // check if the provided url can be opened by webextensions (is not privileged)
  if (isLegalURL(clipboardText)) url = clipboardText;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(clipboardText)) url = "http://" + clipboardText.trim();

  if (url) {
    await browser.tabs.update(sender.tab.id, {
      url: url
    });
    // confirm success
    return true;
  }
}


export async function OpenURLFromClipboardInNewTab (sender, data) {
  const clipboardText = await navigator.clipboard.readText();

  let url = null;
  // check if the provided url can be opened by webextensions (is not privileged)
  if (isLegalURL(clipboardText)) url = clipboardText;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(clipboardText)) url = "http://" + clipboardText.trim();

  if (url) {
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

    await browser.tabs.create({
      url: url,
      active: this.getSetting("focus"),
      index: index
    });
    // confirm success
    return true;
  }
}


export async function PasteClipboard (sender, data) {
  await browser.tabs.executeScript(sender.tab.id, {
    code: 'document.execCommand("paste")',
    runAt: 'document_start',
    frameId: sender.frameId || 0
  });
  // confirm success
  return true;
}


export async function SaveTabAsPDF (sender, data) {
  await browser.tabs.saveAsPDF({});
  // confirm success
  return true;
}


export async function PrintTab (sender, data) {
  await browser.tabs.print();
  // confirm success
  return true;
}


export async function OpenPrintPreview (sender, data) {
  await browser.tabs.printPreview();
  // confirm success
  return true;
}


export async function SaveScreenshot (sender, data) {
  let screenshotURL = await browser.tabs.captureVisibleTab();
  // convert data uri to blob
  screenshotURL = URL.createObjectURL(dataURItoBlob(screenshotURL));

  const downloadId = await browser.downloads.download({
    url: screenshotURL,
    // remove special file name characters
    filename: sanitizeFilename(sender.tab.title) + '.png',
    saveAs: true
  });

  // catch error and free the blob for gc
  if (browser.runtime.lastError) URL.revokeObjectURL(screenshotURL);
  else browser.downloads.onChanged.addListener(function clearURL(downloadDelta) {
    if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
      URL.revokeObjectURL(screenshotURL);
      browser.downloads.onChanged.removeListener(clearURL);
    }
  });
  // confirm success
  return true;
}

export async function CopyTabURL (sender, data) {
  await navigator.clipboard.writeText(sender.tab.url);
  // confirm success
  return true;
}


export async function CopyLinkURL (sender, data) {
  let url = null;
  // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
  if (isHTTPURL(data.textSelection)) url = data.textSelection;
  else if (data.link && data.link.href) url = data.link.href;

  if (url) {
    await navigator.clipboard.writeText(url);
    // confirm success
    return true;
  }
}


export async function CopyImageURL (sender, data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
    await navigator.clipboard.writeText(data.target.src);
    // confirm success
    return true;
  }
}


export async function CopyTextSelection (sender, data) {
  if (data.textSelection) {
    await navigator.clipboard.writeText(data.textSelection);
    // confirm success
    return true;
  }
}


export async function CopyImage (sender, data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
    const response = await fetch(data.target.src);
    const mimeType = response.headers.get("Content-Type");

    switch (mimeType) {
      case "image/jpeg": {
        const buffer = await response.arrayBuffer();
        await browser.clipboard.setImageData(buffer, "jpeg");
      } break;

      case "image/png": {
        const buffer = await response.arrayBuffer();
        await browser.clipboard.setImageData(buffer, "png");
      } break;

      // convert other file types to png using the canvas api
      default: {
        const image = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = data.target.src;
        });

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        // read png image from canvas as blob and write it to clipboard
        const blob = await new Promise((resolve) => canvas.toBlob(resolve), "image/png");
        const buffer = await blob.arrayBuffer();
        await browser.clipboard.setImageData(buffer, "png");
      } break;
    }
    // confirm success
    return true;
  }
}


export async function SaveImage (sender, data) {
  if (data.target.nodeName.toLowerCase() === "img" && data.target.src && isURL(data.target.src)) {
    const queryOptions = {
      saveAs: this.getSetting("promptDialog")
    };

    const imageURLObject = new URL(data.target.src);
    // if data url create blob
    if (imageURLObject.protocol === "data:") {
      queryOptions.url = URL.createObjectURL(dataURItoBlob(data.target.src));
      // get file extension from mime type
      const fileExtension =  data.target.src.split("data:image/").pop().split(";")[0];
      // construct file name
      queryOptions.filename = data.target.alt || data.target.title || "image";
      // remove special characters and add file extension
      queryOptions.filename = sanitizeFilename(queryOptions.filename) + "." + fileExtension;
    }
    // otherwise use normal url
    else queryOptions.url = data.target.src;

    // add referer header, because some websites modify the image if the referer is missing
    // get referrer from content script
    const documentValues = (await browser.tabs.executeScript(sender.tab.id, {
      code: "({ referrer: document.referrer, url: window.location.href })",
      runAt: "document_start",
      frameId: sender.frameId || 0
    }))[0];

    // if the image is embedded in a website use the url of that website as the referer
    if (data.target.src !== documentValues.url) {
      // emulate no-referrer-when-downgrade
      // The origin, path, and querystring of the URL are sent as a referrer when the protocol security level stays the same (HTTP→HTTP, HTTPS→HTTPS)
      // or improves (HTTP→HTTPS), but isn't sent to less secure destinations (HTTPS→HTTP).
      if (!(new URL(documentValues.url).protocol === "https:" && imageURLObject.protocol === "http:")) {
        queryOptions.headers = [ { name: "Referer", value: documentValues.url.split("#")[0] } ];
      }
    }
    // if the image is not embedded, but a referrer is set use the referrer
    else if (documentValues.referrer) {
      queryOptions.headers = [ { name: "Referer", value: documentValues.referrer } ];
    }

    // download image
    const downloadId = await browser.downloads.download(queryOptions);

    // if data url then assume a blob file was created and clear its url
    if (imageURLObject.protocol === "data:") {
      // catch error and free the blob for gc
      if (browser.runtime.lastError) URL.revokeObjectURL(queryOptions.url);
      else browser.downloads.onChanged.addListener(function clearURL(downloadDelta) {
        if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
          URL.revokeObjectURL(queryOptions.url);
          browser.downloads.onChanged.removeListener(clearURL);
        }
      });
    }
    // confirm success
    return true;
  }
}


export async function SaveLink (sender, data) {
  let url = null;
  // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
  if (isHTTPURL(data.textSelection)) url = data.textSelection;
  // if selected text matches the format of a domian name add the missing protocol
  else if (isDomainName(data.textSelection)) url = "http://" + data.textSelection.trim();
  else if (data.link && data.link.href) url = data.link.href;

  if (url) {
    await browser.downloads.download({
      url: url,
      saveAs: this.getSetting("promptDialog")
    });
    // confirm success
    return true;
  }
}


export async function ViewPageSourceCode (sender, data) {
  await browser.tabs.create({
    active: true,
    index: sender.tab.index + 1,
    url: "view-source:" + sender.tab.url
  });
  // confirm success
  return true;
}


export async function OpenAddonSettings (sender, data) {
  await browser.runtime.openOptionsPage();
  // confirm success
  return true;
}


export async function PopupAllTabs (sender, data) {
  const tabs = await browser.tabs.query({
    windowId: sender.tab.windowId,
    hidden: false
  });
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

  // request popup creation and wait for response
  const popupCreatedSuccessfully = await browser.tabs.sendMessage(sender.tab.id, {
    subject: "popupRequest",
    data: {
      mousePositionX: data.mousePosition.x,
      mousePositionY: data.mousePosition.y
    },
  }, { frameId: 0 });

  // if popup creation failed exit this command function
  if (!popupCreatedSuccessfully) return;

  const channel = browser.tabs.connect(sender.tab.id, {
    name: "PopupConnection"
  });

  channel.postMessage(dataset);

  channel.onMessage.addListener((message) => {
    browser.tabs.update(Number(message.id), {active: true});
    // immediately disconnect the channel since keeping the popup open doesn't make sense
    channel.disconnect();
  });
  // confirm success
  return true;
}


export async function PopupRecentlyClosedTabs (sender, data) {
  let recentlyClosedSessions = await browser.sessions.getRecentlyClosed({});
  // filter windows
  recentlyClosedSessions = recentlyClosedSessions.filter((element) => "tab" in element)
  // map sessions to popup data structure
  const dataset = recentlyClosedSessions.map((element) => ({
    id: element.tab.sessionId,
    label: element.tab.title,
    icon: element.tab.favIconUrl || null
  }));

  // request popup creation and wait for response
  const popupCreatedSuccessfully = await browser.tabs.sendMessage(sender.tab.id, {
    subject: "popupRequest",
    data: {
      mousePositionX: data.mousePosition.x,
      mousePositionY: data.mousePosition.y
    },
  }, { frameId: 0 });

  // if popup creation failed exit this command function
  if (!popupCreatedSuccessfully) return;

  const channel = browser.tabs.connect(sender.tab.id, {
    name: "PopupConnection"
  });

  channel.postMessage(dataset);

  channel.onMessage.addListener((message) => {
    browser.sessions.restore(message.id);
    // immediately disconnect the channel since keeping the popup open doesn't make sense
    // restored tab is always focused, probably because it is restored at its original tab index
    channel.disconnect();
  });
  // confirm success
  return true;
}


export async function PopupSearchEngines (sender, data) {
  // use about:blank to prevent the display of the new tab page
  const tabProperties = {
    openerTabId: sender.tab.id,
    url: "about:blank"
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

  const searchEngines = await browser.search.get();
  // map search engines to popup data structure
  const dataset = searchEngines.map((searchEngine) => ({
    id: searchEngine.name,
    label: searchEngine.name,
    icon: searchEngine.favIconUrl || null
  }));

  // request popup creation and wait for response
  const popupCreatedSuccessfully = await browser.tabs.sendMessage(sender.tab.id, {
    subject: "popupRequest",
    data: {
      mousePositionX: data.mousePosition.x,
      mousePositionY: data.mousePosition.y
    },
  }, { frameId: 0 });

  // if popup creation failed exit this command function
  if (!popupCreatedSuccessfully) return;

  const channel = browser.tabs.connect(sender.tab.id, {
    name: "PopupConnection"
  });

  channel.postMessage(dataset);

  channel.onMessage.addListener(async (message) => {
    // check if primary button was pressed
    if (message.button === 0) {
      // focus new tab
      tabProperties.active = true;
      // disconnect channel / close popup
      channel.disconnect();
    }
    else {
      // always open in background if a non-primary button was clicked and keep popup open
      tabProperties.active = false;
    }

    const tab = await browser.tabs.create(tabProperties);
    browser.search.search({
      query: data.textSelection,
      engine: message.id,
      tabId: tab.id
    });
  });
  // confirm success
  return true;
}


export async function SendMessageToOtherAddon (sender, data) {
  let message = this.getSetting("message");

  if (this.getSetting("parseJSON")) {
    // parse message to json object if serializeable
    try {
      message = JSON.parse(this.getSetting("message"));
    }
    catch(error) {
      displayNotification(
        browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelSendMessageToOtherAddon")),
        browser.i18n.getMessage('commandErrorNotificationMessageNotSerializeable'),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon#error-not-serializeable"
      );
      console.log(error);
      return;
    }
  }
  try {
    await browser.runtime.sendMessage(this.getSetting("extensionId"), message, {});
    // confirm success
    return true;
  }
  catch (error) {
    if (error.message === 'Could not establish connection. Receiving end does not exist.') displayNotification(
      browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelSendMessageToOtherAddon")),
      browser.i18n.getMessage('commandErrorNotificationMessageMissingRecipient'),
      "https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon#error-missing-recipient"
    );
  };
}


export async function ExecuteUserScript (sender, data) {
  const messageOptions = {};

  switch (this.getSetting("targetFrame")) {
    case "allFrames": break;

    case "topFrame":
      messageOptions.frameId = 0;
    break;

    case "sourceFrame":
    default:
      messageOptions.frameId = sender.frameId || 0;
    break;
  }

  // sends a message to the user script controller
  await browser.tabs.sendMessage(
    sender.tab.id,
    {
      subject: "executeUserScript",
      data: this.getSetting("userScript")
    },
    messageOptions
  );
  // confirm success
  return true;
}


export async function ClearBrowsingData (sender, data) {
  await browser.browsingData.remove({}, {
    "cache": this.getSetting("cache"),
    "cookies": this.getSetting("cookies"),
    "downloads": this.getSetting("downloads"),
    "formData": this.getSetting("formData"),
    "history": this.getSetting("history"),
    "indexedDB": this.getSetting("indexedDB"),
    "localStorage": this.getSetting("localStorage"),
    "passwords": this.getSetting("passwords"),
    "pluginData": this.getSetting("pluginData"),
    "serviceWorkers": this.getSetting("serviceWorkers")
  });
  // confirm success
  return true;
}

