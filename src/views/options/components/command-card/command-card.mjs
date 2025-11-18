import { fetchHTMLAsFragment } from "/core/utils/commons.mjs";
import { Build } from "/views/shared/commons.mjs";
import "/views/options/components/collapsible-item/collapsible-item.mjs";

// getter for module path
const MODULE_DIR = (() => {
  const urlPath = new URL(import.meta.url).pathname;
  return urlPath.slice(0, urlPath.lastIndexOf('/') + 1);
})();

const COMMAND_SETTING_TEMPLATES = fetchHTMLAsFragment(browser.runtime.getURL('/views/options/components/command-card/command-setting-templates.inc'));

/**
 * A card that represents a single command.
 * It can be collapsed and expanded.
 * It must be constructed dynamically via `new CommandCard(...)` and requires a `Command` object as parameter.
 * The initial collapsed state can be set via the `initialCollapsed` parameter.
 * The `onRemove` callback will be called when the removed button is pressed.
 */
export default class CommandCard extends HTMLElement {
  #command;
  #onRemove;
  #initialCollapsed;

  constructor(command, initialCollapsed = false, onRemove) {
    super();
    this.#command = command;
    this.#initialCollapsed = initialCollapsed;
    this.#onRemove = onRemove;
    this.attachShadow({ mode: 'open' });
  }

  get command() {
    return this.#command;
  }

  async connectedCallback() {
    this.shadowRoot.append(
      Build('link', {
        rel: 'stylesheet',
        href: `${MODULE_DIR}layout.css`,
      })
    );
    // build header
    const headContainer = this.#createHeader();
    // build body
    if (this.#command.hasSettings) {
      const bodyContainer = await this.#createBody();
      headContainer.slot = 'header';

      this.shadowRoot.append(
        Build('collapsible-item', {
            group: 'commandPickerCollapsibleItem',
            collapsed: this.#initialCollapsed,
          },
          headContainer,
          bodyContainer
        )
      );
    }
    else {
      this.shadowRoot.append(headContainer);
    }
  }

  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
  }

  /**
   * Create command card header.
   */
  #createHeader() {
    return Build('div', {
        classList: 'command-header',
      },
      Build('div', {
          classList: 'command-header-main',
        },
        Build('span', {
          textContent: this.#command.label,
        }),
        Build('button', {
          classList: 'command-remove-button',
          onclick: this.#handleRemoveButtonClick.bind(this),
        }),
      ),
      Build('div', {
        classList: 'command-header-secondary',
      }),
    );
  }

  /**
   * Create command card body containing the command's settings.
   */
  async #createBody() {
    const settingTemplates = await COMMAND_SETTING_TEMPLATES;
    const filteredTemplates = settingTemplates.querySelectorAll(`[data-commands~='${this.#command.name}']`);

    const bodyContainer = Build('div', {
        classList: 'command-body',
      },
      // build and insert the corresponding setting templates
      ...filteredTemplates.values().map(template => Build('div', {
          classList: 'command-setting',
        },
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
  }
}


window.customElements.define('command-card', CommandCard);
