import CommandStack from './command-stack.mjs';

/**
 * This class represents a user defined gesture and provides easy access and manipulation methods
 * It is designed to allow easy conversation from and to JSON
 **/
export default class Gesture {
  #pattern;
  #commands;

  constructor (pattern, commands) {
    if (!Array.isArray(pattern)) throw 'The first argument must be an array.';
    if (!(commands instanceof CommandStack)) throw 'The second argument must be an instance of the CommandStack class.';

    this.#pattern = pattern;
    this.#commands = commands;
  }

  /**
   * Constructs a Gesture instance from JSON.
   **/
  static fromJSON(json) {
    return new Gesture(
      json['pattern'],
      CommandStack.fromJSON(json['commands']),
      json['label'] ?? '',
    );
  }

  /**
   * Converts the class instance to a JavaScript object
   * This function is also automatically called when the JSON.stringify() option is invoked on an instance of this class
   **/
  toJSON() {
    const obj = {
      pattern: this.#pattern,
      commands: this.#commands.toJSON()
    };
    return obj;
  }

  /**
   * Returns the readable name of the first command
   **/
  toString() {
    return this.commands.firstCommand.label;
  }

  get pattern() {
    return this.#pattern;
  }

  set pattern(value) {
    if (!Array.isArray(value)) throw 'The passed argument must be an array.';
    this.#pattern = value;
  }

  get commands() {
    return this.#commands;
  }

  set commands(value) {
    if (!(value instanceof CommandStack)) throw 'The passed argument must be an instance of the CommandStack class.';
    this.#commands = value;
  }
}
