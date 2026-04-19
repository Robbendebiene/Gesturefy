import Command from "/core/models/command.mjs";
import CommandStack from "/core/models/command-stack.mjs";
import {
  mix,
  NewTabCommand,
  GetURLCommand,
  MatchURLNumberCommand,
  ScrollCommand,
  PopupCommand
} from "/core/models/command-mixins.mjs";
import {
  isURL,
  sanitizeFilename,
  dataURItoBlob,
  displayNotification
} from "/core/utils/commons.mjs";

/*
 * Commands
 * Every command fulfils its promise when its internal processes finishes.
 * The promise will be rejected on error.
 * The execution can fail for insufficient conditions like a missing url or image.
 */

export class DuplicateTab extends mix(Command).with(NewTabCommand) {

  settings = {
    position: "default",
    focus: true
  };

  async execute(context) {
    await browser.tabs.duplicate(context.sender.tab.id, {
      active: this.settings.focus,
      index: this.getNewTabIndex(context.sender),
    });
  }
}


export class NewTab extends mix(Command).with(NewTabCommand) {

  settings = {
    position: "default",
    focus: true
  };

  async execute(context) {
    await browser.tabs.create({
      active: this.settings.focus,
      index: this.getNewTabIndex(context.sender),
    });
  }
}


export class CloseTab extends Command {
  settings = {
    nextFocus: "default",
    closePinned: true
  };

  canExecute(context) {
    // remove tab if not pinned or remove-pinned-tabs option is enabled
    return this.settings.closePinned || !context.sender.tab.pinned;
  }

  async execute(context) {
    const tabs = await browser.tabs.query({
      windowId: context.sender.tab.windowId,
      active: false,
      hidden: false
    });

    // if there are other tabs to focus
    if (tabs.length > 0) {
      let nextTab = null;

      switch (this.settings.nextFocus) {
        case "next":
          // get closest tab to the right (if not found it will return the closest tab to the left)
          nextTab = tabs.reduce((acc, cur) =>
            (acc.index <= context.sender.tab.index && cur.index > acc.index) || (cur.index > context.sender.tab.index && cur.index < acc.index) ? cur : acc
          );
        break;

        case "previous":
          // get closest tab to the left (if not found it will return the closest tab to the right)
          nextTab = tabs.reduce((acc, cur) =>
            (acc.index >= context.sender.tab.index && cur.index < acc.index) || (cur.index < context.sender.tab.index && cur.index > acc.index) ? cur : acc
          );
        break;

        case "recent":
          // get the previous tab
          nextTab = tabs.reduce((acc, cur) => acc.lastAccessed > cur.lastAccessed ? acc : cur);
        break;
      }

      if (nextTab) await browser.tabs.update(nextTab.id, { active: true });
    }
    await browser.tabs.remove(context.sender.tab.id);
  }
}


export class CloseRightTabs extends Command {

  async canExecute(context) {
    const tabs = await this.#tabsQuery(context.sender.tab.windowId);
    return tabs.some(tab => tab.index > context.sender.tab.index);
  }

  async execute(context) {
    let tabs = await this.#tabsQuery(context.sender.tab.windowId);
    // filter all tabs to the right
    tabs = tabs.filter((tab) => tab.index > context.sender.tab.index);

    if (tabs.length > 0) {
      // create array of tap ids
      const tabIds = tabs.map((tab) => tab.id);
      await browser.tabs.remove(tabIds);
    }
  }

  #tabsQuery(windowId) {
    return browser.tabs.query({
      windowId: windowId,
      pinned: false,
      hidden: false
    });
  }
}


export class CloseLeftTabs extends Command {

  async canExecute(context) {
    const tabs = await this.#tabsQuery(context.sender.tab.windowId);
    return tabs.some(tab => tab.index < context.sender.tab.index);
  }

  async execute(context) {
    let tabs = await this.#tabsQuery(context.sender.tab.windowId);
    // filter all tabs to the left
    tabs = tabs.filter((tab) => tab.index < context.sender.tab.index);

    if (tabs.length > 0) {
      // create array of tap ids
      const tabIds = tabs.map((tab) => tab.id);
      await browser.tabs.remove(tabIds);
    }
  }

  #tabsQuery(windowId) {
    return browser.tabs.query({
      windowId: windowId,
      pinned: false,
      hidden: false
    });
  }
}


export class CloseOtherTabs extends Command {

  async canExecute(context) {
    const tabs = await this.#tabsQuery(context.sender.tab.windowId);
    return tabs.length > 0;
  }

  async execute(context) {
    const tabs = await this.#tabsQuery(context.sender.tab.windowId);

    if (tabs.length > 0) {
      // create array of tap ids
      const tabIds = tabs.map((tab) => tab.id);
      await browser.tabs.remove(tabIds);
    }
  }

  #tabsQuery(windowId) {
    return browser.tabs.query({
      windowId: windowId,
      pinned: false,
      active: false,
      hidden: false
    });
  }
}


export class RestoreTab extends Command {
  permissions = ["sessions"];
  settings = {
    currentWindowOnly: false
  };

  async canExecute(context) {
    const sessions = await browser.sessions.getRecentlyClosed();
    if (this.settings.currentWindowOnly) {
      return sessions.some(session => session.tab?.windowId === context.sender.tab.windowId);
    }
    return sessions.length > 0;
  }

  async execute(context) {
    let recentlyClosedSessions = await browser.sessions.getRecentlyClosed();
    // exclude windows and tabs from different windows
    if (this.settings.currentWindowOnly) {
      recentlyClosedSessions = recentlyClosedSessions.filter((session) => {
        return session.tab?.windowId === context.sender.tab.windowId;
      });
    }
    if (recentlyClosedSessions.length > 0) {
      const mostRecently = recentlyClosedSessions.reduce((prev, cur) => prev.lastModified > cur.lastModified ? prev : cur);
      const sessionId = mostRecently.tab ? mostRecently.tab.sessionId : mostRecently.window.sessionId;
      await browser.sessions.restore(sessionId);
    }
  }
}


export class ReloadTab extends Command {
  settings = {
    cache: false
  };

  async execute(context) {
    await browser.tabs.reload(context.sender.tab.id, { bypassCache: this.settings.cache });
  }
}


export class StopLoading extends Command {

  async canExecute(context) {
    // returns the ready state in a result object of each frame as an array
    const readyStateResults = await browser.scripting.executeScript({
      target: {
        tabId: context.sender.tab.id,
        allFrames: true
      },
      injectImmediately: true,
      func: () =>  document.readyState,
    });
    // if at least one frame is not finished loading yet
    return readyStateResults.some(result => result.result !== "complete");
  }

