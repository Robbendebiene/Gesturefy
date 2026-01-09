import * as Commands from '/core/models/commands.mjs';

/**
 * This is a series of commands.
 * When executed the commands will be run one by one till the first one succeeds.
 **/

export default class CommandStack {
  #commands;

  constructor (commands = []) {
    if (!Array.isArray(commands)) throw 'The first argument must be an array of commands.';
    this.#commands = commands;
  }

  static fromJSON(json) {
    if (!Array.isArray(json)) throw 'Expects an array of JSON objects.';
    return new CommandStack(
      json.map((item) => {
        // note: a dedicated Command.fromJSON(item); function would easily make sense on the basic Command class,
        // but this would create a cyclic import dependency between 'command.mjs' and 'commands.mjs'
        return new Commands[item.name](item.settings)
      })
    );
  }

  /**
   * Converts the class instance to a JavaScript object
   * This function is also automatically called when the JSON.stringify() option is invoked on an instance of this class
   **/
  toJSON() {
    return this.#commands.map((command) => command.toJSON());
  }

  /**
   * Returns true when this stack does not contain any commands.
   **/
  get isEmpty() {
    return this.#commands.length === 0;
  }

  /**
   * Returns true if this stack contains at least one command.
   **/
  get isNotEmpty() {
    return !this.isEmpty;
  }

  /**
   * Returns all commands as an iterable.
   **/
  get commands() {
    return this.#commands.values();
  }

  get firstCommand() {
    return this.nthCommand(0);
  }

  get lastCommand() {
    return this.nthCommand(this.#commands.length - 1);
  }

  nthCommand(n) {
    return this.#commands[n];
  }

  addCommand(command) {
    this.#commands.push(command);
  }

  replaceCommand(index, command) {
    this.#commands[index] = command;
  }

  removeCommand(index) {
    this.#commands.splice(index, 1);
  }

  moveCommand(fromIndex, toIndex) {
    const command = this.#commands[fromIndex];
    this.#commands.splice(fromIndex, 1);
    this.#commands.splice(toIndex, 0, command);
  }

  clearCommands() {
    this.#commands.length = 0;
  }

  /**
   * Returns a deduplicated Set of permissions required by this command stack.
   */
  get permissions() {
    return new Set(this.commands.flatMap(c => c.permissions));
  }

  /**
   * Executes the command functions one by one till the first command succeeds (returns true).
   * Passes the sender and gesture context data as the function arguments
   **/
  async execute(sender, data) {
    for (const command of this.#commands) {
      const returnValue = await command.execute(sender, data);
      // leave loop if command succeeded
      if (returnValue === true) break;
    }
  }

  /**
   * Returns a deep copy of this command.
   **/
  clone() {
    return new CommandStack(this.#commands.map(c => c.clone()));
  }
}
