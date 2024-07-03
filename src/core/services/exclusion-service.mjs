import BaseEventListener from "/core/services/base-event-listener.mjs";

/**
 * Service for adding and removing exclusions
 **/
export default class ExclusionService extends BaseEventListener {
  constructor () {
    // set available event specifiers
    super(['change']);
    // empty array as default value so the config doesn't have to be loaded
    this._exclusions = [];
    // setup on storage change handler
    this._listener = this._storageChangeHandler.bind(this);
    browser.storage.onChanged.addListener(this._listener);
    // load initial storage data
    this._loaded = browser.storage.local.get('Exclusions');
    // store exclusions when loaded
    this._loaded.then((value) => {
      const exclusions = value['Exclusions'];
      if (Array.isArray(exclusions) && this._exclusions.length === 0) {
        this._exclusions = this._fromStorageJSON(exclusions);
      }
    });
  }

  _storageChangeHandler(changes, areaName) {
    if (areaName === 'local' && changes.hasOwnProperty('Exclusions')) {
      const newExclusions = changes['Exclusions'].newValue;
      const oldExclusions = changes['Exclusions'].oldValue;
      // check for any changes
      if (newExclusions.length !== oldExclusions.length ||
          newExclusions.some((val, i) => val !== oldExclusions[i])
      ) {
        this._exclusions = this._fromStorageJSON(newExclusions);
        // execute event callbacks
        this._events.get('change').forEach((callback) => callback(newExclusions));
      }
    }
  }

  _fromStorageJSON(rawExclusions) {
    return rawExclusions.map((string) => new RegExp(string));
  }

  _toStorageJSON() {
    return this._exclusions.map((pattern) => pattern.source);
  }

  get loaded () {
    return this._loaded;
  }

  isEnabledFor(tab) {
    return !this.isDisabledFor(tab);
  }

  isDisabledFor(tab) {
    return this._exclusions.some(
      (pattern) => pattern.test(tab.url)
    );
  }

  /**
   * Removes the first exclusion that matches the given tab's URL
   **/
  enableFor(tab) {
    // find first pattern that matches the tab url
    const index = this._exclusions.findIndex(
      (pattern) => pattern.test(tab.url)
    );
    if (index > -1) {
      this._exclusions.splice(index, 1);
      return browser.storage.local.set({'Exclusions': this._toStorageJSON(this._exclusions)});
    }
  }

  /**
   * Adds an exclusion for the domain of the given tab if there isn't a matching one already.
   **/
  disableFor(tab) {
    if (this.isDisabledFor(tab)) {
      return;
    }
    const domain = new URL(tab.url).origin;
    // escape special regex characters
    const escapedDomain = domain.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, match => '\\'+match);
    // ^ matches beginning of input and $ matches ending of input
    const pattern = new RegExp('^'+escapedDomain+'.*'+'$');
    this._exclusions.push(pattern);
    return browser.storage.local.set({'Exclusions': this._toStorageJSON(this._exclusions)});
  }

  /**
   * Cleanup service resources and dependencies
   **/
  dispose() {
    browser.storage.onChanged.removeListener(this._listener);
  }
}