  async execute(context) {
    await browser.scripting.executeScript({
      target: {
        tabId: context.sender.tab.id,
        allFrames: true
      },
      injectImmediately: true,
      func: () => window.stop(),
    });
  }
}


export class ReloadFrame extends Command {
  settings = {
    cache: false
  };

  canExecute(context) {
    return context.sender.frameId !== undefined;
  }

  async execute(context) {
    await browser.scripting.executeScript({
      target: {
        tabId: context.sender.tab.id,
        frameIds: [ context.sender.frameId ]
      },
      injectImmediately: true,
      func: (bypassCache) => window.location.reload(bypassCache),
      args: [ Boolean(this.settings.cache) ]
    });
  }
}


export class ReloadAllTabs extends Command {
  settings = {
    cache: false
  };

  async execute(context) {
    const tabs = await browser.tabs.query({
      windowId: context.sender.tab.windowId,
      hidden: false
    });

    await Promise.all(tabs.map((tab) => {
      return browser.tabs.reload(tab.id, { bypassCache: this.settings.cache });
    }));
  }
}


export class ZoomIn extends Command {
  settings = {
    step: ""
  };

  async canExecute(context) {
    const currentZoom = await browser.tabs.getZoom(context.sender.tab.id);
    const newZoom = this.#nextZoom(currentZoom);
    return newZoom > currentZoom;
  }

  async execute(context) {
    const currentZoom = await browser.tabs.getZoom(context.sender.tab.id);
    const newZoom = this.#nextZoom(currentZoom);
    if (newZoom > currentZoom) {
      await browser.tabs.setZoom(context.sender.tab.id, newZoom);
    }
  }

  #nextZoom(currentZoom) {
    const zoomSetting = this.settings.step;
    // try to get single number
    const zoomStep = Number(zoomSetting);
    // array of default zoom levels
    let zoomLevels = [.3, .5, .67, .8, .9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];
    // maximal zoom level
    let maxZoom = 3;

    if (zoomStep) {
      return Math.min(maxZoom, currentZoom + zoomStep/100);
    }
    // if no zoom step value exists and string contains comma, assume a list of zoom levels
    else if (zoomSetting.includes(",")) {
      // get and override default zoom levels
      zoomLevels = zoomSetting.split(",").map(z => parseFloat(z)/100);
      // get and override max zoom boundary but cap it to 300%
      maxZoom = Math.min(Math.max(...zoomLevels), maxZoom);
    }
    return zoomLevels.reduce((acc, cur) => cur > currentZoom && cur < acc ? cur : acc, maxZoom);
  }
}


export class ZoomOut extends Command {
  settings = {
    step: ""
  };

  async canExecute(context) {
    const currentZoom = await browser.tabs.getZoom(context.sender.tab.id);
    const newZoom = this.#nextZoom(currentZoom);
    return newZoom < currentZoom;
  }

  async execute(context) {
    const currentZoom = await browser.tabs.getZoom(context.sender.tab.id);
    const newZoom = this.#nextZoom(currentZoom);
    if (newZoom < currentZoom) {
      await browser.tabs.setZoom(context.sender.tab.id, newZoom);
    }
  }

  #nextZoom(currentZoom) {
    const zoomSetting = this.settings.step;
    // try to get single number
    const zoomStep = Number(zoomSetting);
    // array of default zoom levels
    let zoomLevels = [3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, .9, .8, .67, .5, .3];
    // minimal zoom level
    let minZoom = .3;

    if (zoomStep) {
      return Math.max(minZoom, currentZoom - zoomStep/100);
    }
    // if no zoom step value exists and string contains comma, assume a list of zoom levels
    else if (zoomSetting.includes(",")) {
      // get and override default zoom levels
      zoomLevels = zoomSetting.split(",").map(z => parseFloat(z)/100);
      // get min zoom boundary but cap it to 30%
      minZoom = Math.max(Math.min(...zoomLevels), minZoom);
    }
    return zoomLevels.reduce((acc, cur) => cur < currentZoom && cur > acc ? cur : acc, minZoom);
  }
}


export class ZoomReset extends Command {

  async canExecute(context) {
    const [currentZoom, zoomSettings] = await this.#getZoomData();
    return currentZoom !== zoomSettings.defaultZoomFactor;
  }

  async execute(context) {
    const [currentZoom, zoomSettings] = await this.#getZoomData();
    if (currentZoom !== zoomSettings.defaultZoomFactor) {
      await browser.tabs.setZoom(context.sender.tab.id, zoomSettings.defaultZoomFactor);
    }
  }

  #getZoomData() {
    return Promise.all([
      browser.tabs.getZoom(context.sender.tab.id),
      browser.tabs.getZoomSettings(context.sender.tab.id)
    ]);
  }
}


export class PageBack extends Command {

  async execute(context) {
    await browser.tabs.goBack(context.sender.tab.id);
  }
}


export class PageForth extends Command {

  async execute(context) {
    await browser.tabs.goForward(context.sender.tab.id);
  }
}


export class PinTab extends Command {

  canExecute(context) {
    return !context.sender.tab.pinned;
  }

  async execute(context) {
    await browser.tabs.update(context.sender.tab.id, { pinned: true });
  }
}


export class UnpinTab extends Command {

  canExecute(context) {
    return context.sender.tab.pinned;
  }

  async execute(context) {
    await browser.tabs.update(context.sender.tab.id, { pinned: false });
  }
}


export class MuteTab extends Command {

  canExecute(context) {
    return !context.sender.tab.mutedInfo.muted;
  }

  async execute(context) {
    await browser.tabs.update(context.sender.tab.id, { muted: true });
  }
}


export class UnmuteTab extends Command {

  canExecute(context) {
    return context.sender.tab.mutedInfo.muted;
  }

  async execute(context) {
    await browser.tabs.update(context.sender.tab.id, { muted: false });
  }
}


export class AddPageBookmark extends Command {
  permissions = ["bookmarks"];

  async canExecute(context) {
    const bookmarks = await browser.bookmarks.search({
      url: context.sender.tab.url
    });
    return bookmarks.length === 0;
  }

  async execute(context) {
    if (this.canExecute(context)) {
      await browser.bookmarks.create({
        url: context.sender.tab.url,
        title: context.sender.tab.title
      });
    }
  }
}


export class RemovePageBookmark extends Command {
  permissions = ["bookmarks"];

  async canExecute(context) {
    const bookmarks = await browser.bookmarks.search({
      url: context.sender.tab.url
    });
    return bookmarks.length > 0;
  }

  async execute(context) {
    const bookmarks = await browser.bookmarks.search({
      url: context.sender.tab.url
    });
    if (bookmarks.length > 0) {
      // remove all bookmarks as this is probably what the user wants here
      await Promise.all(
        bookmarks.map(bookmark => browser.bookmarks.remove(bookmark.id))
      );
    }
  }
}


