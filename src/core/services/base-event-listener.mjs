/**
 * Abstract class that can be used to implement basic event listener functionality.
 **/
export default class BaseEventListener {
  /**
   * Requires an array of event specifiers as strings that can later be used to call and register events.
   **/
  constructor (events) {
    // holds all custom event callbacks
    this._events = new Map(
      events.map((e) => [e, new Set()])
    );
  }

  /**
   * Adds an event listener.
   * Requires an event specifier as a string and a callback method.
   **/
  addEventListener (event, callback) {
    this._validateEventParameter(event);
    this._validateCallbackParameter(callback);
    this._events.get(event).add(callback);
  }

  /**
   * Checks if an event listener exists.
   * Requires an event specifier as a string and a callback method.
   **/
  hasEventListener (event, callback) {
    this._validateEventParameter(event);
    this._validateCallbackParameter(callback);
    this._events.get(event).has(callback);
  }

  /**
   * Removes an event listener.
   * Requires an event specifier as a string and a callback method.
   **/
  removeEventListener (event, callback) {
    this._validateEventParameter(event);
    this._validateCallbackParameter(callback);
    this._events.get(event).delete(callback);
  }

  /**
   * Remove all event listeners for the given event.
   **/
  clearEventListeners(event) {
    this._validateEventParameter(event);
    this._events.get(event).clear();
  }

  /**
   * Validate event parameter.
   **/
  _validateEventParameter (event) {
    if (!this._events.has(event)) {
      throw "The first argument is not a valid event.";
    }
  }

  /**
   * Validate callback parameter.
   **/
  _validateCallbackParameter (callback) {
    if (typeof callback !== "function") {
      throw "The second argument must be a function.";
    }
  }
}
