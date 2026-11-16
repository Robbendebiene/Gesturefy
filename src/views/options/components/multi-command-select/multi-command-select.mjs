import { Build } from "/views/shared/commons.mjs";

import "/views/options/components/orderable-collection/orderable-collection.mjs";
import "/views/options/components/command-picker/command-picker.mjs";
import { CommandCard } from "/views/options/components/command-card/command-card.mjs";
import stylesheet from "./layout.css" with { type: "css" };
import CommandStack from "/core/models/command-stack.mjs";

/**
 * Allows the selection and ordering of multiple commands.
 * It also handles necessary permission checks and the settings of each selected command.
 * The serialized (as JSON) CommandStack can be retrieved via the value property.
 * A "change" event is dispatched when the list is changed by a user interaction.
 **/
export class MultiCommandSelect extends HTMLElement {

  static formAssociated = true;
  #internals;

  #commandStack;
  #groupId = crypto.randomUUID();

  #commandList;

  constructor(commands = new CommandStack()) {
    super();
    this.#commandStack = commands;
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets.push(stylesheet);
    this.shadowRoot.addEventListener('change', this.#handleCommandSettingsChange.bind(this));
  }

  connectedCallback() {
    this.shadowRoot.append(
      this.#commandList = Build('orderable-collection', {
          id: 'commandStackList',
        }, (e) => {
          e.addEventListener('orderend', this.#handleCommandReorder.bind(this));
        },
        ...this.#commandStack.commands.map(command => this.#buildCommandCard(command))
      ),
      Build('command-picker', {
        textContent: browser.i18n.getMessage('commandPickerAddCommandButton')
      }, (ele) => {
        ele.addEventListener('selection', this.#handleCommandSelection.bind(this));
      }),
    );

    this.#updateFormValidity();
  }

  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
  }

  formResetCallback() {
    this.value = [];
  }

  get value() {
    return this.#commandStack.toJSON();
  }

  set value(commandsAsJSON) {
    this.#commandStack = CommandStack.fromJSON(commandsAsJSON);
    if (this.isConnected) {
      this.#commandList.replaceChildren(
        ...this.#commandStack.commands.map(command => this.#buildCommandCard(command))
      );
      this.#updateFormValidity();
    }
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(name) {
    this.setAttribute('name', name);
  }

  #buildCommandCard(command, collapsed = true) {
    return new CommandCard(
      command.clone(), collapsed, this.#groupId, this.#handleCommandRemoval.bind(this),
    );
  }

  #handleCommandSelection(event) {
    const command = event.detail;
    this.#commandStack.addCommand(command);
    // Expand newly added command
    this.#commandList.append(this.#buildCommandCard(command, false));
    this.#updateFormValidity();
    this.#dispatchChangeEvent();
  }

  #handleCommandRemoval(command, commandItem, event) {
    this.#commandList.transitionChildMutations(() => {
      const index = this.#getChildIndex(commandItem);
      this.#commandStack.removeCommand(index);
      commandItem.remove();
    });
    this.#updateFormValidity();
    this.#dispatchChangeEvent();
  }

  #handleCommandReorder(event) {
    this.#commandStack.moveCommand(event.oldIndex, event.newIndex);
    this.#updateFormValidity();
    this.#dispatchChangeEvent();
  }

  #handleCommandSettingsChange(event) {
    const commandCardElement = event.target;
    const index = this.#getChildIndex(commandCardElement);
    this.#commandStack.replaceCommand(index, commandCardElement.command);
    this.#updateFormValidity();
    this.#dispatchChangeEvent();
  }

  #dispatchChangeEvent() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * Updates the command stack form validity.
   */
  #updateFormValidity() {
    if (this.#commandStack.isEmpty) {
      this.#internals.setValidity(
        { valueMissing: true },
        browser.i18n.getMessage('gestureFormValidationMissingCommand'),
      );
    }
    else {
      // Known issue: The command settings inputs are loaded asynchronously,
      // therefore the initial validation check done by the CommandStacker is
      // too early to account for any initial invalid input. This could be solved
      // by e.g. dispatching a change event in the CommandCard when the settings
      // are loaded.
      for (const commandCard of this.#commandList.children) {
        if (!commandCard.validate()) {
          return this.#internals.setValidity(
            { badInput: true },
            browser.i18n.getMessage('gestureFormValidationInvalidCommandSetting', commandCard.command.label),
          );
        }
      }
      this.#internals.setValidity({ });
    }
  }

  /**
   * Helper method to get the index of an HTML element in its parent.
   * This is necessary because the index property is not available on HTML elements.
   */
  #getChildIndex(child) {
    let i = 0;
    while((child = child.previousElementSibling) != null) i++;
    return i;
  }
}


window.customElements.define('multi-command-select', MultiCommandSelect);