export class EnterReaderMode extends Command {

  canExecute(context) {
    return context.sender.tab.isArticle;
  }

  async execute(context) {
    // technically this reverts the action if already in reader mode,
    // however extensions are not allowed to run in reader mode
    await browser.tabs.toggleReaderMode(context.sender.tab.id);
  }
}


export class ScrollTop extends mix(Command).with(ScrollCommand) {
  settings = {
    duration: 100
  };

  async canExecute(context) {
    return await this.tryScrollInTab(context.sender, -Infinity, this.settings.duration, true);
  }

  async execute(context) {
    await this.tryScrollInTab(context.sender, -Infinity, this.settings.duration);
  }
}


export class ScrollBottom extends mix(Command).with(ScrollCommand) {
  settings = {
    duration: 100
  };

  async canExecute(context) {
    return await this.tryScrollInTab(context.sender, Infinity, this.settings.duration, true);
  }

  async execute(context) {
    await this.tryScrollInTab(context.sender, Infinity, this.settings.duration);
  }
}


export class ScrollPageUp extends mix(Command).with(ScrollCommand) {
  settings = {
    duration: 100,
    scrollProportion: 95
  };

  async canExecute(context) {
    const scrollRatio = Number(this.settings.scrollProportion) / 100;
    return await this.tryScrollInTab(context.sender, -scrollRatio, this.settings.duration, true);
  }

  async execute(context) {
    const scrollRatio = Number(this.settings.scrollProportion) / 100;
    await this.tryScrollInTab(context.sender, -scrollRatio, this.settings.duration);
  }
}


export class ScrollPageDown extends mix(Command).with(ScrollCommand) {
  settings = {
    duration: 100,
    scrollProportion: 95
  };

  async canExecute(context) {
    const scrollRatio = Number(this.settings.scrollProportion) / 100;
    return await this.tryScrollInTab(context.sender, scrollRatio, this.settings.duration, true);
  }

  async execute(context) {
    const scrollRatio = Number(this.settings.scrollProportion) / 100;
    await this.tryScrollInTab(context.sender, scrollRatio, this.settings.duration);
  }
}


export class FocusRightTab extends Command {
  settings = {
    excludeDiscarded: false
  };

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // if there is at least one tab to the right of the current
    return tabs.some(cur => cur.index > context.sender.tab.index);
  }

  async execute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // get closest tab to the right
    const nextTab = tabs.reduce(
      (acc, cur) => cur.index > context.sender.tab.index && (acc === null || cur.index < acc.index) ? cur : acc,
      null
    );
    // focus next tab if available
    if (nextTab) {
      await browser.tabs.update(nextTab.id, { active: true });
    }
  }

  async #queryTabs(windowId) {
    const queryInfo = {
      windowId: windowId,
      active: false,
      hidden: false
    }
    if (this.settings.excludeDiscarded) queryInfo.discarded = false;
    return await browser.tabs.query(queryInfo);
  }
}


export class FocusLeftTab extends Command {
  settings = {
    excludeDiscarded: false
  };

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // if there is at least one tab to the left of the current
    return tabs.some(cur => cur.index < context.sender.tab.index);
  }

  async execute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // get closest tab to the left
    const nextTab = tabs.reduce(
      (acc, cur) => cur.index < context.sender.tab.index && (acc === null || cur.index > acc.index) ? cur : acc,
      null
    );
    // focus next tab if available
    if (nextTab) {
      await browser.tabs.update(nextTab.id, { active: true });
    }
  }

  async #queryTabs(windowId) {
    const queryInfo = {
      windowId: windowId,
      active: false,
      hidden: false
    }
    if (this.settings.excludeDiscarded) queryInfo.discarded = false;
    return await browser.tabs.query(queryInfo);
  }
}


export class FocusFirstTab extends Command {
  settings = {
    includePinned: false
  };

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // if there is at least one tab to the left of the current
    return tabs.some(cur => cur.index < context.sender.tab.index);
  }

  async execute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    const firstTab = tabs.reduce((acc, cur) => acc.index < cur.index ? acc : cur);
    await browser.tabs.update(firstTab.id, { active: true });
  }

  async #queryTabs(windowId) {
    const queryInfo = {
      windowId: windowId,
      active: false,
      hidden: false
    };
    if (!this.settings.includePinned) queryInfo.pinned = false;
    return await browser.tabs.query(queryInfo);
  }
}


export class FocusLastTab extends Command {

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // if there is at least one tab to the right of the current
    return tabs.some(cur => cur.index > context.sender.tab.index);
  }

  async execute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    const lastTab = tabs.reduce((acc, cur) => acc.index > cur.index ? acc : cur);
    await browser.tabs.update(lastTab.id, { active: true });
  }

  async #queryTabs(windowId) {
    return await browser.tabs.query({
      windowId: windowId,
      active: false,
      hidden: false
    });
  }
}


export class FocusPreviousSelectedTab extends Command {

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    return tabs.length > 0;
  }

  async execute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    if (tabs.length > 0) {
      const lastAccessedTab = tabs.reduce((acc, cur) => acc.lastAccessed > cur.lastAccessed ? acc : cur);
      await browser.tabs.update(lastAccessedTab.id, { active: true });
    }
  }

  async #queryTabs(windowId) {
    return await browser.tabs.query({
      windowId: windowId,
      active: false,
      hidden: false
    });
  }
}


export class MaximizeWindow extends Command {

  async canExecute(context) {
    const window = await browser.windows.get(context.sender.tab.windowId);
    return window.state !== 'maximized';
  }

  async execute(context) {
    await browser.windows.update(context.sender.tab.windowId, {
      state: 'maximized'
    });
  }
}


export class MinimizeWindow extends Command {

  async canExecute(context) {
    // check should never return false - just included for completeness
    const window = await browser.windows.get(context.sender.tab.windowId);
    return window.state !== 'minimized';
  }

  async execute(context) {
    await browser.windows.update(context.sender.tab.windowId, {
      state: 'minimized'
    });
  }
}


export class RestoreWindowSize extends Command {

  async canExecute(context) {
    const window = await browser.windows.get(context.sender.tab.windowId);
    return window.state !== 'normal';
  }

  async execute(context) {
    await browser.windows.update(context.sender.tab.windowId, {
      state: 'normal'
    });
  }
}


export class EnterFullscreen extends Command {

  async canExecute(context) {
    const window = await browser.windows.get(context.sender.tab.windowId);
    return window.state !== 'fullscreen';
  }

