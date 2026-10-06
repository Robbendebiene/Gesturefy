import { Build } from "/views/shared/commons.mjs";
import "/views/options/components/collapsible-item/collapsible-item.mjs";
import "/views/options/components/search-engine-select/search-engine-select.mjs";
import commandSettingsTemplates from "./command-setting-templates.mjs";
import stylesheet from "./layout.css" with { type: "css" };

/**
 * A card that represents a single command.
 * It can be collapsed and expanded.
 * It must be constructed dynamically via `new CommandCard(...)` and requires a `Command` object as parameter.
 * The initial collapsed state can be set via the `initialCollapsed` parameter.
 * The `onRemove` callback will be called when the removed button is pressed.
 * A "change" event is dispatched when any of the settings is changed by a user interaction.
 */
export class CommandCard extends HTMLElement {
  #command;
  #onRemove;
  #initialCollapsed;
  #collapsibleElement;
  #mainCommandLabelElement;
  #secondaryCommandLabelElement;
  #bodyForm;
  #conditionalHint;
  #groupId;

  constructor(command, initialCollapsed = false, groupId = '', onRemove) {
    super();
    this.#command = command;
    this.#initialCollapsed = initialCollapsed;
    this.#groupId = groupId;
    this.#onRemove = onRemove;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets.push(stylesheet);
  }

  get command() {
    return this.#command;
  }

  connectedCallback() {
    this.#conditionalHint = this.#createConditionalHint();
    // build header
    let content = this.#createHeader();
    // build body
    if (this.#command.hasSettings) {
      this.#bodyForm = this.#createBody();
      const headerContainer = content;
      headerContainer.slot = 'header';
      content = this.#collapsibleElement = Build('collapsible-item', {
          group: this.#groupId,
          collapsed: this.#initialCollapsed,
        },
        headerContainer,
        this.#bodyForm,
      );
    }
    this.shadowRoot.append(content, this.#conditionalHint);
    this.#update();
  }

  disconnectedCallback() {
    // overwrite with latest state because this may be called when element is moved in the tree
    // collapsible must not exist so fallback to false
    this.#initialCollapsed = this.#collapsibleElement?.collapsed ?? false;
    this.shadowRoot.replaceChildren();
  }

  /**
   * Create command card header.
   */
  #createHeader() {
    return Build('div', {
        classList: 'command-header',
        title: this.command.description,
      },
      Build('div', {
        classList: 'drag-handle',
      }, (ele) => {
        // Enable dragging ONLY when the mouse enters the handle
        ele.addEventListener('pointerenter', () => this.draggable = true);
        ele.addEventListener('pointerleave', () => this.draggable = false);
      }),
      Build('div', {
          classList: 'command-header-wrapper',
        },
        Build('div', {
            classList: 'command-header-content',
          },
          this.#mainCommandLabelElement = Build('span', {
            textContent: this.#command.explicitLabel,
          }),
          this.#secondaryCommandLabelElement = Build('span', {
            classList: 'command-secondary-label',
            textContent: this.#command.label,
          }),
        ),
        Build('div', {
            classList: 'command-header-actions',
          },
          Build('button', {
            classList: 'command-remove-button',
            onclick: this.#handleRemoveButtonClick.bind(this),
          }),
        ),
      ),
    );
  }

  /**
   * Create command card body containing the command's settings.
   */
  #createBody() {
    const filteredTemplates = commandSettingsTemplates.querySelectorAll(`[data-commands~='${this.#command.name}']`);

    const bodyContainer = Build('form', {
        classList: 'command-body',
      },
      // build and insert the corresponding setting templates
      ...filteredTemplates.values().map(template => Build('div', null,
        // copy over any classes from the template
        (ele) => ele.classList.add(...template.classList, 'command-setting'),
        document.importNode(template.content, true),
      ))
    );

    // apply command settings
    for (const settingInput of bodyContainer.querySelectorAll('[name]')) {
      settingInput.onchange = this.#handleSettingChange.bind(this);

      if (Object.hasOwn(this.#command.settings, settingInput.name)) {
        if (settingInput.type === 'checkbox') {
          settingInput.checked = this.#command.settings[settingInput.name];
        }
        else {
          settingInput.value = this.#command.settings[settingInput.name];
        }
      }
    }

    return bodyContainer;
  }

  /**
   * Creates the hint badge indicating that the command depends on conditions.
   */
  #createConditionalHint() {
    return Build('span', {
      classList: 'command-alt-hint',
      textContent: browser.i18n.getMessage('commandPickerAlternativeHint'),
    });
  }

  #update() {
    // update label as it might have changed due to a settings change
    this.#mainCommandLabelElement.textContent = this.#command.explicitLabel;
    // toggle secondary label visibility
    this.#secondaryCommandLabelElement.hidden = this.#command.label === this.#command.explicitLabel;
    // can change due to settings changes
    this.#conditionalHint.hidden = !this.command.dependsOnConditions;
    this.#conditionalHint.title = browser.i18n.getMessage(
      'commandPickerAlternativeHintText',
      this.#command.invalidConditionsText,
    );
  }

  #handleRemoveButtonClick(event) {
    this.#onRemove?.(this.#command, this, event);
    // prevent collapsible item from collapsing
    event.stopPropagation();
  }

  /**
   * Handler for command settings input fields.
   * This directly updates the assigned command's setting.
   */
  async #handleSettingChange(event) {
    const settingInput = event.target;
    let value;
    // get true or false for checkboxes
    if (settingInput.type === 'checkbox') {
      value = settingInput.checked;
    }
    // get value as number for number fields
    else if (!isNaN(settingInput.valueAsNumber)) {
      value = settingInput.valueAsNumber;
    }
    else {
      value = settingInput.value;
    }
    // write change to command
    this.#command.settings[settingInput.name] = value;
    this.#update();

    // forward event to outside world
    this.dispatchEvent(new CustomEvent('change', {
      detail: { sourceEvent: event },
      bubbles: true
    }));
  }

  validate() {
    return this.#bodyForm?.checkValidity() ?? true;
  }
}


window.customElements.define('command-card', CommandCard);
