import { isURL } from "/core/utils/commons.mjs";

import BaseEventListener from "/core/services/base-event-listener.mjs";

/**
 * Manager for adding and removing exclusions.
 *
 * Provides synchronous methods for adding, removing and checking globs/match patterns.
 * This will also automatically update the underlying storage and update itself whenever the underlying storage changes.
 **/
export default class ExclusionManager extends BaseEventListener {
  #exclusions;
  #listener;
  #loaded;

  constructor () {
    // set available event specifiers
    super(['change']);
    // empty array as default value so the config doesn't have to be loaded
    this.#exclusions = [];
    // setup on storage change handler
    this.#listener = this.#storageChangeHandler.bind(this);
    browser.storage.onChanged.addListener(this.#listener);
    // load initial storage data
    const promise = browser.storage.local.get('Exclusions');
    // store exclusions when loaded
    this.#loaded = promise.then((value) => {
      const exclusions = value['Exclusions'];
      if (Array.isArray(exclusions) && this.#exclusions.length === 0) {
        this.#exclusions = exclusions;
      }
    });
  }

  #storageChangeHandler(changes, areaName) {
    if (areaName === 'local' && changes.hasOwnProperty('Exclusions')) {
      const newValue = changes['Exclusions'].newValue;
      const oldValue = changes['Exclusions'].oldValue;
      const newExclusions = Array.isArray(newValue) ? newValue : [];
      const oldExclusions = Array.isArray(oldValue) ? oldValue : [];
      // check for any changes
      if (newExclusions.length !== oldExclusions.length ||
          newExclusions.some((val, i) => val !== oldExclusions[i])
      ) {
        this.#exclusions = newExclusions;
        this._dispatchEvent('change', newExclusions);
      }
    }
  }

  /**
   * Promise that resolves when the initial data from the storage is loaded.
   **/
  get loaded () {
    return this.#loaded;
  }

  isEnabledFor(url) {
    return !this.isDisabledFor(url);
  }

  isDisabledFor(url) {
    return this.#exclusions.some(
      (glob) => this.#globToRegex(glob).test(url)
    );
  }

  /**
   * Removes all exclusions that match the given URL
   **/
  enableFor(url) {
    if (!isURL(url)) {
      return;
    }
    const tailoredExclusions = this.#exclusions.filter(
      (glob) => !this.#globToRegex(glob).test(url)
    );
    if (tailoredExclusions.length < this.#exclusions.length) {
      this.#exclusions = tailoredExclusions;
      return browser.storage.local.set({'Exclusions': this.#exclusions});
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
    this.#exclusions.push(globPattern);
    return browser.storage.local.set({'Exclusions': this.#exclusions});
  }

  /**
   * Cleanup service resources and dependencies
   **/
  dispose() {
    browser.storage.onChanged.removeListener(this.#listener);
  }

  /**
   * Converts a glob/url pattern to a RegExp.
   **/
  #globToRegex(glob) {
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
