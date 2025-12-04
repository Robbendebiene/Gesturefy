import Command from "/core/models/command.mjs";
import {
  isURL,
  isHTTPURL,
  isLegalURL,
  isDomainName,
  sanitizeFilename,
  dataURItoBlob,
  displayNotification
} from "/core/utils/commons.mjs";

/*
 * Commands
 * Every command fulfils its promise when its internal processes finishes.
 * The promise will be rejected on error.
 * If the command could be successfully executed true will be returned
 * Else nothing will be returned.
 * The execution can fail for insufficient conditions like a missing url or image.
 */

export class DuplicateTab extends Command {
  settings = {
    position: "default",
    focus: true
  };

  async execute(sender, data) {
    let index;

    switch (this.settings["position"]) {
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
      active: this.settings["focus"],
      index: index
    });
    // confirm success
    return true;
  }
}


export class NewTab extends Command {
  settings = {
    position: "default",
    focus: true
  };

  async execute(sender, data) {
    let index;

    switch (this.settings["position"]) {
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
      active: this.settings["focus"],
      index: index
    });
    // confirm success
    return true;
  }
}


export class CloseTab extends Command {
  settings = {
    nextFocus: "default",
    closePinned: true
  };

  async execute(sender, data) {
    // remove tab if not pinned or remove-pinned-tabs option is enabled
    if (this.settings["closePinned"] || !sender.tab.pinned) {
      const tabs = await browser.tabs.query({
        windowId: sender.tab.windowId,
        active: false,
        hidden: false
      });

      // if there are other tabs to focus
      if (tabs.length > 0) {
        let nextTab = null;

        switch (this.settings["nextFocus"]) {
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
}


export class CloseRightTabs extends Command {

  async execute(sender, data) {
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
}


export class CloseLeftTabs extends Command {

  async execute(sender, data) {
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
}


export class CloseOtherTabs extends Command {

  async execute(sender, data) {
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
}


export class RestoreTab extends Command {
  permissions = ["sessions"];
  settings = {
    currentWindowOnly: false
  };

  async execute(sender, data) {
    let recentlyClosedSessions = await browser.sessions.getRecentlyClosed();

    // exclude windows and tabs from different windows
    if (this.settings["currentWindowOnly"]) {
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
}


export class ReloadTab extends Command {
  settings = {
    cache: false
  };

  async execute(sender, data) {
    await browser.tabs.reload(sender.tab.id, { bypassCache: this.settings["cache"] });
    // confirm success
    return true;
  }
}


export class StopLoading extends Command {

  async execute(sender, data) {
    // returns the ready state in a result object of each frame as an array
    const stopLoadingResults = await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        allFrames: true
      },
      injectImmediately: true,
      func: () => {
        const readyState = document.readyState;
        window.stop();
        return readyState;
      }
    });
    // if at least one frame was not finished loading
    if (stopLoadingResults.some(result => result.result !== "complete")) {
      // confirm success
      return true;
    }
  }
}


export class ReloadFrame extends Command {
  settings = {
    cache: false
  };

  async execute(sender, data) {
    if (sender.frameId) {
      await browser.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [ sender.frameId ]
        },
        injectImmediately: true,
        func: (bypassCache) => window.location.reload(bypassCache),
        args: [ Boolean(this.settings["cache"]) ]
      });
      // confirm success
      return true;
    }
  }
}


export class ReloadAllTabs extends Command {
  settings = {
    cache: false
  };

  async execute(sender, data) {
    const tabs = await browser.tabs.query({
      windowId: sender.tab.windowId,
      hidden: false
    });

    await Promise.all(tabs.map((tab) => {
      return browser.tabs.reload(tab.id, { bypassCache: this.settings["cache"] });
    }));
    // confirm success
    return true;
  }
}


export class ZoomIn extends Command {
  settings = {
    step: ""
  };

  async execute(sender, data) {
    const zoomSetting = this.settings["step"];
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
}


export class ZoomOut extends Command {
  settings = {
    step: ""
  };

  async execute(sender, data) {
    const zoomSetting = this.settings["step"];
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
}


export class ZoomReset extends Command {

  async execute(sender, data) {
    const [currentZoom, zoomSettings] = await Promise.all([
      browser.tabs.getZoom(sender.tab.id),
      browser.tabs.getZoomSettings(sender.tab.id)
    ]);

    if (currentZoom !== zoomSettings.defaultZoomFactor) {
      await browser.tabs.setZoom(sender.tab.id, zoomSettings.defaultZoomFactor);
      // confirm success
      return true;
    }
  }
}


export class PageBack extends Command {

  async execute(sender, data) {
    await browser.tabs.goBack(sender.tab.id);
    // confirm success
    return true;
  }
}


export class PageForth extends Command {

  async execute(sender, data) {
    await browser.tabs.goForward(sender.tab.id);
    // confirm success
    return true;
  }
}


export class TogglePin extends Command {

  // reverts the action if already pinned
  async execute(sender, data) {
    await browser.tabs.update(sender.tab.id, { pinned: !sender.tab.pinned });
    // confirm success
    return true;
  }
}


export class ToggleMute extends Command {

  // reverts the action if already muted
  async execute(sender, data) {
    await browser.tabs.update(sender.tab.id, { muted: !sender.tab.mutedInfo.muted });
    // confirm success
    return true;
  }
}


export class ToggleBookmark extends Command {
  permissions = ["bookmarks"];

  // reverts the action if already bookmarked
  async execute(sender, data) {
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
}


export class ToggleReaderMode extends Command {

  // reverts the action if already in reader mode
  async execute(sender, data) {
    await browser.tabs.toggleReaderMode(sender.tab.id);
    // confirm success
    return true;
  }
}


export class ScrollTop extends Command {
  settings = {
    duration: 100
  };

  async execute(sender, data) {
    // content script code
    function contentScrollTop (duration, scrollMain) {
      let scrollableElement, canScrollUp;
      if (scrollMain) {
        scrollableElement = document.scrollingElement;
        canScrollUp = isScrollableY(scrollableElement) && scrollableElement.scrollTop > 0;
      }
      else {
        scrollableElement = getClosestElement(TARGET, isScrollableY);
        canScrollUp = scrollableElement && scrollableElement.scrollTop > 0;
      }

      if (canScrollUp) {
        scrollToY(0, duration, scrollableElement);
      }
      return [!!scrollableElement, canScrollUp];
    }

    // returns true if there exists a scrollable element in the injected frame
    // which can be scrolled upwards else false
    let [{result: [hasScrollableElement, canScrollUp]}] = await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [ sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: contentScrollTop,
      args: [
        Number(this.settings["duration"])
      ]
    });
    // if there was no scrollable element and the gesture was triggered from a frame
    // try scrolling the main scrollbar of the main frame
    if (!hasScrollableElement && sender.frameId !== 0) {
      [{result: [hasScrollableElement, canScrollUp]}] = await browser.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [ 0 ]
        },
        injectImmediately: true,
        func: contentScrollTop,
        args: [
          Number(this.settings["duration"]),
          true
        ]
      });
    }
    // confirm success/failure
    return canScrollUp;
  }
}


export class ScrollBottom extends Command {
  settings = {
    duration: 100
  };

  async execute(sender, data) {
    // content script code
    function contentScrollBottom (duration, scrollMain) {
      let scrollableElement, canScrollDown;
      if (scrollMain) {
        scrollableElement = document.scrollingElement;
        canScrollDown = isScrollableY(scrollableElement) &&
          scrollableElement.scrollTop < scrollableElement.scrollHeight - scrollableElement.clientHeight;
      }
      else {
        scrollableElement = getClosestElement(TARGET, isScrollableY);
        canScrollDown = scrollableElement &&
          scrollableElement.scrollTop < scrollableElement.scrollHeight - scrollableElement.clientHeight;
      }

      if (canScrollDown) {
        scrollToY(
          scrollableElement.scrollHeight - scrollableElement.clientHeight,
          duration,
          scrollableElement
        );
      }
      return [!!scrollableElement, canScrollDown];
    }

    // returns true if there exists a scrollable element in the injected frame
    // which can be scrolled downwards else false
    let [{result: [hasScrollableElement, canScrollDown]}] = await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [ sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: contentScrollBottom,
      args: [
        Number(this.settings["duration"])
      ]
    });
    // if there was no scrollable element and the gesture was triggered from a frame
    // try scrolling the main scrollbar of the main frame
    if (!hasScrollableElement && sender.frameId !== 0) {
      [{result: [hasScrollableElement, canScrollDown]}] = await browser.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [ 0 ]
        },
        injectImmediately: true,
        func: contentScrollBottom,
        args: [
          Number(this.settings["duration"]),
          true
        ]
      });
    }
    // confirm success/failure
    return canScrollDown;
  }
}


