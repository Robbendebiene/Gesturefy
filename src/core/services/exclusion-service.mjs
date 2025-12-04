import { isURL } from "/core/utils/commons.mjs";

import BaseEventListener from "/core/services/base-event-listener.mjs";

/**
 * Service for adding and removing exclusions.
 *
 * Provides synchronous methods for adding, removing and checking globs/match patterns.
 * This will also automatically update the underlying storage and update itself whenever the underlying storage changes.
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
        this._exclusions = exclusions;
      }
    });
  }

  _storageChangeHandler(changes, areaName) {
    if (areaName === 'local' && changes.hasOwnProperty('Exclusions')) {
      const newValue = changes['Exclusions'].newValue;
      const oldValue = changes['Exclusions'].oldValue;
      const newExclusions = Array.isArray(newValue) ? newValue : [];
      const oldExclusions = Array.isArray(oldValue) ? oldValue : [];
      // check for any changes
      if (newExclusions.length !== oldExclusions.length ||
          newExclusions.some((val, i) => val !== oldExclusions[i])
      ) {
        this._exclusions = newExclusions;
        // execute event callbacks
        this._events.get('change').forEach((callback) => callback(newExclusions));
      }
    }
  }

  /**
   * Promise that resolves when the initial data from the storage is loaded.
   **/
  get loaded () {
    return this._loaded;
  }

  isEnabledFor(url) {
    return !this.isDisabledFor(url);
  }

  isDisabledFor(url) {
    return this._exclusions.some(
      (glob) => this._globToRegex(glob).test(url)
    );
  }

  /**
   * Removes all exclusions that match the given URL
   **/
  enableFor(url) {
    if (!isURL(url)) {
      return;
    }
    const tailoredExclusions = this._exclusions.filter(
      (glob) => !this._globToRegex(glob).test(url)
    );
    if (tailoredExclusions.length < this._exclusions.length) {
      this._exclusions = tailoredExclusions;
      return browser.storage.local.set({'Exclusions': this._exclusions});
    }
  }

  /**
   * Adds an exclusion for the domain of the given URL if there isn't a matching one already.
   **/
  disableFor(url) {
    if (!isURL(url) || this.isDisabledFor(url)) {
      return;
    }
    const urlObj = new URL(url);
    let globPattern;
    if (urlObj.protocol === 'file:') {
      globPattern = urlObj.href;
    }
    else {
      globPattern = `*://${urlObj.hostname}/*`
    }
    this._exclusions.push(globPattern);
    return browser.storage.local.set({'Exclusions': this._exclusions});
  }

  /**
   * Cleanup service resources and dependencies
   **/
  dispose() {
    browser.storage.onChanged.removeListener(this._listener);
  }

  /**
   * Converts a glob/url pattern to a RegExp.
   **/
  _globToRegex(glob) {
    // match special regex characters
    const pattern = glob.replace(
      /[-[\]{}()*+?.,\\^$|#\s]/g,
      // replace * with .* -> matches anything 0 or more times, else escape character
      (match) => match === '*' ? '.*' : '\\'+match,
    );
    // ^ matches beginning of input and $ matches ending of input
    return new RegExp('^'+pattern+'$');
  }
}