  async execute(context) {
    await browser.windows.update(context.sender.tab.windowId, {
      state: 'fullscreen'
    });
  }
}


export class NewWindow extends Command {

  async execute(context) {
    await browser.windows.create({});
  }
}


export class NewPrivateWindow extends Command {

  async execute(context) {
    try {
      await browser.windows.create({
        incognito: true
      });
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

  async canExecute(context) {
    const mostLeftTab = await this.#queryMostLeftTab(context.sender.tab.windowId, context.sender.tab.pinned);
    return mostLeftTab.index !== context.sender.tab.index;
  }

  async execute(context) {
    // query pinned tabs if current tab is pinned or vice versa
    const mostLeftTab = this.#queryMostLeftTab(context.sender.tab.windowId, context.sender.tab.pinned);
    // if tab is not already at the start
    if (mostLeftTab.index !== context.sender.tab.index) {
      await browser.tabs.move(context.sender.tab.id, {
        index: mostLeftTab.index
      });
    }
  }

  async #queryMostLeftTab(windowId, pinned) {
    const tabs = await browser.tabs.query({
      windowId: windowId,
      pinned: pinned,
      hidden: false
    });
    return tabs.reduce((acc, cur) => cur.index < acc.index ? cur : acc);
  }
}


export class MoveTabToEnd extends Command {

  async canExecute(context) {
    const mostRightTab = await this.#queryMostRightTab(context.sender.tab.windowId, context.sender.tab.pinned);
    return mostRightTab.index !== context.sender.tab.index;
  }

  async execute(context) {
    // query pinned tabs if current tab is pinned or vice versa
    const mostRightTab = this.#queryMostRightTab(context.sender.tab.windowId, context.sender.tab.pinned);
    // if tab is not already at the end
    if (mostRightTab.index !== context.sender.tab.index) {
      await browser.tabs.move(context.sender.tab.id, {
        index: mostRightTab.index + 1
      });
    }
  }

  async #queryMostRightTab(windowId, pinned) {
    const tabs = await browser.tabs.query({
      windowId: windowId,
      pinned: pinned,
      hidden: false
    });
    return tabs.reduce((acc, cur) => cur.index > acc.index ? cur : acc);
  }
}


export class MoveTabRight extends Command {
  settings = {
    shift: 1,
  };

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId, context.sender.tab.pinned);
    // if there is at least one tab after the current
    return tabs.some(cur => cur.index > context.sender.tab.index);
  }

  async execute(context) {
    // query pinned tabs if current tab is pinned or vice versa
    const tabs = this.#queryTabs(context.sender.tab.windowId, context.sender.tab.pinned);
    tabs.sort((a, b) => a.index - b.index);

    const currentTabQueryIndex = tabs.findIndex((tab) => tab.index === context.sender.tab.index);
    // defines the shift (offset and direction) of the tab
    // fallback to 1 on 0 or empty setting
    const shift = Number(this.settings.shift) || 1;
    const nextTabQueryIndex = nextTabQueryIndex = Math.min(
      currentTabQueryIndex + shift,
      tabs.length - 1,
    );
    if (nextTabQueryIndex !== currentTabQueryIndex) {
      await browser.tabs.move(context.sender.tab.id, {
        index: tabs[nextTabQueryIndex].index,
      });
    }
  }

  async #queryTabs(windowId, pinned) {
    return await browser.tabs.query({
      windowId: windowId,
      pinned: pinned,
      hidden: false
    });
  }
}


export class MoveTabLeft extends Command {
  settings = {
    shift: 1,
  };

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId, context.sender.tab.pinned);
    // if there is at least one tab before the current
    return tabs.some(cur => cur.index < context.sender.tab.index);
  }

  async execute(context) {
    // query pinned tabs if current tab is pinned or vice versa
    const tabs = this.#queryTabs(context.sender.tab.windowId, context.sender.tab.pinned);
    tabs.sort((a, b) => a.index - b.index);

    const currentTabQueryIndex = tabs.findIndex((tab) => tab.index === context.sender.tab.index);
    // defines the shift (offset and direction) of the tab
    // fallback to 1 on 0 or empty setting
    const shift = -(Number(this.settings.shift) || 1);
    const nextTabQueryIndex = Math.min(
      currentTabQueryIndex + shift,
      tabs.length - 1
    );
    if (nextTabQueryIndex !== currentTabQueryIndex) {
      await browser.tabs.move(context.sender.tab.id, {
        index: tabs[nextTabQueryIndex].index,
      });
    }
  }

  async #queryTabs(windowId, pinned) {
    return await browser.tabs.query({
      windowId: windowId,
      pinned: pinned,
      hidden: false
    });
  }
}


export class MoveTabToNewWindow extends Command {

  async execute(context) {
    await browser.windows.create({
      tabId: context.sender.tab.id
    });
  }
}


export class MoveRightTabsToNewWindow extends Command {
  settings = {
    focus: true,
    includeCurrent: false
  };

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // if there is at least one tab after the current (or the current is included)
    return tabs.some(cur => cur.index >= context.sender.tab.index);
  }

  async execute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    const rightTabIds = tabs
          .filter((ele) => ele.index >= context.sender.tab.index)
          .map((ele) => ele.id);
    // create new window with the first tab and move corresponding tabs to the new window
    if (rightTabIds.length > 0) {
      const windowProperties = {
        tabId: rightTabIds.shift()
      };
      if (!this.settings.focus) windowProperties.state = "minimized";

      const window = await browser.windows.create(windowProperties);
      await browser.tabs.move(rightTabIds, {
        windowId: window.id,
        index: 1
      });
    }
  }

  async #queryTabs(windowId) {
    const queryProperties = {
      windowId: context.sender.tab.windowId,
      pinned: false,
      hidden: false
    };
    // exclude current tab if specified
    if (!this.settings.includeCurrent) queryProperties.active = false;
    // query only unpinned tabs
    return await browser.tabs.query(queryProperties);
  }
}


export class MoveLeftTabsToNewWindow extends Command {
  settings = {
    focus: true,
    includeCurrent: false
  };

  async canExecute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    // if there is at least one tab before the current (or the current is included)
    return tabs.some(cur => cur.index <= context.sender.tab.index);
  }

  async execute(context) {
    const tabs = await this.#queryTabs(context.sender.tab.windowId);
    const leftTabIds = tabs
          .filter((ele) => ele.index <= context.sender.tab.index)
          .map((ele) => ele.id);
    // create new window with the last tab and move corresponding tabs to the new window
    if (leftTabIds.length > 0) {
      const windowProperties = {
        tabId: leftTabIds.pop()
      };
      if (!this.settings.focus) windowProperties.state = "minimized";

      const window = await browser.windows.create(windowProperties);
      await browser.tabs.move(leftTabIds, {
        windowId: window.id,
        index: 0
      });
    }
  }

  async #queryTabs(windowId) {
    const queryProperties = {
      windowId: context.sender.tab.windowId,
      pinned: false,
      hidden: false
    };
    // exclude current tab if specified
    if (!this.settings.includeCurrent) queryProperties.active = false;
    // query only unpinned tabs
    return await browser.tabs.query(queryProperties);
  }
}


