import BaseEventListener from "./base-event-listener.mjs";

import DefaultSettings from "/resources/json/default-settings.json" with { type: 'json' };

/**
 * Main access point for Gesturefy's settings.
 * Settings are stored in the local storage.
 * Settings are loaded on startup (watch .loaded promise) and updated on storage changes.
 * Provides synchronous methods for getting and setting settings.
 * Changes to the gesture storage are dispatched as a "change" event.
 */
export default class SettingsManager extends BaseEventListener {
  #settings = {};
  #listener;
  #loaded;

  constructor () {
    // Set available event specifiers
    super(['change']);

    this.#listener = this.#storageChangeHandler.bind(this);
    browser.storage.onChanged.addListener(this.#listener);

    const promise = browser.storage.local.get('Settings');
    // store config when loaded
    this.#loaded = promise.then((value) => {
      this.#settings = value['Settings'] ?? {};
    });
  }

  #storageChangeHandler(changes, areaName) {
    if (areaName === 'local' && changes.hasOwnProperty('Settings')) {
      const { newValue, oldValue } = changes['Settings'];
      this.#settings = newValue ?? {};
      this._dispatchEvent('change', this);
    }
  }

  /**
   * Expose the "is loaded" Promise
   * This enables the programmer to check if the config has been loaded and run code on load
   * get, set, remove calls should generally called after the config has been loaded otherwise they'll have no effect or return undefined
   **/
  get loaded() {
    return this.#loaded;
  }

  /**
   * Returns the value of the given storage path
   * A Storage path is constructed of one or more nested JSON keys concatenated with dots or an array of nested JSON keys
   * If the storage path is left empty the current storage object is returned
   * If the storage path does not exist, a default value is returned.
   * If no default value exists or the function is called before the config has been loaded it will return undefined
   **/
  get(storagePath = []) {
    if (typeof storagePath === "string") storagePath = storagePath.split('.');
    else if (!Array.isArray(storagePath)) {
      throw "The first argument must be a storage path either in the form of an array or a string concatenated with dots.";
    }

    const pathWalker = (obj, key) => isObject(obj) ? obj[key] : undefined;
    let entry = storagePath.reduce(pathWalker, this.#settings);
    // try to get the default value
    if (entry === undefined) entry = storagePath.reduce(pathWalker, DefaultSettings);
    if (entry !== undefined) return globalThis.structuredClone(entry);

    return undefined;
  }

  /**
   * Returns true if the the given storage path exists else false
   * This also returns true if the storage path can only be found in the default settings
   * If the storage path is left empty the current storage object will be used
   * If is called before the config has been loaded it will return false
   **/
   has(storagePath = []) {
    return typeof this.get(storagePath) !== "undefined";
  }

  /**
   * Sets the value of a given storage path and creates the JSON keys if not available
   * Returns the storage set promise which resolves when the storage has been written successfully
   **/
  set(storagePath, value) {
    if (typeof storagePath === "string") storagePath = storagePath.split('.');
    else if (!Array.isArray(storagePath)) {
      throw "The first argument must be a storage path either in the form of an array or a string concatenated with dots.";
    }

    if (storagePath.length > 0) {
      let entry = this.#settings;
      const lastIndex = storagePath.length - 1;

      for (let i = 0; i < lastIndex; i++) {
        const key = storagePath[i];
        if (!entry.hasOwnProperty(key) || !isObject(entry[key])) {
          entry[key] = {};
        }
        entry = entry[key];
      }
      entry[ storagePath[lastIndex] ] = globalThis.structuredClone(value);
      // save to storage
      return browser.storage.local.set({
        'Settings': this.#settings
      });
    }
  }

  /**
   * Removes the key and value of a given storage path
   * Default values will not be removed, so get() may still return a default value even if removed was called before
   * Returns the storage set promise which resolves when the storage has been written successfully
   **/
  remove(storagePath) {
    if (typeof storagePath === "string") storagePath = storagePath.split('.');
    else if (!Array.isArray(storagePath)) {
      throw "The first argument must be a storage path either in the form of an array or a string concatenated with dots.";
    }

    if (storagePath.length > 0) {
      let entry = this.#settings;
      const lastIndex = storagePath.length - 1;

      for (let i = 0; i < lastIndex; i++) {
        const key = storagePath[i];
        if (entry.hasOwnProperty(key) && isObject(entry[key])) {
          entry = entry[key];
        }
        else return;
      }
      delete entry[ storagePath[lastIndex] ];
      // remove single config item
      if (storagePath.length === 1) {
        return browser.storage.local.remove(storagePath[0]);
      }
      // overwrite entire config
      return browser.storage.local.set({
        'Settings': this.#settings
      });
    }
  }

  dispose() {
    browser.storage.onChanged.removeListener(this.#listener);
  }
}

/**
 * check if variable is an object
 * from https://stackoverflow.com/a/37164538/3771196
 **/
function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}
