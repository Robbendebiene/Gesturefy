/**
 * An element that takes its contents from the messages.json files based on the given message name.
 * The message name is given via the "key" attribute.
 * If the provided message name could not be found the content/children of the element will be shown.
 *
 * Example:
 * <locale-text key="myLocaleKey">
 *   Fallback text
 * </locale-text>
 **/
export class LocaleText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['key'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // will also be called if attribute is initially set
    if (name === 'key') {
      const string = browser.i18n.getMessage(newValue);
      // insert text from language files if found
      if (string) {
        this.shadowRoot.textContent = string;
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

customElements.define('locale-text', LocaleText);