export class ScrollPageUp extends Command {
  settings = {
    duration: 100,
    scrollProportion: 95
  };

  async execute(sender, data) {
    // content script code
    function contentScrollUp (duration, scrollRatio, scrollMain) {
      let scrollableElement, canScrollUp;
      if (scrollMain) {
        scrollableElement = document.scrollingElement;
        canScrollUp = isScrollableY(scrollableElement) && scrollableElement.scrollTop > 0;
      }
      else {
        scrollableElement = getClosestElement(TARGET, isScrollableY);
        canScrollUp = scrollableElement && scrollableElement.scrollTop > 0;
      }

      if (canScrollUp) {
        scrollToY(
          scrollableElement.scrollTop - scrollableElement.clientHeight * scrollRatio,
          duration,
          scrollableElement
        );
      }
      return [!!scrollableElement, canScrollUp];
    }

    const scrollRatio = Number(this.settings["scrollProportion"]) / 100;

    // returns true if there exists a scrollable element in the injected frame
    // which can be scrolled upwards else false
    let [{result: [hasScrollableElement, canScrollUp]}] = await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [ sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: contentScrollUp,
      args: [
        Number(this.settings["duration"]),
        scrollRatio
      ]
    });
    // if there was no scrollable element and the gesture was triggered from a frame
    // try scrolling the main scrollbar of the main frame
    if (!hasScrollableElement && sender.frameId !== 0) {
      [{result: [hasScrollableElement, canScrollUp]}] = await browser.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [ 0 ]
        },
        injectImmediately: true,
        func: contentScrollUp,
        args: [
          Number(this.settings["duration"]),
          scrollRatio,
          true
        ]
      });
    }
    // confirm success/failure
    return canScrollUp;
  }
}


export class ScrollPageDown extends Command {
  settings = {
    duration: 100,
    scrollProportion: 95
  };

  async execute(sender, data) {
    // content script code
    function contentScrollDown (duration, scrollRatio, scrollMain) {
      let scrollableElement, canScrollDown;
      if (scrollMain) {
        scrollableElement = document.scrollingElement;
        canScrollDown = isScrollableY(scrollableElement) &&
          scrollableElement.scrollTop < scrollableElement.scrollHeight - scrollableElement.clientHeight;
      }
      else {
        scrollableElement = getClosestElement(TARGET, isScrollableY);
        canScrollDown = scrollableElement &&
          scrollableElement.scrollTop < scrollableElement.scrollHeight - scrollableElement.clientHeight;
      }

      if (canScrollDown) {
        scrollToY(
          scrollableElement.scrollTop + scrollableElement.clientHeight * scrollRatio,
          duration,
          scrollableElement
        );
      }
      return [!!scrollableElement, canScrollDown];
    }

    const scrollRatio = Number(this.settings["scrollProportion"]) / 100;

    // returns true if there exists a scrollable element in the injected frame
    // which can be scrolled upwards else false
    let [{result: [hasScrollableElement, canScrollDown]}] = await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [ sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: contentScrollDown,
      args: [
        Number(this.settings["duration"]),
        scrollRatio
      ]
    });
    // if there was no scrollable element and the gesture was triggered from a frame
    // try scrolling the main scrollbar of the main frame
    if (!hasScrollableElement && sender.frameId !== 0) {
      [{result: [hasScrollableElement, canScrollDown]}] = await browser.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [ 0 ]
        },
        injectImmediately: true,
        func: contentScrollDown,
        args: [
          Number(this.settings["duration"]),
          scrollRatio,
          true
        ]
      });
    }
    // confirm success/failure
    return canScrollDown;
  }
}


