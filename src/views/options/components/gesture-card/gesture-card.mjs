import { Build } from "/views/shared/commons.mjs";

import "/views/options/components/pattern-preview/pattern-preview.mjs";

/**
 * Displays a gesture and its command in a card.
 * It must be constructed dynamically via `new GestureCard(...)` and requires a `Gesture` object as parameter.
 * When the remove button is clicked the optional `onRemove` callback will be called.
 **/
export class GestureCard extends HTMLElement {
  #gesture;
  #patternElement;
  #commandElement;

  onRemove;

  constructor(gesture, {
    onRemove = null,
  } = {}) {
    super();
    this.#gesture = gesture;
    this.onRemove = onRemove;
    this.attachShadow({ mode: 'open' });
    this.addEventListener('pointerenter', this.#handlePointerenter.bind(this));
  }

  connectedCallback() {
    this.shadowRoot.append(
      Build('link', {
        rel: 'stylesheet',
        href: import.meta.resolve('./layout.css'),
      }),
      // required to fix FOUC
      // inline style prevents transitions from triggering on page load (Ctrl + Shift + R)
      // as it is loaded before the component is rendered while the stylesheet is loaded afterwards
      Build('style', {
        textContent: '.remove-button { opacity: 0; }',
      }),
      Build('div', {
          id: 'card'
        },
        this.#patternElement = Build('pattern-preview', {
          classList: 'thumbnail',
          pattern: this.#gesture.pattern,
        }),
        this.#commandElement = Build('div', {
          classList: 'command',
          textContent: this.#gesture.toString(),
        }),
        Build('button', {
          classList: 'remove-button',
          onclick: this.#handleRemoveButtonClick.bind(this),
        }),
      ),
    );
  }


  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
    this.#patternElement = null;
    this.#commandElement = null;
  }

  set gesture(value) {
    this.#gesture = value;
    if (this.isConnected) {
      this.#patternElement.pattern = this.#gesture.pattern;
      this.#commandElement.textContent = this.#gesture.toString();
    }
  }

  get gesture() {
    return this.#gesture;
  }

  /**
   * Handles the gesture card hover and triggers the demo animation.
   **/
  #handlePointerenter(event) {
    // add delay so it only triggers if the mouse stays on the card
    setTimeout(() => {
      if (this.matches(":hover")) this.#patternElement?.playDemo();
    }, 200);
  }

  #handleRemoveButtonClick(event) {
    this.onRemove?.(this);
    // prevent event bubbling triggering the gesture list item click event
    event.stopPropagation();
  }
}

customElements.define('gesture-card', GestureCard);
