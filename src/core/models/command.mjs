/**
 * This class represents a user defined command and provides easy access and manipulation methods.
 * It is designed to allow easy conversation from and to JSON.
 * The execute method calls the corresponding function.
 **/
class Command {
  /**
   * Any settings this command exposes.
   * Must be overridden by child classes to provide default values.
   **/
  // Simply overriding "settings" in the child class would override the "settings" assignment done in the base class's constructor.
  // This is because the property initializers of child classes are evaluated after the base class constructor has executed.
  // Therefore the Command class is wrapped in a Proxy.
  settings;

  /**
   * The constructor can optionally be passed a settings object.
   **/
  constructor(settings = {}) {
    this.settings = settings;
  }

  /**
   * Any additional optional permissions the command depends on.
   * Should be overridden by the command implementation if any.
   **/
  get permissions() {
    return Object.freeze([]);
  }

  /**
   * Executes the corresponding command function.
   * The sender and gesture context data objects are passed as the function arguments.
   * This function must return a Promise that fulfills with true if the command succeeded, otherwise the command is treated as unsuccessful.
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
    // writes also default settings to JSON
    // this ensures in case a future version of Gesturefy changes the defaults nothing changes for the user
    if (this.hasSettings) obj.settings = window.structuredClone(this.settings);
    return obj;
  }

  /**
   * Returns a deep copy of this command.
   **/
  clone() {
    return new this.constructor(window.structuredClone(this.settings));
  }
}

// Augment Command class to prevent overriding settings from child classes via class property
// Requires proxy because the parent constructor from the Command class is called before the child constructor
// Other solutions:
// - separate class property "defaults" which is redirected to "settings" via Proxy
// - call settings = Object.assign(newSettings, this.settings) on every command implementation
// - implement the constructor for each command implementation and merge the settings there
// This solution was chosen over other solutions to keep the command implementation as simple as possible
export default new Proxy(Command, {
  construct(target, args, newTarget) {
    return new Proxy(Reflect.construct(...arguments), {
      defineProperty(target, property, descriptor) {
        if (property === 'settings') {
          descriptor.writable = false;
          Object.assign(descriptor.value, target.settings);
          Object.seal(descriptor.value)
        }
        else if (property === 'permissions') {
          descriptor.writable = false;
          Object.freeze(descriptor.value);
        }
        return Reflect.defineProperty(target, property, descriptor);
      }
    });
  },
});