export class FocusRightTab extends Command {
  settings = {
    cycling: true,
    excludeDiscarded: false
  };

  async execute(sender, data) {
    const queryInfo = {
      windowId: sender.tab.windowId,
      active: false,
      hidden: false
    }

    if (this.settings["excludeDiscarded"]) queryInfo.discarded = false;

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
    else if (this.settings["cycling"] && tabs.length > 0) {
      nextTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
    }
    // focus next tab if available
    if (nextTab) {
      await browser.tabs.update(nextTab.id, { active: true });
      // confirm success
      return true;
    }
  }
}


export class FocusLeftTab extends Command {
  settings = {
    cycling: true,
    excludeDiscarded: false
  };

  async execute(sender, data) {
    const queryInfo = {
      windowId: sender.tab.windowId,
      active: false,
      hidden: false
    }

    if (this.settings["excludeDiscarded"]) queryInfo.discarded = false;

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
    else if (this.settings["cycling"] && tabs.length > 0) {
      nextTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
    }
    // focus next tab if available
    if (nextTab) {
      await browser.tabs.update(nextTab.id, { active: true });
      // confirm success
      return true;
    }
  }
}


export class FocusFirstTab extends Command {
  settings = {
    includePinned: false
  };

  async execute(sender, data) {
    const queryInfo = {
      windowId: sender.tab.windowId,
      active: false,
      hidden: false
    };

    if (!this.settings["includePinned"]) queryInfo.pinned = false;

    const tabs = await browser.tabs.query(queryInfo);

    // if there is at least one tab to the left of the current
    if (tabs.some(cur => cur.index < sender.tab.index)) {
      const firstTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
      await browser.tabs.update(firstTab.id, { active: true });
      // confirm success
      return true;
    }
  }
}


export class FocusLastTab extends Command {

  async execute(sender, data) {
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
}


export class FocusPreviousSelectedTab extends Command {

  async execute(sender, data) {
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
}


export class MaximizeWindow extends Command {

  async execute(sender, data) {
    const window = await browser.windows.get(sender.tab.windowId);
    if (window.state !== 'maximized') {
      await browser.windows.update(sender.tab.windowId, {
        state: 'maximized'
      });
      // confirm success
      return true;
    }
  }
}


export class MinimizeWindow extends Command {

  async execute(sender, data) {
    await browser.windows.update(sender.tab.windowId, {
      state: 'minimized'
    });
    // confirm success
    return true;
  }
}


export class ToggleWindowSize extends Command {

  async execute(sender, data) {
    const window = await browser.windows.get(sender.tab.windowId);

    await browser.windows.update(sender.tab.windowId, {
      state: window.state === 'maximized' ? 'normal' : 'maximized'
    });
    // confirm success
    return true;
  }
}


// maximizes the window if it is already in full screen mode
export class ToggleFullscreen extends Command {

  async execute(sender, data) {
    const window = await browser.windows.get(sender.tab.windowId);

    await browser.windows.update(sender.tab.windowId, {
      state: window.state === 'fullscreen' ? 'maximized' : 'fullscreen'
    });
    // confirm success
    return true;
  }
}


// Activates full screen mode for the current window if it is not already in full screen mode
export class EnterFullscreen extends Command {

  async execute(sender, data) {
    const window = await browser.windows.get(sender.tab.windowId);
    if (window.state !== 'fullscreen') {
      await browser.windows.update(sender.tab.windowId, {
        state: 'fullscreen'
      });
      // confirm success
      return true;
    }
  }
}


export class NewWindow extends Command {

  async execute(sender, data) {
    await browser.windows.create({});
    // confirm success
    return true;
  }
}


export class NewPrivateWindow extends Command {

  async execute(sender, data) {
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
}


export class MoveTabToStart extends Command {

  async execute(sender, data) {
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
}


export class MoveTabToEnd extends Command {

  async execute(sender, data) {
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
}


export class MoveTabRight extends Command {
  settings = {
    shift: 1,
    cycling: true
  };

  async execute(sender, data) {
    // query pinned tabs if current tab is pinned or vice versa
    const tabs = await browser.tabs.query({
      windowId: sender.tab.windowId,
      pinned: sender.tab.pinned,
      hidden: false
    });
    tabs.sort((a, b) => a.index - b.index);

    const currentTabQueryIndex = tabs.findIndex((tab) => tab.index === sender.tab.index);
    // defines the shift (offset and direction) of the tab
    // fallback to 1 on 0 or empty setting
    const shift = Number(this.settings["shift"]) || 1;
    let nextTabQueryIndex = currentTabQueryIndex + shift;
    if (this.settings["cycling"]) {
      // wrap index
      nextTabQueryIndex = ((nextTabQueryIndex % tabs.length) + tabs.length) % tabs.length;
    }
    else {
      nextTabQueryIndex = Math.min(nextTabQueryIndex, tabs.length - 1);
    }
    if (nextTabQueryIndex !== currentTabQueryIndex) {
      await browser.tabs.move(sender.tab.id, {
        index: tabs[nextTabQueryIndex].index,
      });
      // confirm success
      return true;
    }
  }
}


export class MoveTabLeft extends Command {
  settings = {
    shift: 1,
    cycling: true
  };

