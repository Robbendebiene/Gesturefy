/**
 * Workaround to localize options in select elements.
 * This is derived from the locale-text element.
 * It is required because the native option element cannot contain html content.
 *
 * Example:
 * ```html
 * <select>
 *   <option value="1" key="settingLabelMouseButtonLeft" is="locale-option"></option>
 *   <option value="2" key="settingLabelMouseButtonRight" is="locale-option"></option>
 *   <option value="4" key="settingLabelMouseButtonMiddle" is="locale-option"></option>
 * </select>
 * ```
 *
 * Future solutions to this problem:
 * - Use base-select, because it can show HTML content therefore also the locale-text element. It also has the benefit of no longer requiring a select wrapper for custom styling.
 * - Use global element attributes (https://github.com/WICG/webcomponents/issues/1029). It makes locale-text element element obsolete, instead there could be a locale-key attribute.
*/
export class LocaleOption extends HTMLOptionElement {
  static get observedAttributes() {
    return ['key'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // will also be called if attribute is initially set
    if (name === 'key') {
      const string = browser.i18n.getMessage(newValue);
      // insert text from language files if found
      if (string) {
        this.label = string;
      }
    }
  }

  /**
   * Setter for the "key" attribute
   **/
  set key(value) {
    if (value) {
      this.setAttribute('key', value);
    }
    else {
      this.removeAttribute('key');
    }
  }

  /**
   * Getter for the "key" attribute
   **/
  get key() {
    return this.getAttribute('key');
  }
}

/**
 * Special select option element that can be used to toggle the visibility of other elements.
 * The "toggle" attribute must be set to a CSS selector that selects the elements to be toggled.
 * If the option is selected, the elements matching the toggle selector will be shown and hidden otherwise.
 *
 * Example:
 * ```html
 * <select>
 *   <option value="1" toggle=".firstSelector, #secondSelector" is="locale-option"></option>
 *   <option value="2" toggle=".secondSelector" is="locale-option"></option>
 *   <option value="3" toggle=".thirdSelector" is="locale-option"></option>
 * </select>
 *
 * Note: This incorporates the locale-option element, which is required to localize the option text.
 * This will be obsolete at some point in the future. See comment on LocaleOption
 * ```
 **/
export class ToggleOption extends LocaleOption {
  #toggleHandler = this.#toggle.bind(this);
  #parentSelect;

  static get observedAttributes() {
    // redefine key attribute from locale-option
    return ['toggle', 'key'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // call attributeChangedCallback from locale-option
    super.attributeChangedCallback(name, oldValue, newValue);
    // will also be called if attribute is initially set
    if (name === 'toggle') this.#toggle();
  }

  connectedCallback() {
    this.#parentSelect = this.closest('select');
    this.#parentSelect?.addEventListener('change', this.#toggleHandler);
    this.#toggle();
  }

  disconnectedCallback() {
    this.#parentSelect?.removeEventListener('change', this.#toggleHandler);
  }

  /**
   * Setter for the "toggle" attribute
   **/
  set toggle(value) {
    if (value) {
      this.setAttribute('toggle', value);
    }
    else {
      this.removeAttribute('toggle');
    }
  }

  /**
   * Getter for the "toggle" attribute
   **/
  get toggle() {
    return this.getAttribute('toggle');
  }

  #toggle() {
    if (!this.#parentSelect) return;
    const hidden = this.#parentSelect.value !== this.value;
    this.getRootNode().querySelectorAll(this.toggle).forEach(
      ele => ele.hidden = hidden,
    );
  }
}

customElements.define('locale-option', LocaleOption, { extends: 'option' });
customElements.define('toggle-option', ToggleOption, { extends: 'option' });
