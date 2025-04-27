/**
 * An element that can be folded and unfolded via its collapsed boolean attribute.
 * Optionally a header can be supplied by setting the slot attribute to "header".
 * The header will also have an onclick listener to automatically toggle the element state.
 * Collapse transition duration and easing can be controlled by setting the following CSS variables:
 * --collapseDuration - any valid value for transition-duration
 * --collapseTimingFunction - any valid value for transition-timing-function
 *
 * Example:
 * <collapsible-item collapsed>
 *   <div slot="header">Heading</div>
 *   <div>Content</div>
 * </collapsible-item>
 **/
export class CollapsibleItem extends HTMLElement {
  body;

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
            :host([hidden]) { display: none }

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
    this.#handleCollapse();
  }

  static get observedAttributes() {
    return ['collapsed'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'collapsed') {
      this.#handleCollapse();
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
   * Toggle the "collapsed" attribute
   **/
  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }
}

customElements.define('collapsible-item', CollapsibleItem);
