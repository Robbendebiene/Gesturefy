/**
 * Abstract class that can be used to implement basic event listener functionality.
 **/
export default class BaseEventListener {
  #events;

  /**
   * Requires an array of event specifiers as strings that can later be used to call and register events.
   **/
  constructor (events) {
    // holds all custom event callbacks
    this.#events = new Map(
      events.map((e) => [e, new Set()])
    );
  }

  /**
   * Adds an event listener.
   * Requires an event specifier as a string and a callback method.
   **/
  addEventListener(event, callback) {
    this.#validateEventParameter(event);
    this.#validateCallbackParameter(callback);
    this.#events.get(event).add(callback);
  }

  /**
   * Checks if an event listener exists.
   * Requires an event specifier as a string and a callback method.
   **/
  hasEventListener(event, callback) {
    this.#validateEventParameter(event);
    this.#validateCallbackParameter(callback);
    this.#events.get(event).has(callback);
  }

  /**
   * Removes an event listener.
   * Requires an event specifier as a string and a callback method.
   **/
  removeEventListener(event, callback) {
    this.#validateEventParameter(event);
    this.#validateCallbackParameter(callback);
    this.#events.get(event).delete(callback);
  }

  /**
   * Remove all event listeners for the given event.
   **/
  clearEventListeners(event) {
    this.#validateEventParameter(event);
    this.#events.get(event).clear();
  }

  /**
   * Protected method that should be called by subclasses to dispatch events.
   * Dispatches the event with the given data to all registered listeners.
   */
  _dispatchEvent(event, data) {
    const callbacks = this.#events.get(event);
    callbacks?.forEach(callback => callback(data));
  }

  /**
   * Validate event parameter.
   **/
  #validateEventParameter(event) {
    if (!this.#events.has(event)) {
      throw "The first argument is not a valid event.";
    }
  }

  /**
   * Validate callback parameter.
   **/
  #validateCallbackParameter(callback) {
    if (typeof callback !== "function") {
      throw "The second argument must be a function.";
    }
  }
}
