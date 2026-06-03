import { Build } from "/views/shared/commons.mjs";
import stylesheet from "./layout.css" with { type: "css" };

/**
 * A select element that allows the user to select one of their defined search engines.
 * The selected search engine can be accessed via the "value" property.
 * Supported attributes:
 * - name: The name of the select element.
 * Dispatches a "change" event when the selected search engine changes.
 * This requires the "search" permission which is automatically requested when the user
 * clicks the select element.
 */
export class SearchEngineSelect extends HTMLElement {
  #selectElement;
  // required due to the async nature of the search engine loading
  #value;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets.push(stylesheet);
    this.shadowRoot.append(
      this.#selectElement = Build('select', {},
        (ele) => {
          ele.addEventListener('pointerdown', this.#handleSelectClick.bind(this));
          ele.addEventListener('change', this.#handleSelectChange.bind(this));
        }
      )
    );
  }

  connectedCallback() {
    this.#loadSearchEngines();
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    this.#value = this.#selectElement.value = value;
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(name) {
    this.setAttribute('name', name);
  }

  async #loadSearchEngines() {
    if (browser.search) {
      const engines = await browser.search.get();
      this.#selectElement.replaceChildren(
        ...engines.values().map(engine => Build('option', {
          value: engine.name,
          textContent: engine.name,
          selected: engine.isDefault,
        })),
      );
      if (this.value) {
        this.#selectElement.value = this.value;
      }
    }
  }

  async #handleSelectClick(event) {
    // (re)load search engines asynchronously and request permissions if necessary
    if (!browser.search) {
      await browser.permissions.request({ permissions: ["search"] });
    }
    await this.#loadSearchEngines();
  }

  #handleSelectChange(event) {
    this.#value = this.#selectElement.value;
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.value,
    }));
  }
}

customElements.define('search-engine-select', SearchEngineSelect);
