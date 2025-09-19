/**
 * This class represents a user defined command and provides easy access and manipulation methods
 * It is designed to allow easy conversation from and to JSON
 * The execute method calls the corresponding function
 **/
export default class Command {
  /**
   * Any settings this command exposes.
   **/
  settings = {};

  /**
   * The constructor can be passed a command name (string) and optionally a settings object
   * Alternatively only a JSON formatted command object can be passed containing the keys: name, settings
   **/
  constructor(settings = null) {
    Object.assign(this.settings, settings);
    /*
    // prevent any further property modifications after instantiation
    Object.freeze(this);
    // generally disallow changing the required permissions
    Object.freeze(this.permissions);*/
  }

  /**
   * Any additional optional permissions the command depends on.
   * Should be overridden by the command implementation if any.
   **/
  get permissions() {
    return Object.freeze([]);
  }

  /**
   * Executes the corresponding command function
   * The command instance is set as the execution context (this value) so the command can access its methods (and therefore settings)
   * Passes the sender and source data objects as the function arguments
   * This function returns the return value of the command function (all command functions return a promise)
   **/
  async execute(sender, data) {
    throw new TypeError('Must override method.');
  }

  get hasSettings() {
    return Object.keys(this.settings).length > 0;
  }

  /**
   * Whether the command depends on additional permissions (granted or not granted).
   **/
  get dependsOnPermissions() {
    return this.permissions.length > 0;
  }

  /**
   * Whether the command requires new permissions to be granted.
   **/
  async requiresNewPermissions() {
    return browser.permissions.contains({
      permissions: this.permissions
    });
  }

  /**
   * Requests missing command permissions.
   * Returns true when all of them have been granted otherwise false.
   * Must be called from a user action.
   **/
  async requestNewPermissions() {
    return browser.permissions.request({
      permissions: this.permissions,
    });
  }

  /**
   * Returns the command class name
   **/
  get name() {
    return this.constructor.name;
  }

  /**
   * Returns the actual readable name of the command
   **/
  get label() {
    // requires the extending command class name to match the translation key
    return browser.i18n.getMessage(`commandLabel${this.name}`);
  }

  /**
   * Returns a description of the command.
   **/
  get description() {
    // requires the extending command class name to match the translation key
    return browser.i18n.getMessage(`commandDescription${this.name}`);
  }

  /**
   * Converts the class instance to a JavaScript object
   * This function is also automatically called when the JSON.stringify() option is invoked on an instance of this class
   **/
  toJSON() {
    const obj = {
      name: this.constructor.name,
    };
    if (this.hasSettings) obj.settings = window.structuredClone(obj.settings);
    return obj;
  }


  clone() {
    return new this.constructor(this.settings);
  }
}