  async execute(sender, data) {
    // query pinned tabs if current tab is pinned or vice versa
    const tabs = await browser.tabs.query({
      windowId: sender.tab.windowId,
      pinned: sender.tab.pinned,
      hidden: false
    });
    tabs.sort((a, b) => a.index - b.index);

    const currentTabQueryIndex = tabs.findIndex((tab) => tab.index === sender.tab.index);
    // defines the shift (offset and direction) of the tab
      // fallback to 1 on 0 or empty setting
    const shift = -(Number(this.settings["shift"]) || 1);
    let nextTabQueryIndex = currentTabQueryIndex + shift;
    if (this.settings["cycling"]) {
      // wrap index
      nextTabQueryIndex = ((nextTabQueryIndex % tabs.length) + tabs.length) % tabs.length;
    }
    else {
      nextTabQueryIndex = Math.min(nextTabQueryIndex, tabs.length - 1);
    }
    if (nextTabQueryIndex !== currentTabQueryIndex) {
      await browser.tabs.move(sender.tab.id, {
        index: tabs[nextTabQueryIndex].index,
      });
      // confirm success
      return true;
    }
  }
}


export class MoveTabToNewWindow extends Command {

  async execute(sender, data) {
    await browser.windows.create({
      tabId: sender.tab.id
    });
    // confirm success
    return true;
  }
}


export class MoveRightTabsToNewWindow extends Command {
  settings = {
    focus: true,
    includeCurrent: false
  };

  async execute(sender, data) {
    const queryProperties = {
      windowId: sender.tab.windowId,
      pinned: false,
      hidden: false
    };
    // exclude current tab if specified
    if (!this.settings["includeCurrent"]) queryProperties.active = false;

    // query only unpinned tabs
    const tabs = await browser.tabs.query(queryProperties);
    const rightTabs = tabs.filter((ele) => ele.index >= sender.tab.index);
    const rightTabIds = rightTabs.map((ele) => ele.id);

    // create new window with the first tab and move corresponding tabs to the new window
    if (rightTabIds.length > 0) {
      const windowProperties = {
        tabId: rightTabIds.shift()
      };

      if (!this.settings["focus"]) windowProperties.state = "minimized";

      const window = await browser.windows.create(windowProperties);
      await browser.tabs.move(rightTabIds, {
        windowId: window.id,
        index: 1
      });
      // confirm success
      return true;
    }
  }
}


export class MoveLeftTabsToNewWindow extends Command {
  settings = {
    focus: true,
    includeCurrent: false
  };

  async execute(sender, data) {
    const queryProperties = {
      windowId: sender.tab.windowId,
      pinned: false,
      hidden: false
    };
    // exclude current tab if specified
    if (!this.settings["includeCurrent"]) queryProperties.active = false;

    // query only unpinned tabs
    const tabs = await browser.tabs.query(queryProperties);
    const leftTabs = tabs.filter((ele) => ele.index <= sender.tab.index);
    const leftTabIds = leftTabs.map((ele) => ele.id);

    // create new window with the last tab and move corresponding tabs to the new window
    if (leftTabIds.length > 0) {
      const windowProperties = {
        tabId: leftTabIds.pop()
      };

      if (!this.settings["focus"]) windowProperties.state = "minimized";

      const window = await browser.windows.create(windowProperties);
      await browser.tabs.move(leftTabIds, {
        windowId: window.id,
        index: 0
      });
      // confirm success
      return true;
    }
  }
}


export class CloseWindow extends Command {

  async execute(sender, data) {
    await browser.windows.remove(sender.tab.windowId);
    // confirm success
    return true;
  }
}


export class ToRootURL extends Command {

  async execute(sender, data) {
    const url = new URL(sender.tab.url);

    if (url.pathname !== "/" || url.search || url.hash) {
      await browser.tabs.update(sender.tab.id, { "url": url.origin });
      // confirm success
      return true;
    }
  }
}


export class URLLevelUp extends Command {

  async execute(sender, data) {
    const url = new URL(sender.tab.url);
    const newPath = url.pathname.replace(/\/([^/]+)\/?$/, '');

    if (newPath !== url.pathname) {
      await browser.tabs.update(sender.tab.id, { "url": url.origin + newPath });
      // confirm success
      return true;
    }
  }
}


export class IncreaseURLNumber extends Command {
  settings = {
    regex: ''
  };

