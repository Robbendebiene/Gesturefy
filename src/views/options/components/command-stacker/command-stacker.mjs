import CommandStack from "/core/models/command-stack.mjs";
import { Build } from "/views/shared/commons.mjs";

import "/views/options/components/orderable-collection/orderable-collection.mjs";
import "/views/options/components/command-picker/command-picker.mjs";
import { CommandCard } from "/views/options/components/command-card/command-card.mjs";

/**
 * Allows the selection and ordering of multiple commands to build a CommandStack.
 * It also handles necessary permission checks and the settings of each selected command.
 * The CommandStack can be retrieved via the commandStack property.
 * A "change" event is dispatched when the CommandStack is changed by a user interaction.
 **/
export class CommandStacker extends HTMLElement {

  static formAssociated = true;
  #internals;

  #commandStack;

  #commandStackList;
  #commandPicker;

  constructor(commandStack = new CommandStack()) {
    super();
    this.#commandStack = commandStack;
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.addEventListener('change', this.#handleCommandSettingsChange.bind(this));
  }

  connectedCallback() {
    this.shadowRoot.append(
      Build('link', {
        rel: 'stylesheet',
        href: import.meta.resolve('./layout.css'),
      }),
      this.#commandStackList = Build('orderable-collection', {
          id: 'commandStackList',
        }, (e) => {
          e.addEventListener('orderend', this.#handleCommandReorder.bind(this));
        },
        ...this.#commandStack.commands.map((c) => {
          const ele = new CommandCard(
            c.clone(), true, this.#handleCommandRemoval.bind(this),
          );
          ele.draggable = true;
          return ele;
        })
      ),
      this.#commandPicker = Build('command-picker', {}, (ele) => {
        ele.addEventListener('selection', this.#handleCommandSelection.bind(this));
      }),
    );

    this.#updateButtonLabel();
    this.#updateCommandHintTexts();
    this.#updateFormValidity();
  }

  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
  }

  formResetCallback() {
    this.commandStack = new CommandStack();
  }

  get commandStack() {
    return this.#commandStack;
  }

  set commandStack(stack) {
    this.#commandStack = stack;
    this.#commandStackList.replaceChildren(
      ...stack.commands.map((c) => {
        const ele = new CommandCard(
          c.clone(), true, this.#handleCommandRemoval.bind(this),
        );
        ele.draggable = true;
        return ele;
      })
    );
    this.#updateButtonLabel();
    this.#updateCommandHintTexts();
    this.#updateFormValidity();
  }

  #handleCommandSelection(event) {
    const command = event.detail;
    this.#commandStack.addCommand(command);
    const commandCardElement = new CommandCard(command, true, this.#handleCommandRemoval.bind(this));
          commandCardElement.draggable = true;
    this.#commandStackList.append(commandCardElement);
    this.#updateButtonLabel();
    this.#updateCommandHintTexts();
    this.#updateFormValidity();
    this.#dispatchChangeEvent();
  }

  #handleCommandRemoval(command, commandItem, event) {
    this.#commandStackList.transitionChildMutations(() => {
      const index = this.#getChildIndex(commandItem);
      this.#commandStack.removeCommand(index);
      commandItem.remove();
    });
    this.#updateButtonLabel();
    this.#updateCommandHintTexts();
    this.#updateFormValidity();
    this.#dispatchChangeEvent();
  }

  #handleCommandReorder(event) {
    this.#commandStack.moveCommand(event.oldIndex, event.newIndex);
    this.#updateButtonLabel();
    this.#updateCommandHintTexts();
    this.#updateFormValidity();
    this.#dispatchChangeEvent();
  }

  #handleCommandSettingsChange(event) {
    const commandCardElement = event.target;
    const index = this.#getChildIndex(commandCardElement);
    this.#commandStack.replaceCommand(index, commandCardElement.command);
    this.#updateFormValidity();
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
      for (const commandCard of this.#commandStackList.children) {
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
   * The command button text changes based on the number of commands in the stack.
   */
  #updateButtonLabel() {
    this.#commandPicker.textContent = this.#commandStackList.children.length === 0
      ? browser.i18n.getMessage('commandPickerAddMainCommandButton')
      : browser.i18n.getMessage('commandPickerAddAlternativeCommandButton');
  }

  /**
   * Updates each command's hint text based on their order.
   */
  #updateCommandHintTexts() {
    let previousElement = this.#commandStackList.firstElementChild;
    let currentElement;
    if (previousElement) {
      previousElement.title = browser.i18n.getMessage('commandPickerMainCommandDescription');
      while (currentElement = previousElement.nextElementSibling) {
        currentElement.title = browser.i18n.getMessage(
          'commandPickerAlternativeCommandDescription',
          [currentElement.command.label, previousElement.command.label],
        );
        previousElement = currentElement;
      }
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


window.customElements.define('command-stacker', CommandStacker);
