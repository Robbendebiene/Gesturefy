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

customElements.define('locale-option', LocaleOption, { extends: 'option' });
