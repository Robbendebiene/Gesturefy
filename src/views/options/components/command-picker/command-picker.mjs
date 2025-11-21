import GroupedCommands from "/views/options/components/command-picker/command-groups.mjs";
import CommandStack from "/core/models/command-stack.mjs";
import { Build } from "/views/shared/commons.mjs";

import "/views/options/components/orderable-collection/orderable-collection.mjs";
import CommandCard from "/views/options/components/command-card/command-card.mjs";

/**
 * Allows the selection and ordering of multiple commands to build a CommandStack.
 * It also handles necessary permission checks and the settings of each selected command.
 * The CommandStack can be retrieved via the commandStack property.
 * A "change" event is dispatched when the CommandStack is changed by a user interaction.
 **/
class CommandPicker extends HTMLElement {
  #commandStackList;
  #commandSelectButton;

  #dropdown;
  #dropdownList;
  #filterInput

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    window.addEventListener('resize', this.#handleWindowSizeChange.bind(this));
  }


  connectedCallback() {
    this.#dropdown = Build('div', {
        id: 'dropdown',
        popover: 'auto',
        onbeforetoggle: this.#handlePopoverBeforeToggle.bind(this),
        ontoggle: this.#handlePopoverToggle.bind(this),
      },
      Build('div', {
          id: 'filterWrapper',
        },
        this.#filterInput = Build('input', {
          id: 'filterInput',
          placeholder: browser.i18n.getMessage('commandPickerFilterPlaceholder'),
          oninput: this.#handleFilterInput.bind(this),
        }),
        Build('button', {
          id: 'filterClearButton',
          onclick: this.#handleClearButton.bind(this),
        }),
      ),
      this.#dropdownList = Build('div', {
          classList: 'dropdown-list',
        },
        ...GroupedCommands.map(commandGroup => Build('ul', {
            classList: 'dropdown-group',
          },
          ...commandGroup.map(command => this.#createCommandDropdownItem(command))
        )),
      ),
      Build('div', {
        id: 'commandStackPlaceholder',
        textContent: browser.i18n.getMessage('commandPickerNoResultsPlaceholder'),
      }),
    );

    this.shadowRoot.append(
      Build('link', {
        rel: 'stylesheet',
        href: import.meta.resolve('./layout.css'),
      }),
      this.#commandStackList = Build('orderable-collection', {
          id: 'commandStackList',
        }, (e) => {
          e.addEventListener('orderend', this.#handleCommandStackChange.bind(this));
        }
      ),
      this.#commandSelectButton = Build('button', {
        id: 'commandStackSelectButton',
        popoverTargetElement: this.#dropdown,
        popoverTargetAction: 'toggle'
      }),
      this.#dropdown,
    );

    this.#handleCommandStackChange(false);
  }

  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
  }

  get commandStack() {
    return new CommandStack(
      Array.prototype.map.call(
        this.#commandStackList.children,
        (e) => e.command
      )
    );
  }

  set commandStack(stack) {
    this.#commandStackList.replaceChildren(
      ...stack.commands.map((c) => {
        const ele = new CommandCard(
          c.clone(), true, this.#handleCommandRemoval.bind(this),
        );
        ele.draggable = true;
        return ele;
      })
    );
    this.#handleCommandStackChange(false);
  }

  /**
   * Handles the command selection procedure.
   * Asks the user for extra permissions if required.
   **/
  async #handleCommandSelection(command, event) {
    if (command.dependsOnPermissions) {
      // exit if permissions aren't granted
      if (!await command.requestNewPermissions()) return;
    }

    this.#dropdown.hidePopover();

    const commandElement = new CommandCard(
      command.clone(), false, this.#handleCommandRemoval.bind(this),
    );
    commandElement.draggable = true;
    this.#commandStackList.append(commandElement);
    this.#handleCommandStackChange();
  }

  #handleCommandRemoval(command, commandItem, event) {
    this.#commandStackList.transitionChildMutations(() => {
      commandItem.remove();
    });
    this.#handleCommandStackChange();
  }

  #handleCommandStackChange(dispatchEvent = true) {
    this.#updateButtonLabel();
    this.#updateCommandHintTexts();
    if (dispatchEvent) this.dispatchEvent(new CustomEvent('change'));
  }

  #handlePopoverBeforeToggle(event) {
    if (event.newState === 'open') {
      this.clearFilter();
    }
  }

  #handlePopoverToggle(event) {
    if (event.newState === 'open') {
      this.#filterInput.focus();
      this.#dropdownList.scrollTop = 0;
      this.#handleWindowSizeChange();
    }
  }

  /**
   * Adjusts the dropdown height and position based on the current window size.
   */
  #handleWindowSizeChange() {
    const bbox = this.#commandSelectButton.getBoundingClientRect();
    this.#dropdown.style.setProperty('--bboxY', bbox.y);
    // get the absolute maximum available height from the current position either from the top or bottom
    this.#dropdown.classList.toggle('shift', bbox.y > window.innerHeight / 2);
  }

  /**
   * Handles search inputs and filters the list
   **/
  #handleFilterInput() {
    this.#filter(this.#filterInput.value);
  }

  /**
   * Handles filter clear button click.
   **/
  #handleClearButton() {
    this.clearFilter();
    this.#filterInput.focus();
  }

  /**
   * The command button text changes based on the number of commands in the stack.
   */
  #updateButtonLabel() {
    this.#commandSelectButton.textContent = this.#commandStackList.children.length === 0
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
   * Creates a command dropdown element for the given command.
   */
  #createCommandDropdownItem(command) {
    const container = Build('li', {
      tabIndex: 0,
      classList: 'dropdown-item',
      onclick: this.#handleCommandSelection.bind(this, command),
      title: command.description,
    },
      Build('span', {
        classList: 'label',
        textContent: command.label,
      }),
    );

    if (command.dependsOnPermissions) {
      container.append(
        Build('span', {
          classList: 'permissions-icon',
          title: command.permissions.reduce(
            (acc, permission, index) => {
              if (index > 0) acc += ', ';
              acc += browser.i18n.getMessage(`permissionLabel${permission}`);
              return acc;
            },
            browser.i18n.getMessage('commandPickerAdditionalPermissionsText'),
          ),
        }),
      );
    }

    return container;
  }

  /**
   * Filters the list items by a given string.
   * Items that do not match the filter keywords will be hidden.
   * If no item matches the list placeholder will be shown.
   **/
  #filter(filterString) {
    const filterStringKeywords = filterString.toLowerCase().trim().split(' ');
    let hasResults = false;
    for (const item of this.#dropdownList.querySelectorAll('li')) {
      const itemContent = item.textContent.toLowerCase().trim();
      // check if all keywords are matching the command name
      const isMatching = filterStringKeywords.every(keyword => itemContent.includes(keyword));
      // hide all unmatching commands and show all matching commands
      item.hidden = !isMatching;
      if (isMatching) hasResults = true;
    }
    // if no item is visible add indicator class
    this.#dropdown.classList.toggle('no-results', !hasResults);
    this.#dropdown.classList.toggle('filtering', filterString !== '');
  }

  /**
   * Clear the search/filter input field
   **/
  clearFilter() {
    this.#filterInput.value = '';
    this.#filter('');
  }
}


window.customElements.define('command-picker', CommandPicker);
