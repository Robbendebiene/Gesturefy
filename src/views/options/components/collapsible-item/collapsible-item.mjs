/**
 * An element that can be folded and unfolded via its collapsed boolean attribute.
 * Optionally a header can be supplied by setting the slot attribute to "header".
 * The header will also have an onclick listener to automatically toggle the element state.
 * Collapse transition duration and easing can be controlled by setting the following CSS variables:
 * --collapseDuration - any valid value for transition-duration
 * --collapseTimingFunction - any valid value for transition-timing-function
 * Dispatches a custom "collapse" event with a details property of type boolean indicating its state.
 *
 * Provides two attributes:
 * - collapsed - boolean indicating the state of the element
 * - group - string identifying a group of other collapsible-items that should be collapsed together to create an accordion behaviour
 *
 * Example:
 * ```html
 * <collapsible-item collapsed>
 *   <div slot="header">Heading</div>
 *   <div>Content</div>
 * </collapsible-item>
 * ```
 **/
export class CollapsibleItem extends HTMLElement {
  body;

  static #groups = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const style = document.createElement("style");
          style.textContent = `
            :host {
              display: block;
              border: solid 1px black;
              --collapseDuration: 0.3s;
              --collapseTimingFunction: ease;
            }

            #body {
              overflow: hidden;
              transition-property: height, visibility;
              transition-behavior: allow-discrete;
              transition-duration: var(--collapseDuration);
              transition-timing-function: var(--collapseTimingFunction);
            }
          `;

    const headerSlot = document.createElement('slot');
          headerSlot.name = 'header';
          headerSlot.addEventListener('click', this.toggleCollapse.bind(this));

    // unnamed/default slot, header is considered optional
    const bodySlot = document.createElement('slot');

    this.body = document.createElement('div');
    this.body.id = 'body';
    this.body.append(bodySlot);

    this.shadowRoot.append(style, headerSlot, this.body);
  }

  connectedCallback() {
    // required to set starting height. Will be obsolete once interpolate-size is used.
    if (!this.collapsed) this.#unfold();
  }

  disconnectedCallback() {
    if (this.group && CollapsibleItem.#groups.get(this.group) === this) {
      CollapsibleItem.#groups.delete(this.group);
    }
  }

  static get observedAttributes() {
    return ['collapsed', 'group'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // will also be called if collapsed is initially set
    if (name === 'collapsed') {
      const oldCollapsed = oldValue !== null;
      const newCollapsed = newValue !== null;
      if (oldCollapsed !== newCollapsed) {
        this.#handleGroupCollapse();
        this.#handleCollapse();
        this.dispatchEvent(new CustomEvent('collapse', {
          detail: newCollapsed,
        }));
      }
    }
    else if (name === 'group') {
      // on group change remove from old group
      if (CollapsibleItem.#groups.get(oldValue) === this) {
        CollapsibleItem.#groups.delete(oldValue);
      }
      this.#handleGroupCollapse();
    }
  }

  #handleGroupCollapse() {
    if (this.group) {
      const activeItem = CollapsibleItem.#groups.get(this.group);
      if (this.collapsed) {
        // unmark as active item
        if (activeItem === this) CollapsibleItem.#groups.delete(this.group);
      }
      else {
        // collapse current active item
        if (activeItem) activeItem.collapsed = true;
        // override active item with this item
        CollapsibleItem.#groups.set(this.group, this);

      }
    }
  }

  #handleCollapse() {
    if (this.collapsed) {
      this.#fold();
    }
    else {
      this.#unfold();
    }
  }

  #fold() {
    this.body.style.setProperty('height', 0);
    this.body.style.setProperty('visibility', 'hidden');
  }

  #unfold() {
    // use https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size in the future
    this.body.style.setProperty('height', this.body.scrollHeight + 'px');
    this.body.style.setProperty('visibility', 'visible');
  }

  /**
   * Setter for the "collapsed" attribute
   **/
  set collapsed(value) {
    if (value) {
      this.setAttribute('collapsed', '');
    }
    else {
      this.removeAttribute('collapsed');
    }
  }

  /**
   * Getter for the "collapsed" attribute
   **/
  get collapsed() {
    return this.hasAttribute('collapsed');
  }

  /**
   * Setter for the "group" attribute
   **/
  set group(value) {
    return this.setAttribute('group', value);
  }

  /**
   * Getter for the "group" attribute
   **/
  get group() {
    return this.getAttribute('group');
  }

  /**
   * Toggle the "collapsed" attribute
   **/
  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }
}

customElements.define('collapsible-item', CollapsibleItem);
