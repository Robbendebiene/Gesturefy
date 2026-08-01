import BaseEventListener from "/core/services/base-event-listener.mjs";

/**
 * Service for checking and requesting host permissions.
 **/
export default class HostPermissionService extends BaseEventListener {
  #listener;

  constructor () {
    // set available event specifiers
    super(['change']);
    // register change listeners
    this.#listener = this.#permissionChangeHandler.bind(this);
    browser.permissions.onAdded.addListener(this.#listener);
    browser.permissions.onRemoved.addListener(this.#listener);
  }

  #permissionChangeHandler(permissions) {
    if (permissions?.origins.length > 0) {
      this._dispatchEvent('change', permissions.origins);
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
   * The add-on might be restricted due to
   * - missing host or local file permission
   * - because the tab holds a privileged URL
   **/
  async hasTabPermission(tabOrId) {
    // see: https://discourse.mozilla.org/t/detect-whether-extension-has-host-permission-for-active-tab/120501/2
    const tab = Number.isInteger(tabOrId)
      ? await browser.tabs.get(tabOrId)
      : tabOrId;

    try {
      // url is null if no tabs or host permission is granted
      if (tab.url == null) {
        return false;
      }
      // invalid url errors will be caught
      const url = new URL(tab.url);
      if (url.protocol === 'file:') {
        return browser.extension.isAllowedFileSchemeAccess();
      }
      // await to catch errors for special urls like about:
      return await browser.permissions.contains({
        origins: [url.href]
      });
    }
    catch {
      return false;
    }
  }

  /**
   * Cleanup service resources and dependencies
   **/
  dispose() {
    browser.permissions.onAdded.removeListener(this.#listener);
    browser.permissions.onRemoved.removeListener(this.#listener);
  }
}
