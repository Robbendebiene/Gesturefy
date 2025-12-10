import { Build } from "/views/shared/commons.mjs";

import MouseGestureController from "/core/controllers/mouse-gesture-controller.mjs";

import PatternConstructor from "/core/utils/pattern-constructor.mjs";

import "/views/options/components/pattern-preview/pattern-preview.mjs";


/**
 * An area that allows the user to record a new mouse gesture.
 * The pattern can be read and updated via the pattern property.
 * The mouse button which triggers the gesture can be set via the mouseButton property.
 * Makes use of the pattern-preview element.
 */
export class PatternRecorder extends HTMLElement {

  static #mouseButtonLabelMap = {
    1: 'gesturePopupMouseButtonLeft',
    2: 'gesturePopupMouseButtonRight',
    4: 'gesturePopupMouseButtonMiddle'
  }

  static formAssociated = true;
  #internals;

  #pattern;
  #mouseButton;

  #canvasContext;
  #patternPreviewElement;
  #containerElement;

  #gestureRegisterHandler
  #gestureStartHandler;
  #gestureUpdateHandler;
  #gestureAbortHandler;
  #gestureEndHandler;

  constructor(pattern = undefined, mouseButton = 1) {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
    this.#pattern = pattern;
    this.#mouseButton = mouseButton;
    this.#gestureRegisterHandler = this.#handleGestureRegister.bind(this);
    this.#gestureStartHandler = this.#handleGestureStart.bind(this);
    this.#gestureUpdateHandler = this.#handleGestureUpdate.bind(this);
    this.#gestureAbortHandler = this.#handleGestureAbort.bind(this);
    this.#gestureEndHandler = this.#handleGestureEnd.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.append(
      Build('link', {
        rel: 'stylesheet',
        href: import.meta.resolve('./layout.css'),
      }),
      this.#containerElement = Build('div', {
          id: 'stack'
        },
        this.#patternPreviewElement = Build('pattern-preview', {
          id: 'patternPreview',
          pattern: this.#pattern,
        }),
        Build('canvas', {
            id: 'canvas',
          },
          canvas => this.#canvasContext = canvas.getContext("2d"),
        ),
      ),
    );

    this.#updatePattern();
    this.#updateMouseButton();

    MouseGestureController.addEventListener("register", this.#gestureRegisterHandler);
    MouseGestureController.addEventListener("start", this.#gestureStartHandler);
    MouseGestureController.addEventListener("update", this.#gestureUpdateHandler);
    MouseGestureController.addEventListener("abort", this.#gestureAbortHandler);
    MouseGestureController.addEventListener("end", this.#gestureEndHandler);
    MouseGestureController.enable();
  }


  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
    this.#canvasContext = null;
    this.#patternPreviewElement = null;
    this.#containerElement = null;

    MouseGestureController.removeEventListener("register", this.#gestureRegisterHandler);
    MouseGestureController.removeEventListener("start", this.#gestureStartHandler);
    MouseGestureController.removeEventListener("update", this.#gestureUpdateHandler);
    MouseGestureController.removeEventListener("abort", this.#gestureAbortHandler);
    MouseGestureController.removeEventListener("end", this.#gestureEndHandler);
    MouseGestureController.disable();
  }

  formResetCallback() {
    this.pattern = undefined;
  }

  set pattern(value) {
    this.#pattern = value;
    if (this.isConnected) this.#updatePattern();
  }

  get pattern() {
    return this.#pattern;
  }

  set mouseButton(value) {
    this.#mouseButton = value;
    if (this.isConnected) this.#updateMouseButton();
  }

  get mouseButton() {
    return this.#mouseButton;
  }

  #updatePattern() {
    this.#patternPreviewElement.pattern = this.#pattern;
    this.#containerElement.classList.toggle('empty', !this.#pattern);
    // from validation
    if (this.#pattern == undefined) {
      this.#internals.setValidity(
        { valueMissing: true },
        browser.i18n.getMessage('gestureFormValidationMissingGesture'),
      );
    }
    else if (this.#pattern.length < 2) {
      this.#internals.setValidity(
        { badInput: true },
        browser.i18n.getMessage('gestureFormValidationInvalidGesture'),
      );
    }
    else {
      this.#internals.setValidity({ });
    }
  }

  #updateMouseButton() {
    MouseGestureController.mouseButton = this.#mouseButton;
    this.#containerElement.title = browser.i18n.getMessage(
      'gesturePopupRecordingAreaText',
      browser.i18n.getMessage(PatternRecorder.#mouseButtonLabelMap[this.mouseButton])
    );
  }

  #handleGestureRegister(event, events) {
    // detect if the gesture started on the recording area
    if (!this.contains(event.target)) {
      // cancel gesture and event handler if the first click was not within the recording area
      MouseGestureController.cancel();
      return;
    }
    const canvas = this.#canvasContext.canvas;
    // initialize canvas properties (correct width and height are only known after the popup has been opened)
    const canvasRect = canvas.getBoundingClientRect();
    canvas.width = canvasRect.width;
    canvas.height = canvasRect.height;
    // translate the canvas coordinates by the position of the canvas element
    this.#canvasContext.setTransform(1, 0, 0, 1, -canvasRect.x, -canvasRect.y);
    // set styles again because they will be reset when width/height changes
    this.#canvasContext.lineCap = "round";
    this.#canvasContext.lineJoin = "round";
    this.#canvasContext.lineWidth = 10;
    this.#canvasContext.strokeStyle = "#00aaa0";
  }

  #handleGestureStart(event, events) {
    // get first event and remove it from the array
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1] ?? firstEvent;

    this.#canvasContext.beginPath();
    this.#canvasContext.moveTo(
      firstEvent.clientX,
      firstEvent.clientY
    );
    for (let event of events.values().drop(1)) this.#canvasContext.lineTo(
      event.clientX,
      event.clientY
    );
    this.#canvasContext.stroke();
    this.#canvasContext.beginPath();
    this.#canvasContext.moveTo(
      lastEvent.clientX,
      lastEvent.clientY
    );
  }

  #handleGestureUpdate(event) {
    // include fallback if getCoalescedEvents is not defined
    const events = event.getCoalescedEvents?.() ?? [event];

    const lastEvent = events[events.length - 1];
    for (let event of events) this.#canvasContext.lineTo(
      event.clientX,
      event.clientY
    );
    this.#canvasContext.stroke();
    this.#canvasContext.beginPath();
    this.#canvasContext.moveTo(
      lastEvent.clientX,
      lastEvent.clientY
    );
  }

  #handleGestureAbort(event, events) {
    this.#canvasContext.reset();
  }

  #handleGestureEnd(event, events) {
    this.#canvasContext.reset();
    // setup pattern extractor
    const patternConstructor = new PatternConstructor(0.12, 10);
    // gather all events in one array
    // calling getCoalescedEvents for an event other then pointermove will return an empty array
    // build gesture pattern
    events
      .values()
      .flatMap(event => {
        const events = event.getCoalescedEvents?.();
        // if events is null/undefined or empty (length == 0) return plain event
        return (events?.length > 0) ? events : [event];
      })
      .forEach(event => patternConstructor.addPoint(event.clientX, event.clientY));
    // update current pattern
    this.pattern = patternConstructor.getPattern();
  }
}

customElements.define('pattern-recorder', PatternRecorder);