export class CloseWindow extends Command {

  async execute(context) {
    await browser.windows.remove(context.sender.tab.windowId);
  }
}


export class ToRootURL extends Command {

  canExecute(context) {
    const url = new URL(context.sender.tab.url);
    return url.pathname !== "/" || url.search || url.hash;
  }

  async execute(context) {
    const url = new URL(context.sender.tab.url);
    await browser.tabs.update(context.sender.tab.id, { "url": url.origin });
  }
}


export class URLLevelUp extends Command {

  canExecute(context) {
    const url = new URL(context.sender.tab.url);
    return /\/([^/]+)\/?$/.test(url.pathname);
  }

  async execute(context) {
    const url = new URL(context.sender.tab.url);
    const newPath = url.pathname.replace(/\/([^/]+)\/?$/, '');

    if (newPath !== url.pathname) {
      await browser.tabs.update(context.sender.tab.id, { "url": url.origin + newPath });
    }
  }
}


export class IncreaseURLNumber extends mix(Command).with(MatchURLNumberCommand) {
  settings = {
    regex: ''
  };

  canExecute(context) {
    const matchNumber = this.getNumberPattern();
    const url = decodeURI(context.sender.tab.url);
    return Number(url.match(matchNumber)?.[0]) >= 0;
  }

  async execute(context) {
    const matchNumber = this.getNumberPattern();
    const url = decodeURI(context.sender.tab.url);
    // check if first match is a valid number and greater or equal to 0
    if (Number(url.match(matchNumber)?.[0]) >= 0) {
      const newURL = url.replace(matchNumber, (match) => {
        const incrementedNumber = Number(match) + 1;
        // keep the same string/number length as the matched number by adding leading zeros
        return incrementedNumber.toString().padStart(match.length, 0);
      });
      await browser.tabs.update(context.sender.tab.id, { "url": newURL });
    }
  }
}


export class DecreaseURLNumber extends mix(Command).with(MatchURLNumberCommand) {
  settings = {
    regex: ''
  };

  canExecute(context) {
    const matchNumber = this.getNumberPattern();
    const url = decodeURI(context.sender.tab.url);
    return Number(url.match(matchNumber)?.[0]) > 0;
  }

  async execute(context) {
    const matchNumber = this.getNumberPattern();
    const url = decodeURI(context.sender.tab.url);
    // check if first match is a valid number and greater than 0
    if (Number(url.match(matchNumber)?.[0]) > 0) {
      const newURL = url.replace(matchNumber, (match) => {
        const decrementedNumber = Number(match) - 1;
        // keep the same string/number length as the matched number by adding leading zeros
        return decrementedNumber.toString().padStart(match.length, 0);
      });
      await browser.tabs.update(context.sender.tab.id, { "url": newURL });
    }
  }
}


export class OpenImageInNewTab extends mix(Command).with(NewTabCommand, GetURLCommand) {

  settings = {
    position: "default",
    focus: true
  };

  canExecute(context) {
    return context.target.isImageSrc() && this.isLegalURL(context.target.src);
  }

  async execute(context) {
    if (this.canExecute(context)) {
      await browser.tabs.create({
        url: context.target.src,
        active: this.settings.focus,
        index: this.getNewTabIndex(context.sender),
        openerTabId: context.sender.tab.id
      });
    }
  }
}


export class OpenLinkInNewTab extends mix(Command).with(NewTabCommand, GetURLCommand) {

  settings = {
    position: "default",
    focus: true
  };

  canExecute(context) {
    return this.getURLFromContext(context) != null;
  }

  async execute(context) {
    const url = this.getURLFromContext(context);
    if (url) {
      await browser.tabs.create({
        url: url,
        active: this.settings.focus,
        index: this.getNewTabIndex(context.sender),
        openerTabId: context.sender.tab.id
      });
    }
  }
}


export class OpenLinkInNewWindow extends mix(Command).with(GetURLCommand) {

  canExecute(context) {
    return this.getURLFromContext(context) != null;
  }

  async execute(context) {
    const url = this.getURLFromContext(context);
    if (url) {
      await browser.windows.create({
        url: url
      });
    }
  }
}


export class OpenLinkInNewPrivateWindow extends mix(Command).with(GetURLCommand) {

  canExecute(context) {
    return this.getURLFromContext(context) != null;
  }

