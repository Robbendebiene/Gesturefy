import CommandStack from './command-stack.mjs';

/**
 * This class represents a user defined gesture and provides easy access and manipulation methods
 * It is designed to allow easy conversation from and to JSON
 **/
export default class Gesture {
  #pattern;
  #commands;
  #label;

  constructor (pattern, commands, label = '') {console.log(pattern);
    if (!Array.isArray(pattern)) throw 'The first argument must be an array.';
    if (!(commands instanceof CommandStack)) throw 'The second argument must be an instance of the CommandStack class.';
    if (typeof label !== 'string') throw 'The third argument must be of type string.';

    this.#pattern = pattern;
    this.#commands = commands;
    this.#label = label;
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
    if (this.#label) obj.label = this.#label;
    return obj;
  }

  /**
   * Returns the gesture specific label if set, or the readable name of the first command
   **/
  toString() {
    return this.#label || this.commands.firstCommand.label;
  }

  get label() {
    return this.#label;
  }

  set label(value) {
    if (typeof value !== 'string') throw 'The passed argument must be of type string.';
    this.#label = value;
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
