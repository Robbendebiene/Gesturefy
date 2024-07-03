import BaseEventListener from "/core/services/base-event-listener.mjs";

/**
 * Service for checking and requesting host permissions.
 **/
export default class HostPermissionService extends BaseEventListener {

  constructor () {
    // set available event specifiers
    super(['change']);
    // register change listeners
    this._listener = this._permissionChangeHandler.bind(this);
    browser.permissions.onAdded.addListener(this._listener);
    browser.permissions.onRemoved.addListener(this._listener);
  }

  _permissionChangeHandler(permissions) {
    if (permissions?.origins.length > 0) {
      this._events.get('change').forEach((callback) => callback(permissions.origins));
    }
  }

  /**
   * Check if add-on was granted global host permissions.
   * Returns a Promise with true/false.
   **/
  hasGlobalPermission() {
    return browser.permissions.contains({
      origins: ['<all_urls>']
    });
  }

  /**
   * Request global host permissions.
   * Returns a Promise with true if the permissions got granted, otherwise false.
   **/
  requestGlobalPermission() {
    return browser.permissions.request({
      origins: ['<all_urls>']
    });
  }

  /**
   * Check whether the add-on is allowed to run in the given tab.
   * If the add-on is restricted this will return false, otherwise true.
   *
   * The add-on might be restricted due to missing host permissions or because the tab holds a privileged URL.
   **/
  async hasTabPermission(tabId) {
    // workaround to find out if the page is restricted
    try {
      await browser.tabs.sendMessage(tabId, true);
      return true;
    }
    catch(e) {
      return false;
    }
  }

  /**
   * Cleanup service resources and dependencies
   **/
  dispose() {
    browser.permissions.onAdded.removeListener(this._listener);
    browser.permissions.onRemoved.removeListener(this._listener);
  }
}