  async execute(context) {
    const url = this.getURLFromContext(context);
    if (url) {
      try {
        await browser.windows.create({
          url: url,
          incognito: true
        });
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


export class LinkToNewBookmark extends mix(Command).with(GetURLCommand) {
  permissions = ["bookmarks"];

  canExecute(context) {
    return this.getURLFromContext(data, {allowPrivileged: true}) != null;
  }

  async execute(context) {
    const url = this.getURLFromContext(data, {allowPrivileged: true});
    let title = null;
    // if url (most likely) was extracted from the link's href use the link's title
    if (context.link?.href === url) {
      title = context.link.title ?? context.link.textContent ?? context.target.title ?? null;
    }

    if (url) {
      await browser.bookmarks.create({
        url: url,
        title: title ?? new URL(url).hostname
      });
    }
  }
}


export class SearchTextSelection extends Command {
  permissions = ["search"];
  settings = {
    searchEngineURL: '',
  };

  canExecute(context) {
    return context.selection.text.trim() !== "";
  }

  async execute(context) {
    if (!this.canExecute(context)) return;
    // either use specified search engine url or default search engine
    let searchEngineURL = this.settings.searchEngineURL;
    if (searchEngineURL) {
      // if contains placeholder replace it
      if (searchEngineURL.includes("%s")) {
        searchEngineURL = searchEngineURL.replace("%s", encodeURIComponent(context.selection.text));
      }
      // else append to url
      else {
        searchEngineURL = searchEngineURL + encodeURIComponent(context.selection.text);
      }
      await browser.tabs.update(context.sender.tab.id, {
        url: searchEngineURL
      });
    }
    else {
      await browser.search.search({
        query: context.selection.text,
        tabId: context.sender.tab.id
      });
    }
  }
}


export class SearchTextSelectionInNewTab extends mix(Command).with(NewTabCommand) {
  permissions = ["search"];
  settings = {
    position: "default",
    focus: true,
    searchEngineURL: '',
  };

  canExecute(context) {
    return context.selection.text.trim() !== "";
  }

  async execute(context) {
    if (!this.canExecute(context)) return;
    // use about:blank to prevent the display of the new tab page
    const tabProperties = {
      active: this.settings.focus,
      openerTabId: context.sender.tab.id,
      url: "about:blank",
      index: this.getNewTabIndex(context.sender),
    };

    // either use specified search engine url or default search engine
    const searchEngineURL = this.settings.searchEngineURL;
    if (searchEngineURL) {
      // if contains placeholder replace it
      if (searchEngineURL.includes("%s")) {
        tabProperties.url = searchEngineURL.replace("%s", encodeURIComponent(context.selection.text));
      }
      // else append to url
      else {
        tabProperties.url = searchEngineURL + encodeURIComponent(context.selection.text);
      }
      await browser.tabs.create(tabProperties);
    }
    else {
      const tab = await browser.tabs.create(tabProperties);
      await browser.search.search({
        query: context.selection.text,
        tabId: tab.id
      });
    }
  }
}


export class SearchClipboard extends Command {
  permissions = ["search","clipboardRead"];
  settings = {
    searchEngineURL: '',
  };

  async canExecute(context) {
    const clipboardText = await navigator.clipboard.readText();
    return clipboardText.trim() !== "";
  }

  async execute(context) {
    const clipboardText = await navigator.clipboard.readText();
    if (clipboardText.trim() === "") return;
    // either use specified search engine url or default search engine
    let searchEngineURL = this.settings.searchEngineURL;
    if (searchEngineURL) {
      // if contains placeholder replace it
      if (searchEngineURL.includes("%s")) {
        searchEngineURL = searchEngineURL.replace("%s", encodeURIComponent(clipboardText));
      }
      // else append to url
      else {
        searchEngineURL = searchEngineURL + encodeURIComponent(clipboardText);
      }
      await browser.tabs.update(context.sender.tab.id, {
        url: searchEngineURL
      });
    }
    else {
      await browser.search.search({
        query: clipboardText,
        tabId: context.sender.tab.id
      });
    }
  }
}


export class SearchClipboardInNewTab extends mix(Command).with(NewTabCommand) {
  permissions = ["search","clipboardRead"];
  settings = {
    position: "default",
    focus: true,
    searchEngineURL: '',
  };

  async canExecute(context) {
    const clipboardText = await navigator.clipboard.readText();
    return clipboardText.trim() !== "";
  }

  async execute(context) {
    const clipboardText = await navigator.clipboard.readText();
    if (clipboardText.trim() === "") return;
    // use about:blank to prevent the display of the new tab page
    const tabProperties = {
      active: this.settings.focus,
      openerTabId: context.sender.tab.id,
      url: "about:blank",
      index: this.getNewTabIndex(context.sender),
    };
    // either use specified search engine url or default search engine
    const searchEngineURL = this.settings.searchEngineURL;
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
  }
}


export class OpenCustomURLInNewTab extends mix(Command).with(NewTabCommand) {
  settings = {
    position: "default",
    focus: true,
    url: '',
  };

  async execute(context) {
    try {
      await browser.tabs.create({
        url: this.settings.url,
        active: this.settings.focus,
        index: this.getNewTabIndex(context.sender),
      });
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

  async execute(context) {
    try {
      await browser.tabs.update(context.sender.tab.id, {
        url: this.settings.url
      });
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

  async execute(context) {
    try {
      await browser.windows.create({
        url: this.settings.url
      });
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

  async execute(context) {
    try {
      await browser.windows.create({
        url: this.settings.url,
        incognito: true
      });
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

  async execute(context) {
    let homepageURL = (await browser.browserSettings.homepageOverride.get({})).value;
    // try adding protocol on invalid url
    if (!isURL(homepageURL)) homepageURL = 'http://' + homepageURL;

    try {
      if (context.sender.tab.pinned) {
        await browser.tabs.create({
          url: homepageURL,
          active: true,
        });
      }
      else {
        await browser.tabs.update(context.sender.tab.id, {
          url: homepageURL
        });
      }
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


export class OpenLink extends mix(Command).with(GetURLCommand) {

  canExecute(context) {
    return this.getURLFromContext(context) != null;
  }

  async execute(context) {
    const url = this.getURLFromContext(context);
    if (url) {
      if (context.sender.tab.pinned) {
        const tabs = await browser.tabs.query({
          windowId: context.sender.tab.windowId,
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
          openerTabId: context.sender.tab.id
        });
      }
      else await browser.tabs.update(context.sender.tab.id, {
        url: url
      });
    }
  }
}


export class ViewImage extends mix(Command).with(GetURLCommand) {

  canExecute(context) {
    return context.target.isImageSrc() && this.isLegalURL(context.target.src);
  }

  async execute(context) {
    if (this.canExecute(context)) {
      if (context.sender.tab.pinned) {
        const tabs = await browser.tabs.query({
          windowId: context.sender.tab.windowId,
          pinned: false,
          hidden: false
        });

        // get the lowest index excluding pinned tabs
        let mostLeftTabIndex = 0;
        if (tabs.length > 0) mostLeftTabIndex = tabs.reduce((min, cur) => min.index < cur.index ? min : cur).index;

        await browser.tabs.create({
          url: context.target.src,
          active: true,
          index: mostLeftTabIndex,
          openerTabId: context.sender.tab.id
        });
      }
      else await browser.tabs.update(context.sender.tab.id, {
        url: context.target.src
      });
    }
  }
}


export class OpenURLFromClipboard extends mix(Command).with(GetURLCommand) {
  permissions = ["clipboardRead"];

  async canExecute(context) {
    return await this.getURLFromClipboard() != null;
  }

  async execute(context) {
    const url = await this.getURLFromClipboard();
    if (url) {
      await browser.tabs.update(context.sender.tab.id, {
        url: url
      });
    }
  }
}


export class OpenURLFromClipboardInNewTab extends mix(Command).with(NewTabCommand, GetURLCommand) {
  permissions = ["clipboardRead"];
  settings = {
    position: "default",
    focus: true
  };

  async canExecute(context) {
    return await this.getURLFromClipboard() != null;
  }

  async execute(context) {
    const url = await this.getURLFromClipboard();
    if (url) {
      await browser.tabs.create({
        url: url,
        active: this.settings.focus,
        index: this.getNewTabIndex(context.sender),
      });
    }
  }
}


export class OpenURLFromClipboardInNewWindow extends mix(Command).with(GetURLCommand) {
  permissions = ["clipboardRead"];

  async canExecute(context) {
    return await this.getURLFromClipboard() != null;
  }

  async execute(context) {
    const url = await this.getURLFromClipboard();
    if (url) {
      await browser.windows.create({
        url: url
      });
    }
  }
}


export class OpenURLFromClipboardInNewPrivateWindow extends mix(Command).with(GetURLCommand) {
  permissions = ["clipboardRead"];

  async canExecute(context) {
    return await this.getURLFromClipboard() != null;
  }

  async execute(context) {
    const url = await this.getURLFromClipboard();
    if (url) {
      try {
        await browser.windows.create({
          url: url,
          incognito: true
        });
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

  async canExecute(context) {
    return (await navigator.clipboard.read()).length > 0;
  }

  async execute(context) {
    await browser.scripting.executeScript({
      target: {
        tabId: context.sender.tab.id,
        frameIds: [ context.sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: () => document.execCommand("paste")
    });
  }
}


export class InsertCustomText extends Command {
  settings = {
    text: ''
  };

  async canExecute(context) {
    const [{result: result}] = await browser.scripting.executeScript({
      target: {
        tabId: context.sender.tab.id,
        frameIds: [ context.sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: () => {
        const target = document.activeElement;
        return (Number.isInteger(target.selectionStart) && !target.disabled && !target.readOnly) ||
                target.isContentEditable;
      }
    });
    return result;
  }

  async execute(context) {
    await browser.scripting.executeScript({
      target: {
        tabId: context.sender.tab.id,
        frameIds: [ context.sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      args: [
        this.settings.text
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
        }
        else if (target.isContentEditable) {
          const range = window.getSelection().getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(insertionText));
          range.collapse();
        }
      }
    });
  }
}


export class SaveTabAsPDF extends Command {

  async execute(context) {
    await browser.tabs.saveAsPDF({});
  }
}


export class PrintTab extends Command {

  async execute(context) {
    await browser.tabs.print();
  }
}


export class OpenPrintPreview extends Command {

  async execute(context) {
    await browser.tabs.printPreview();
  }
}


export class SaveScreenshot extends Command {
  permissions = ["downloads"];

  async execute(context) {
    let screenshotURL = await browser.tabs.captureVisibleTab();
    // convert data uri to blob
    screenshotURL = URL.createObjectURL(dataURItoBlob(screenshotURL));

    const downloadId = await browser.downloads.download({
      url: screenshotURL,
      // remove special file name characters
      filename: sanitizeFilename(context.sender.tab.title) + '.png',
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
  }
}


export class CopyTabURL extends Command {
  permissions = ["clipboardWrite"];

  async execute(context) {
    await navigator.clipboard.writeText(context.sender.tab.url);
  }
}


export class CopyLinkURL extends mix(Command).with(GetURLCommand) {
  permissions = ["clipboardWrite"];

  canExecute(context) {
    return this.getURLFromContext(data, {allowPrivileged: true}) != null;
  }

  async execute(context) {
    const url = this.getURLFromContext(data, {allowPrivileged: true});
    if (url) {
      await navigator.clipboard.writeText(url);
    }
  }
}


export class CopyImageURL extends Command {
  permissions = ["clipboardWrite"];

  canExecute(context) {
    return context.target.isImageSrc();
  }

  async execute(context) {
    if (this.canExecute(context)) {
      await navigator.clipboard.writeText(context.target.src);
    }
  }
}


export class CopyTextSelection extends Command {
  permissions = ["clipboardWrite"];

  canExecute(context) {
    return context.selection.text.length > 0;
  }

  async execute(context) {
    if (this.canExecute(context)) {
      await navigator.clipboard.writeText(context.selection.text);
    }
  }
}


export class CopyImage extends Command {
  permissions = ["clipboardWrite"];

  canExecute(context) {
    return context.target.isImageSrc();
  }

  async execute(context) {
    if (this.canExecute(context)) {
      const response = await fetch(context.target.src);
      let blob = await response.blob();
      // convert unsupported file types to png using the OffscreenCanvas api
      if (!ClipboardItem.supports(blob.type)) {
        const imageBitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('bitmaprenderer');
        // closes the original image bitmap - imgBitmap.close()
        ctx.transferFromImageBitmap(imageBitmap);
        // read image from canvas as png and write it to clipboard
        blob = await canvas.convertToBlob({ type: 'image/png' });
      }
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
    }
  }
}


export class SaveImage extends Command {
  permissions = ["downloads"];
  settings = {
    promptDialog: true
  };

  canExecute(context) {
    return context.target.isImageSrc();
  }

  async execute(context) {
    if (this.canExecute(context)) {
      const queryOptions = {
        saveAs: this.settings.promptDialog,
        // download in incognito window if currently in incognito mode
        incognito: context.sender.tab.incognito
      };

      const imageURLObject = new URL(context.target.src);
      // if data url create blob
      if (imageURLObject.protocol === "data:") {
        queryOptions.url = URL.createObjectURL(dataURItoBlob(context.target.src));
        // get file extension from mime type
        const fileExtension =  context.target.src.split("data:image/").pop().split(";")[0];
        // construct file name
        queryOptions.filename = context.target.alt || context.target.title || "image";
        // remove special characters and add file extension
        queryOptions.filename = sanitizeFilename(queryOptions.filename) + "." + fileExtension;
      }
      // otherwise use normal url
      else queryOptions.url = context.target.src;

      // add referer header, because some websites modify the image if the referer is missing
      // get referrer from content script
      const [{result: [ documentReferer, documentUrl ]}] = await browser.scripting.executeScript({
        target: {
          tabId: context.sender.tab.id,
          frameIds: [ context.sender.frameId || 0 ]
        },
        injectImmediately: true,
        func: () => [ document.referrer, window.location.href ]
      });

      // if the image is embedded in a website use the url of that website as the referer
      if (context.target.src !== documentUrl) {
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
    }
  }
}


export class SaveLink extends mix(Command).with(GetURLCommand) {
  permissions = ["downloads"];
  settings = {
    promptDialog: true
  };

  canExecute(context) {
    return this.getURLFromContext(data, {allowPrivileged: true}) != null;
  }

  async execute(context) {
    const url = this.getURLFromContext(data, {allowPrivileged: true});
    if (url) {
      await browser.downloads.download({
        url: url,
        saveAs: this.settings.promptDialog
      });
    }
  }
}


export class ViewPageSourceCode extends Command {

  async execute(context) {
    await browser.tabs.create({
      active: true,
      index: context.sender.tab.index + 1,
      url: "view-source:" + context.sender.tab.url
    });
  }
}


export class OpenAddonSettings extends Command {

  async execute(context) {
    await browser.runtime.openOptionsPage();
  }
}


export class PopupAllTabs extends Command {
  permissions = ["tabs"];
  settings = {
    order: 'none',
    excludeDiscarded: false
  };

  canExecute(context) {
    const tabs = this.#queryTabs(context.sender.tab.windowId);
    return tabs.length > 0;
  }

  async execute(context) {
    const tabs = this.#queryTabs(context.sender.tab.windowId);
    // exit function if user has no visible tabs
    if (tabs.length === 0) return;

    // sort tabs if defined
    switch (this.settings.order) {
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
    const popupCreatedSuccessfully = await browser.tabs.sendMessage(context.sender.tab.id, {
      subject: "popupRequest",
      data: {
        mousePositionX: context.mouse.endpoint.x,
        mousePositionY: context.mouse.endpoint.y
      },
    }, { frameId: 0 });

    // if popup creation failed exit this command function
    if (!popupCreatedSuccessfully) return;

    const channel = browser.tabs.connect(context.sender.tab.id, {
      name: "PopupConnection"
    });

    channel.postMessage(dataset);

    channel.onMessage.addListener((message) => {
      browser.tabs.update(Number(message.id), {active: true});
      // immediately disconnect the channel since keeping the popup open doesn't make sense
      channel.disconnect();
    });
  }

  async #queryTabs(windowId) {
    const queryInfo = {
      windowId: windowId,
      hidden: false
    };
    if (this.settings.excludeDiscarded) queryInfo.discarded = false;
    return await browser.tabs.query(queryInfo);
  }
}


export class PopupRecentlyClosedTabs extends mix(Command).with(PopupCommand) {
  permissions = ["tabs", "sessions"];

  async canExecute(context) {
    const recentlyClosedTabs = await this.#getRecentlyClosedTabs();
    return recentlyClosedTabs.length > 0;
  }

  async execute(context) {
    const recentlyClosedTabs = await this.#getRecentlyClosedTabs();
    // exit function if user has no recently closed tabs
    if (recentlyClosedTabs.length === 0) return;
    // map sessions to popup data structure
    const dataset = recentlyClosedTabs.map((element) => ({
      id: element.tab.sessionId,
      label: element.tab.title,
      icon: element.tab.favIconUrl || null
    }));

    this.openPopup({
      context,
      content: dataset,
      responseHandler: async (message, close) => {
        browser.sessions.restore(message.id);
        // immediately disconnect the channel since keeping the popup open doesn't make sense
        // restored tab is always focused, probably because it is restored at its original tab index
        close();
      },
    });
  }

  async #getRecentlyClosedTabs() {
    const recentlyClosedSessions = await browser.sessions.getRecentlyClosed({});
    // filter windows
    return recentlyClosedSessions.filter((element) => "tab" in element)
  }
}


export class PopupSearchEngines extends mix(Command).with(NewTabCommand, PopupCommand) {
  permissions = ["search"];
  settings = {
    position: "default",
  };

  async canExecute(context) {
    const searchEngines = await browser.search.get();
    return searchEngines.length > 0;
  }

  async execute(context) {
    // note: this command does not provide an open in background/foreground tab option
    // because both cases can be achieved by interacting with the popup either by left or middle/right clicking

    const searchEngines = await browser.search.get();
    // exit function if user has no search engines
    if (searchEngines.length === 0) return;

    // use about:blank to prevent the display of the new tab page
    const tabProperties = {
      openerTabId: context.sender.tab.id,
      url: "about:blank",
      index: this.getNewTabIndex(context.sender),
    };

    // map search engines to popup data structure
    const dataset = searchEngines.map((searchEngine) => ({
      id: searchEngine.name,
      label: searchEngine.name,
      icon: searchEngine.favIconUrl || null
    }));

    this.openPopup({
      context,
      content: dataset,
      responseHandler: async (message, close) => {
        // check if primary button was pressed
        if (message.button === 0) {
          // focus new tab
          tabProperties.active = true;
          // disconnect channel / close popup
          close();
        }
        else {
          // always open in background if a non-primary button was clicked and keep popup open
          tabProperties.active = false;
        }

        const tab = await browser.tabs.create(tabProperties);
        browser.search.search({
          query: context.selection.text,
          engine: message.id,
          tabId: tab.id
        });
      }
    });
  }
}


export class PopupCustomCommandList extends mix(Command).with(PopupCommand) {
  settings = {
    // Holds a CommandStack as JSON
    // This so the clone method of the Command class can use structuredClone algorithm, which wouldn't work with CommandStack
    commands: [],
  };

  async canExecute(context) {
    const stack = CommandStack.fromJSON(this.settings.commands);
    return await stack.getFirstExecutableCommand(context) !== undefined;
  }

  async execute(context) {
    const stack = CommandStack.fromJSON(this.settings.commands);
    // get all executable commands
    const commands = await Array.fromAsync(stack.getExecutableCommands(context));
    // map commands to popup data structure
    const dataset = commands.map((command, index) => ({
      id: index,
      label: command.toString(),
      icon: null
    }));

    this.openPopup({
      context,
      content: dataset,
      responseHandler: async (message, close) => {
        const command = commands[message.id];
        await command.execute(context);
        close();
      }
    });
  }
}


export class SendMessageToOtherAddon extends Command {
  settings = {
    extensionId: '',
    message: '',
    parseJSON: false
  };

  async execute(context) {
    let message = this.settings.message;

    if (this.settings.parseJSON) {
      // parse message to json object if serializable
      try {
        message = JSON.parse(this.settings.message);
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
      await browser.runtime.sendMessage(this.settings.extensionId, message, {});
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

  async execute(context) {
    const messageOptions = {};

    switch (this.settings.targetFrame) {
      case "allFrames": break;

      case "topFrame":
        messageOptions.frameId = 0;
      break;

      case "sourceFrame":
      default:
        messageOptions.frameId = context.sender.frameId ?? 0;
      break;
    }

    // sends a message to the user script controller
    await browser.tabs.sendMessage(
      context.sender.tab.id,
      {
        subject: "executeUserScript",
        data: this.settings.userScript
      },
      messageOptions
    );
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

  async execute(context) {
    await browser.browsingData.remove({}, {
      "cache": this.settings.cache,
      "cookies": this.settings.cookies,
      "downloads": this.settings.downloads,
      "formData": this.settings.formData,
      "history": this.settings.history,
      "indexedDB": this.settings.indexedDB,
      "localStorage": this.settings.localStorage,
      "passwords": this.settings.passwords,
      "pluginData": this.settings.pluginData,
      "serviceWorkers": this.settings.serviceWorkers
    });
  }
}


// TODO:
// - test popup commands
// - finish ui for multi popup command

// COmmit message:
// - implement separate canExecute function for commands
// - move sender to gesture context data
// - share command code via special command mixins