import GroupedCommands from "/views/options/components/command-picker/command-groups.mjs";
import { Build } from "/views/shared/commons.mjs";

/**
 * Allows the selection of commands and handles necessary permission checks.
 * A "selection" event is dispatched when a command has been selected.
 * The event.detail property is then populated with a respective command object.
 **/
export class CommandPicker extends HTMLElement {
  #dropdown;
  #dropdownList;
  #filterInput

  #windowSizeChangeListener;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.#windowSizeChangeListener = this.#handleWindowSizeChange.bind(this);
  }

  connectedCallback() {
    // prebuild to get reference for popoverTargetElement
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
        id: 'commandListPlaceholder',
        textContent: browser.i18n.getMessage('commandPickerNoResultsPlaceholder'),
      }),
    );

    this.shadowRoot.append(
      Build('link', {
        rel: 'stylesheet',
        href: import.meta.resolve('./layout.css'),
      }),
      Build('button', {
          id: 'commandSelectButton',
          popoverTargetElement: this.#dropdown,
          popoverTargetAction: 'toggle'
        },
        Build('slot'),
      ),
      this.#dropdown
    );
    window.addEventListener('resize', this.#windowSizeChangeListener);
  }

  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
    window.removeEventListener('resize', this.#windowSizeChangeListener);
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
    this.dispatchEvent(new CustomEvent('selection', {detail: command.clone()}));
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
    const bbox = this.getBoundingClientRect();
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