  async execute(sender, data) {
    const url = decodeURI(sender.tab.url);

    // get user defined regex or use regex that matches the last number occurrence
    // the regex matches number between or at the end of slashes (e.g. /23/)
    // and the values of query parameters (e.g. ?param=23)
    // therefore it should ignore numbers in the domain, port and hash
    // the regex is used on the whole url to give users with custom regex more control
    let matchNumber

    if (this.settings["regex"]) {
      matchNumber = RegExp(this.settings["regex"]);
    }
    else {
      // matches /<NUMBER>(/|?|#|END)
      const matchBetweenSlashes = /(?<=\/)(\d+)(?=[\/?#]|$)/;
      // matches (?|&)parameter=<NUMBER>(?|&|#|END)
      const matchQueryParameterValue = /(?<=[?&]\w+=)(\d+)(?=[?&#]|$)/;
      // combine regex patterns and use negative lookahead to match the last occurrence
      matchNumber = new RegExp(
        "((" + matchBetweenSlashes.source + ")|(" + matchQueryParameterValue.source + "))" +
        "(?!.*((" + matchBetweenSlashes.source + ")|(" + matchQueryParameterValue.source + ")))"
      );
    }

    // check if first match is a valid number and greater or equal to 0
    if (Number(url.match(matchNumber)?.[0]) >= 0) {
      const newURL = url.replace(matchNumber, (match) => {
        const incrementedNumber = Number(match) + 1;
        // keep the same string/number length as the matched number by adding leading zeros
        return incrementedNumber.toString().padStart(match.length, 0);
      });

      await browser.tabs.update(sender.tab.id, { "url": newURL });
      // confirm success
      return true;
    }
  }
}


export class DecreaseURLNumber extends Command {
  settings = {
    regex: ''
  };

  async execute(sender, data) {
    const url = decodeURI(sender.tab.url);

    // get user defined regex or use regex that matches the last number occurrence
    // the regex matches number between or at the end of slashes (e.g. /23/)
    // and the values of query parameters (e.g. ?param=23)
    // therefore it should ignore numbers in the domain, port and hash
    // the regex is used on the whole url to give users with custom regex more control
    let matchNumber

    if (this.settings["regex"]) {
      matchNumber = RegExp(this.settings["regex"]);
    }
    else {
      // matches /<NUMBER>(/|?|#|END)
      const matchBetweenSlashes = /(?<=\/)(\d+)(?=[\/?#]|$)/;
      // matches (?|&)parameter=<NUMBER>(?|&|#|END)
      const matchQueryParameterValue = /(?<=[?&]\w+=)(\d+)(?=[?&#]|$)/;
      // combine regex patterns and use negative lookahead to match the last occurrence
      matchNumber = new RegExp(
        "((" + matchBetweenSlashes.source + ")|(" + matchQueryParameterValue.source + "))" +
        "(?!.*((" + matchBetweenSlashes.source + ")|(" + matchQueryParameterValue.source + ")))"
      );
    }

    // check if first match is a valid number and greater than 0
    if (Number(url.match(matchNumber)?.[0]) > 0) {
      const newURL = url.replace(matchNumber, (match) => {
        const decrementedNumber = Number(match) - 1;
        // keep the same string/number length as the matched number by adding leading zeros
        return decrementedNumber.toString().padStart(match.length, 0);
      });

      await browser.tabs.update(sender.tab.id, { "url": newURL });
      // confirm success
      return true;
    }
  }
}


export class OpenImageInNewTab extends Command {
  settings = {
    position: 'default',
    focus: true
  };

  async execute(sender, data) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      let index;

      switch (this.settings["position"]) {
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
        active: this.settings["focus"],
        index: index,
        openerTabId: sender.tab.id
      });
      // confirm success
      return true;
    }
  }
}


export class OpenLinkInNewTab extends Command {
  settings = {
    position: 'default',
    focus: false,
    emptyTab: false
  };

  async execute(sender, data) {
    let url = null;
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (isHTTPURL(data.selection.text)) url = data.selection.text;
    // if selected text matches the format of a domain name add the missing protocol
    else if (isDomainName(data.selection.text)) url = "http://" + data.selection.text.trim();
    // check if the provided url can be opened by webextensions (is not privileged)
    else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

    if (url || this.settings["emptyTab"]) {
      let index;

      switch (this.settings["position"]) {
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
          // depends on browser.tabs.insertRelatedAfterCurrent and browser.tabs.insertAfterCurrent
          index = null;
        break;
      }

      // open new tab
      await browser.tabs.create({
        url: url,
        active: this.settings["focus"],
        index: index,
        openerTabId: sender.tab.id
      });
      // confirm success
      return true;
    }
  }
}


export class OpenLinkInNewWindow extends Command {
  settings = {
    emptyWindow: false
  };

  async execute(sender, data) {
    let url = null;
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (isHTTPURL(data.selection.text)) url = data.selection.text;
    // if selected text matches the format of a domain name add the missing protocol
    else if (isDomainName(data.selection.text)) url = "http://" + data.selection.text.trim();
    // check if the provided url can be opened by webextensions (is not privileged)
    else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

    if (url || this.settings["emptyWindow"]) {
      await browser.windows.create({
        url: url
      });
      // confirm success
      return true;
    }
  }
}


export class OpenLinkInNewPrivateWindow extends Command {
  settings = {
    emptyWindow: false
  };

  async execute(sender, data) {
    let url = null;
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (isHTTPURL(data.selection.text)) url = data.selection.text;
    // if selected text matches the format of a domain name add the missing protocol
    else if (isDomainName(data.selection.text)) url = "http://" + data.selection.text.trim();
    // check if the provided url can be opened by webextensions (is not privileged)
    else if (data.link && isLegalURL(data.link.href)) url = data.link.href;

    if (url || this.settings["emptyWindow"]) {
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
}


export class LinkToNewBookmark extends Command {
  permissions = ["bookmarks"];

  async execute(sender, data) {
    let url = null, title = null;
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (isHTTPURL(data.selection.text)) url = data.selection.text;
    // if selected text matches the format of a domain name add the missing protocol
    else if (isDomainName(data.selection.text)) url = "http://" + data.selection.text.trim();
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
}


export class SearchTextSelection extends Command {
  permissions = ["search"];
  settings = {
    searchEngineURL: '',
    openEmptySearch: true
  };

  async execute(sender, data) {
    if (data.selection.text.trim() === "" && this.settings["openEmptySearch"] === false) {
      return;
    }

    // either use specified search engine url or default search engine
    let searchEngineURL = this.settings["searchEngineURL"];
    if (searchEngineURL) {
      // if contains placeholder replace it
      if (searchEngineURL.includes("%s")) {
        searchEngineURL = searchEngineURL.replace("%s", encodeURIComponent(data.selection.text));
      }
      // else append to url
      else {
        searchEngineURL = searchEngineURL + encodeURIComponent(data.selection.text);
      }
      await browser.tabs.update(sender.tab.id, {
        url: searchEngineURL
      });
    }
    else {
      await browser.search.search({
        query: data.selection.text,
        tabId: sender.tab.id
      });
    }
    // confirm success
    return true;
  }
}


export class SearchTextSelectionInNewTab extends Command {
  permissions = ["search"];
  settings = {
    position: 'default',
    focus: true,
    searchEngineURL: '',
    openEmptySearch: true
  };

  async execute(sender, data) {
    if (data.selection.text.trim() === "" && this.settings["openEmptySearch"] === false) {
      return;
    }

    // use about:blank to prevent the display of the new tab page
    const tabProperties = {
      active: this.settings["focus"],
      openerTabId: sender.tab.id,
      url: "about:blank"
    };

    // define tab position
    switch (this.settings["position"]) {
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
    const searchEngineURL = this.settings["searchEngineURL"];
    if (searchEngineURL) {
      // if contains placeholder replace it
      if (searchEngineURL.includes("%s")) {
        tabProperties.url = searchEngineURL.replace("%s", encodeURIComponent(data.selection.text));
      }
      // else append to url
      else {
        tabProperties.url = searchEngineURL + encodeURIComponent(data.selection.text);
      }
      await browser.tabs.create(tabProperties);
    }
    else {
      const tab = await browser.tabs.create(tabProperties);
      await browser.search.search({
        query: data.selection.text,
        tabId: tab.id
      });
    }
    // confirm success
    return true;
  }
}


export class SearchClipboard extends Command {
  permissions = ["search","clipboardRead"];
  settings = {
    searchEngineURL: '',
    openEmptySearch: true
  };

  async execute(sender, data) {
    const clipboardText = await navigator.clipboard.readText();

    if (clipboardText.trim() === "" && this.settings["openEmptySearch"] === false) {
      return;
    }

    // either use specified search engine url or default search engine
    let searchEngineURL = this.settings["searchEngineURL"];
    if (searchEngineURL) {
      // if contains placeholder replace it
      if (searchEngineURL.includes("%s")) {
        searchEngineURL = searchEngineURL.replace("%s", encodeURIComponent(clipboardText));
      }
      // else append to url
      else {
        searchEngineURL = searchEngineURL + encodeURIComponent(clipboardText);
      }
      await browser.tabs.update(sender.tab.id, {
        url: searchEngineURL
      });
    }
    else {
      await browser.search.search({
        query: clipboardText,
        tabId: sender.tab.id
      });
    }
    // confirm success
    return true;
  }
}


export class SearchClipboardInNewTab extends Command {
  permissions = ["search","clipboardRead"];
  settings = {
    position: 'default',
    focus: true,
    searchEngineURL: '',
    openEmptySearch: true
  };

  async execute(sender, data) {
    const clipboardText = await navigator.clipboard.readText();

    if (clipboardText.trim() === "" && this.settings["openEmptySearch"] === false) {
      return;
    }

    // use about:blank to prevent the display of the new tab page
    const tabProperties = {
      active: this.settings["focus"],
      openerTabId: sender.tab.id,
      url: "about:blank"
    };

    // define tab position
    switch (this.settings["position"]) {
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
    const searchEngineURL = this.settings["searchEngineURL"];
    if (searchEngineURL) {
      // if contains placeholder replace it
      if (searchEngineURL.includes("%s")) {
        tabProperties.url = searchEngineURL.replace("%s", encodeURIComponent(clipboardText));
      }
      // else append to url
      else {
        tabProperties.url = searchEngineURL + encodeURIComponent(clipboardText);
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
}


export class OpenCustomURLInNewTab extends Command {
  settings = {
    url: '',
    position: 'default',
    focus: true
  };

  async execute(sender, data) {
    let index;

    switch (this.settings["position"]) {
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
        url: this.settings["url"],
        active: this.settings["focus"],
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
}


export class OpenCustomURL extends Command {
  settings = {
    url: ''
  };

  async execute(sender, data) {
    try {
      await browser.tabs.update(sender.tab.id, {
        url: this.settings["url"]
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
}


export class OpenCustomURLInNewWindow extends Command {
  settings = {
    url: ''
  };

  async execute(sender, data) {
    try {
      await browser.windows.create({
        url: this.settings["url"]
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
}


export class OpenCustomURLInNewPrivateWindow extends Command {
  settings = {
    url: ''
  };

  async execute(sender, data) {
    try {
      await browser.windows.create({
        url: this.settings["url"],
        incognito: true
      });
      // confirm success
      return true;
    }
    catch (error) {
      // create error notifications and open corresponding wiki page on click
      if (error.message === 'Extension does not have permission for incognito mode') displayNotification(
        browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelNewPrivateWindow")),
        browser.i18n.getMessage('commandErrorNotificationMessageMissingIncognitoPermissions'),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Missing-incognito-permission"
      );
      else displayNotification(
        browser.i18n.getMessage('commandErrorNotificationTitle', browser.i18n.getMessage("commandLabelOpenCustomURL")),
        browser.i18n.getMessage('commandErrorNotificationMessageIllegalURL'),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL"
      );
    };
  }
}


export class OpenHomepage extends Command {

  async execute(sender, data) {
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
}


export class OpenLink extends Command {

  async execute(sender, data) {
    let url = null;
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (isHTTPURL(data.selection.text)) url = data.selection.text;
    // if selected text matches the format of a domain name add the missing protocol
    else if (isDomainName(data.selection.text)) url = "http://" + data.selection.text.trim();
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
}


export class ViewImage extends Command {

  async execute(sender, data) {
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
}


export class OpenURLFromClipboard extends Command {
  permissions = ["clipboardRead"];

  async execute(sender, data) {
    const clipboardText = await navigator.clipboard.readText();

    let url = null;
    // check if the provided url can be opened by webextensions (is not privileged)
    if (isLegalURL(clipboardText)) url = clipboardText;
    // if clipboard text matches the format of a domain name add the missing protocol
    else if (isDomainName(clipboardText)) url = "http://" + clipboardText.trim();

    if (url) {
      await browser.tabs.update(sender.tab.id, {
        url: url
      });
      // confirm success
      return true;
    }
  }
}


export class OpenURLFromClipboardInNewTab extends Command {
  permissions = ["clipboardRead"];
  settings = {
    position: 'default',
    focus: true
  };

  async execute(sender, data) {
    const clipboardText = await navigator.clipboard.readText();

    let url = null;
    // check if the provided url can be opened by webextensions (is not privileged)
    if (isLegalURL(clipboardText)) url = clipboardText;
    // if clipboard text matches the format of a domain name add the missing protocol
    else if (isDomainName(clipboardText)) url = "http://" + clipboardText.trim();

    if (url) {
      let index;

      switch (this.settings["position"]) {
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
        active: this.settings["focus"],
        index: index
      });
      // confirm success
      return true;
    }
  }
}


export class OpenURLFromClipboardInNewWindow extends Command {
  permissions = ["clipboardRead"];
  settings = {
    emptyWindow: false
  };

  async execute(sender, data) {
    const clipboardText = await navigator.clipboard.readText();

    let url = null;
    // check if the provided url can be opened by webextensions (is not privileged)
    if (isLegalURL(clipboardText)) url = clipboardText;
    // if clipboard text matches the format of a domain name add the missing protocol
    else if (isDomainName(clipboardText)) url = "http://" + clipboardText.trim();

    if (url || this.settings["emptyWindow"]) {
      await browser.windows.create({
        url: url
      });
      // confirm success
      return true;
    }
  }
}


export class OpenURLFromClipboardInNewPrivateWindow extends Command {
  permissions = ["clipboardRead"];
  settings = {
    emptyWindow: false
  };

  async execute(sender, data) {
    const clipboardText = await navigator.clipboard.readText();

    let url = null;
    // check if the provided url can be opened by webextensions (is not privileged)
    if (isLegalURL(clipboardText)) url = clipboardText;
    // if clipboard text matches the format of a domain name add the missing protocol
    else if (isDomainName(clipboardText)) url = "http://" + clipboardText.trim();

    if (url || this.settings["emptyWindow"]) {
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
}


export class PasteClipboard extends Command {
  permissions = ["clipboardRead"];

  async execute(sender, data) {
    await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [ sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: () => document.execCommand("paste")
    });
    // confirm success
    return true;
  }
}


export class InsertCustomText extends Command {
  settings = {
    text: ''
  };

  async execute(sender, data) {
    const [{result: result}] = await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [ sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      args: [
        this.settings['text']
      ],
      func: (insertionText) => {
        const target = document.activeElement;
        if (Number.isInteger(target.selectionStart) && !target.disabled && !target.readOnly) {
          const newSelection = target.selectionStart + insertionText.length;
          target.value =
            target.value.substring(0, target.selectionStart) +
            insertionText +
            target.value.substring(target.selectionEnd);
          target.selectionStart = newSelection;
          target.selectionEnd = newSelection;
          return true;
        }
        else if (target.isContentEditable) {
          const range = window.getSelection().getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(insertionText));
          range.collapse();
          return true;
        }
      }
    });
    // confirm success
    return result;
  }
}


export class SaveTabAsPDF extends Command {

  async execute(sender, data) {
    await browser.tabs.saveAsPDF({});
    // confirm success
    return true;
  }
}


export class PrintTab extends Command {

  async execute(sender, data) {
    await browser.tabs.print();
    // confirm success
    return true;
  }
}


export class OpenPrintPreview extends Command {

  async execute(sender, data) {
    await browser.tabs.printPreview();
    // confirm success
    return true;
  }
}


export class SaveScreenshot extends Command {
  permissions = ["downloads"];

  async execute(sender, data) {
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
}


export class CopyTabURL extends Command {
  permissions = ["clipboardWrite"];

  async execute(sender, data) {
    await navigator.clipboard.writeText(sender.tab.url);
    // confirm success
    return true;
  }
}


export class CopyLinkURL extends Command {
  permissions = ["clipboardWrite"];

  async execute(sender, data) {
    let url = null;
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (isHTTPURL(data.selection.text)) url = data.selection.text;
    else if (data.link && data.link.href) url = data.link.href;

    if (url) {
      await navigator.clipboard.writeText(url);
      // confirm success
      return true;
    }
  }
}


export class CopyImageURL extends Command {
  permissions = ["clipboardWrite"];

  async execute(sender, data) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src) {
      await navigator.clipboard.writeText(data.target.src);
      // confirm success
      return true;
    }
  }
}


export class CopyTextSelection extends Command {
  permissions = ["clipboardWrite"];

  async execute(sender, data) {
    if (data.selection.text) {
      await navigator.clipboard.writeText(data.selection.text);
      // confirm success
      return true;
    }
  }
}


export class CopyImage extends Command {
  permissions = ["clipboardWrite"];

  async execute(sender, data) {
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
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
          const buffer = await blob.arrayBuffer();
          await browser.clipboard.setImageData(buffer, "png");
        } break;
      }
      // confirm success
      return true;
    }
  }
}


export class SaveImage extends Command {
  permissions = ["downloads"];
  settings = {
    promptDialog: true
  };

  async execute(sender, data) {
    if (data.target.nodeName.toLowerCase() === "img" && data.target.src && isURL(data.target.src)) {
      const queryOptions = {
        saveAs: this.settings["promptDialog"],
        // download in incognito window if currently in incognito mode
        incognito: sender.tab.incognito
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
      const [{result: [ documentReferer, documentUrl ]}] = await browser.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [ sender.frameId || 0 ]
        },
        injectImmediately: true,
        func: () => [ document.referrer, window.location.href ]
      });

      // if the image is embedded in a website use the url of that website as the referer
      if (data.target.src !== documentUrl) {
        // emulate no-referrer-when-downgrade
        // The origin, path, and querystring of the URL are sent as a referrer when the protocol security level stays the same (HTTP→HTTP, HTTPS→HTTPS)
        // or improves (HTTP→HTTPS), but isn't sent to less secure destinations (HTTPS→HTTP).
        if (!(new URL(documentUrl).protocol === "https:" && imageURLObject.protocol === "http:")) {
          queryOptions.headers = [ { name: "Referer", value: documentUrl.split("#")[0] } ];
        }
      }
      // if the image is not embedded, but a referrer is set use the referrer
      else if (documentReferer) {
        queryOptions.headers = [ { name: "Referer", value: documentReferer } ];
      }

      let downloadId;
      // if data url then assume a blob file was created and clear its url
      if (imageURLObject.protocol === "data:") {
        // catch error and free the blob for gc
        if (browser.runtime.lastError) URL.revokeObjectURL(queryOptions.url);
        else browser.downloads.onChanged.addListener(function clearURL(downloadDelta) {
          if (
            downloadId === downloadDelta.id &&
            (downloadDelta.state.current === "complete" || downloadDelta.state.current === "interrupted")
          ) {
            URL.revokeObjectURL(queryOptions.url);
            browser.downloads.onChanged.removeListener(clearURL);
          }
        });
      }
      // download image
      downloadId = await browser.downloads.download(queryOptions);

      // confirm success
      return true;
    }
  }
}


export class SaveLink extends Command {
  permissions = ["downloads"];
  settings = {
    promptDialog: true
  };

  async execute(sender, data) {
    let url = null;
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (isHTTPURL(data.selection.text)) url = data.selection.text;
    // if selected text matches the format of a domain name add the missing protocol
    else if (isDomainName(data.selection.text)) url = "http://" + data.selection.text.trim();
    else if (data.link && data.link.href) url = data.link.href;

    if (url) {
      await browser.downloads.download({
        url: url,
        saveAs: this.settings["promptDialog"]
      });
      // confirm success
      return true;
    }
  }
}


export class ViewPageSourceCode extends Command {

  async execute(sender, data) {
    await browser.tabs.create({
      active: true,
      index: sender.tab.index + 1,
      url: "view-source:" + sender.tab.url
    });
    // confirm success
    return true;
  }
}


export class OpenAddonSettings extends Command {

  async execute(sender, data) {
    await browser.runtime.openOptionsPage();
    // confirm success
    return true;
  }
}


export class PopupAllTabs extends Command {
  permissions = ["tabs"];
  settings = {
    order: 'none',
    excludeDiscarded: false
  };

  async execute(sender, data) {
    const queryInfo = {
      windowId: sender.tab.windowId,
      hidden: false
    };

    if (this.settings["excludeDiscarded"]) queryInfo.discarded = false;

    const tabs = await browser.tabs.query(queryInfo);

    // sort tabs if defined
    switch (this.settings["order"]) {
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

    // exit function if user has no visible tabs
    if (tabs.length === 0) return;

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
        mousePositionX: data.mouse.endpoint.x,
        mousePositionY: data.mouse.endpoint.y
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
}


export class PopupRecentlyClosedTabs extends Command {
  permissions = ["tabs", "sessions"];

  async execute(sender, data) {
    let recentlyClosedSessions = await browser.sessions.getRecentlyClosed({});
    // filter windows
    recentlyClosedSessions = recentlyClosedSessions.filter((element) => "tab" in element)

    // exit function if user has no recently closed tabs
    if (recentlyClosedSessions.length === 0) return;

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
        mousePositionX: data.mouse.endpoint.x,
        mousePositionY: data.mouse.endpoint.y
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
}


export class PopupSearchEngines extends Command {
  permissions = ["search"];
  settings = {
    position: 'default'
  };

  async execute(sender, data) {
    // note: this command does not provide an open in background/foreground tab option
    // because both cases can be achieved by interacting with the popup either by left or middle/right clicking

    // use about:blank to prevent the display of the new tab page
    const tabProperties = {
      openerTabId: sender.tab.id,
      url: "about:blank"
    };
    // define tab position
    switch (this.settings["position"]) {
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

    // exit function if user has no search engines
    if (searchEngines.length === 0) return;

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
        mousePositionX: data.mouse.endpoint.x,
        mousePositionY: data.mouse.endpoint.y
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
        query: data.selection.text,
        engine: message.id,
        tabId: tab.id
      });
    });
    // confirm success
    return true;
  }
}


export class PopupCustomCommandList extends Command {
  settings = {
    commands: []
  };

  async execute(sender, data) {
    // get ref to Command class constructor
    const Command = this.constructor;
    // create Command objects
    const commands = this.settings["commands"].map((commandObject) => {
      return new Command(commandObject);
    });
    // map commands to popup data structure
    const dataset = commands.map((command, index) => ({
      id: index,
      label: command.toString(),
      icon: null
    }));

    // request popup creation and wait for response
    const popupCreatedSuccessfully = await browser.tabs.sendMessage(sender.tab.id, {
      subject: "popupRequest",
      data: {
        mousePositionX: data.mouse.endpoint.x,
        mousePositionY: data.mouse.endpoint.y
      },
    }, { frameId: 0 });

    // if popup creation failed exit this command function
    if (!popupCreatedSuccessfully) return;

    const channel = browser.tabs.connect(sender.tab.id, {
      name: "PopupConnection"
    });

    channel.postMessage(dataset);

    channel.onMessage.addListener(async (message) => {
      const command = commands[message.id];
      const returnValue = await command.execute(sender, data);
      // close popup/channel if command succeeded
      if (returnValue === true) {
        channel.disconnect();
      }
    });
    // confirm success
    return true;
  }
}


export class SendMessageToOtherAddon extends Command {
  settings = {
    extensionId: '',
    message: '',
    parseJSON: false
  };

  async execute(sender, data) {
    let message = this.settings["message"];

    if (this.settings["parseJSON"]) {
      // parse message to json object if serializable
      try {
        message = JSON.parse(this.settings["message"]);
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
      await browser.runtime.sendMessage(this.settings["extensionId"], message, {});
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
}


export class ExecuteUserScript extends Command {
  settings = {
    userScript: '',
    targetFrame: 'sourceFrame'
  };

  async execute(sender, data) {
    const messageOptions = {};

    switch (this.settings["targetFrame"]) {
      case "allFrames": break;

      case "topFrame":
        messageOptions.frameId = 0;
      break;

      case "sourceFrame":
      default:
        messageOptions.frameId = sender.frameId ?? 0;
      break;
    }

    // sends a message to the user script controller
    const isSuccessful = await browser.tabs.sendMessage(
      sender.tab.id,
      {
        subject: "executeUserScript",
        data: this.settings["userScript"]
      },
      messageOptions
    );
    // confirm success
    return isSuccessful;
  }
}


export class ClearBrowsingData extends Command {
  permissions = ["browsingData"];
  settings = {
    cache: false,
    cookies: false,
    downloads: false,
    formData: false,
    history: false,
    indexedDB: false,
    localStorage: false,
    passwords: false,
    pluginData: false,
    serviceWorkers: false
  };

  async execute(sender, data) {
    await browser.browsingData.remove({}, {
      "cache": this.settings["cache"],
      "cookies": this.settings["cookies"],
      "downloads": this.settings["downloads"],
      "formData": this.settings["formData"],
      "history": this.settings["history"],
      "indexedDB": this.settings["indexedDB"],
      "localStorage": this.settings["localStorage"],
      "passwords": this.settings["passwords"],
      "pluginData": this.settings["pluginData"],
      "serviceWorkers": this.settings["serviceWorkers"]
    });
    // confirm success
    return true;
  }
}
