import MouseGestureController from "/core/modules/mouse-gesture-controller.js";

import CommandBar from "/ui/js/modules/command-bar.js";

export default {
  init: init,
  open: open,
  close: close,
  onSubmit: onSubmit,
  onCancel: onCancel
};

/**
 * GesturePopup "singleton"
 * The module needs to be initialized once before using
 * required parameters are: an array of gesture objects an array of commands and a document fragment containing the command settings
 * provides an "onSubmit" and "onCancel" event to register custom event listeners
 * REQUIRES: gesture-popup.css
 **/

// private variables

// get root document
const document = window.top.document;

// hold certain node references for later use
let popup,
    popupHeading,
    commandButton, gestureDirectionsInput, gestureLabelInput,
    canvasElement, canvasContext,
    saveButton;

// holds the selected command
let selectedCommand = null;

// holds reference to the gesture object that is updated if any
let currentlyActiveGestureObject = null;

// contains all existing gestures which is a reference to the cached config
let gestureArray;

// holds custom event handlers
const gestureSubmitEventHandler = [];
const gestureCancelEventHandler = [];

// public methods

/**
 * Initializes the module
 * gestures = array of json formatted gestures
 **/
function init (gestures, commands, commandSettingTemplates) {
  // store reference to array of gestures
  gestureArray = gestures;
  // build the popup html structure
  build();
  // setup the gestue controller
  mouseGestureControllerSetup();
  // init command bar
  CommandBar.init(commands, commandSettingTemplates);
};


/**
 * Add onSubmit event handlers
 **/
function onSubmit (handler) {
  gestureSubmitEventHandler.push(handler);
}


/**
 * Add onCancel event handlers
 **/
function onCancel (handler) {
  gestureCancelEventHandler.push(handler);
}


/**
 * Opens the gesture popup
 * disables the mouse gesture controller and removes all added event listeners
 **/
function open (gestureObject) {
  if (!document.body.contains(popup)) {
    if (gestureObject) {
      popupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleEditGesture');
      commandButton.title = browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
      gestureDirectionsInput.value = gestureObject.gesture;
      gestureLabelInput.placeholder = commandButton.title;
      if (gestureObject.label) gestureLabelInput.value = gestureObject.label;
      // store reference to current gesture object
      currentlyActiveGestureObject = gestureObject;
      // store current command object
      selectedCommand = { command: gestureObject.command };
      if (gestureObject.settings) selectedCommand.settings = Object.assign({}, gestureObject.settings);
    }
    else {
      popupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleNewGesture');
    }
    popup.classList.add("gp-hide");
    document.body.appendChild(popup);
    // trigger reflow
    popup.offsetHeight;
    popup.classList.replace("gp-hide", "gp-show");

    // set root window as gesture target and enable gesture controller
    MouseGestureController.targetElement = window.top;
    MouseGestureController.enable();

    canvasElement.width = canvasElement.offsetWidth;
    canvasElement.height = canvasElement.offsetHeight;
    canvasContext.lineCap = "round";
    canvasContext.lineJoin = "round";
    canvasContext.lineWidth = 10;
    canvasContext.strokeStyle = "#00aaa0";
  }
}


/**
 * Closes the popup and the command bar
 * disables the mouse gesture controller and removes all added event listeners
 **/
function close (rect) {
  CommandBar.close();

  if (document.body.contains(popup)) {
    popup.addEventListener("transitionend", () => {
      popup.classList.remove("cb-hide");
      popup.remove();
      // reset input field values
      commandButton.title = gestureDirectionsInput.value = gestureLabelInput.placeholder = gestureLabelInput.value = "";
    }, {once: true});
    popup.classList.replace("gp-show", "gp-hide");
  }

  MouseGestureController.disable();

  // reset temporary variables and validation
  selectedCommand = null;
  currentlyActiveGestureObject = null;
  gestureDirectionsInput.setCustomValidity("");

  // clear event handler arrays
  gestureSubmitEventHandler.length = 0;
  gestureCancelEventHandler.length = 0;
}

// private methods

/**
 * Creates the required HTML structure
 **/
function build () {
  // create dom nodes
  popup = document.createElement("div");
  popup.classList.add("gesture-popup");

  const popupHead = document.createElement("div");
        popupHead.classList.add("gp-head");
  popupHeading = document.createElement("div");
  popupHeading.classList.add("gp-heading");
  const popupCancelButton = document.createElement("button");
        popupCancelButton.classList.add("gp-cancel-button");
        popupCancelButton.type = "button";
        popupCancelButton.onclick = cancelGesture;
  popupHead.append(popupHeading, popupCancelButton);

  const popupMain = document.createElement("div");
        popupMain.classList.add("gp-main");

  const popupForm = document.createElement("form");
        popupForm.classList.add("gp-form");
        popupForm.onsubmit = submitGesture;

  const commandField = document.createElement("fieldset");
        commandField.classList.add("gp-field");
  const commandLabel = document.createElement("span");
        commandLabel.classList.add("gp-field-name");
        commandLabel.textContent = browser.i18n.getMessage('gesturePopupLabelCommand');
  const commandDescription = document.createElement("p");
        commandDescription.classList.add("gp-field-description");
        commandDescription.textContent = browser.i18n.getMessage('gesturePopupDescriptionCommand');
  commandButton = document.createElement("button");
  commandButton.classList.add("gp-field-input", "gp-command");
  commandButton.type = "button";
  commandButton.onclick = onCommandSelectButtonClick;

  commandField.append(commandLabel, commandDescription, commandButton);

  const gesturDirectionsField = document.createElement("label");
        gesturDirectionsField.classList.add("gp-field");
  const gestureDirectionsName = document.createElement("span");
        gestureDirectionsName.classList.add("gp-field-name");
        gestureDirectionsName.textContent = browser.i18n.getMessage('gesturePopupLabelGestureDirections');
  const gestureDirectionsDescription = document.createElement("p");
        gestureDirectionsDescription.classList.add("gp-field-description");
        gestureDirectionsDescription.textContent = browser.i18n.getMessage('gesturePopupDescriptionGestureDirections');
  gestureDirectionsInput = document.createElement("input");
  gestureDirectionsInput.classList.add("gp-field-input", "gp-code");
  gestureDirectionsInput.onkeypress = onGestureInputKeypress;
  gestureDirectionsInput.oninput = onGestureDirectionsInput;
  gestureDirectionsInput.onpaste = event => event.preventDefault();
  gestureDirectionsInput.pattern = "(\\b(?:([UDRL])(?!\\2{1}))+\\b)";
  gestureDirectionsInput.required = true;

  gesturDirectionsField.append(gestureDirectionsName, gestureDirectionsDescription, gestureDirectionsInput);

  const gestureLabelField = document.createElement("label");
        gestureLabelField.classList.add("gp-field");
  const gestureLabelName = document.createElement("span");
        gestureLabelName.classList.add("gp-field-name");
        gestureLabelName.textContent = browser.i18n.getMessage('gesturePopupLabelOptionalLabel');
  const gestureLabelDescription = document.createElement("p");
        gestureLabelDescription.classList.add("gp-field-description");
        gestureLabelDescription.textContent = browser.i18n.getMessage('gesturePopupDescriptionOptionalLabel');
  gestureLabelInput = document.createElement("input");
  gestureLabelInput.classList.add("gp-field-input", "gp-label");
  gestureLabelInput.maxLength = 100;

  gestureLabelField.append(gestureLabelName, gestureLabelDescription, gestureLabelInput);

  const recordingArea = document.createElement("div");
        recordingArea.classList.add("gp-draw-area");
        recordingArea.title = browser.i18n.getMessage('gesturePopupRecordingAreaText');
  canvasElement = document.createElement("canvas");
        canvasElement.classList.add("gp-canvas");
  canvasContext = canvasElement.getContext("2d");
  recordingArea.appendChild(canvasElement);

  saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.classList.add("gp-save-button");
  saveButton.textContent = "Save";

  popupForm.append(commandField, gesturDirectionsField, gestureLabelField, saveButton);

  popupMain.append(popupForm, recordingArea);

  popup.append(popupHead, popupMain);
}


/**
 * Adds necessary event listeners to the mouse gesture controller
 **/
function mouseGestureControllerSetup () {
  // detect if the gesture started on the canvas element and draw the beginning of the trace
  MouseGestureController.addEventListener("start", (events) => {
    if (events[0].target !== canvasElement) {
      // cancel gesture and event handler if the first click was not within the recording area
      MouseGestureController.cancel();
      return;
    }
    // get first event and remove it from the array
    const firstEvent = events.shift();
    const lastEvent = events[events.length - 1] || firstEvent;

    // translate the canvas coordiantes by the position of the canvas element
    const clientRect = canvasElement.getBoundingClientRect();
    canvasContext.setTransform(1, 0, 0, 1, -clientRect.x, -clientRect.y);
    // draw all occurred events
    canvasContext.beginPath();
    canvasContext.moveTo(
      firstEvent.screenX - window.top.mozInnerScreenX,
      firstEvent.screenY - window.top.mozInnerScreenY
    );
    for (let event of events) canvasContext.lineTo(
      event.screenX - window.top.mozInnerScreenX,
      event.screenY - window.top.mozInnerScreenY
    );
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(
      lastEvent.screenX - window.top.mozInnerScreenX,
      lastEvent.screenY - window.top.mozInnerScreenY
    );
  });

  // draw gesture trace
  MouseGestureController.addEventListener("update", (events) => {
    const lastEvent = events[events.length - 1];
    for (let event of events) canvasContext.lineTo(
      event.screenX - window.top.mozInnerScreenX,
      event.screenY - window.top.mozInnerScreenY
    );
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(
      lastEvent.screenX - window.top.mozInnerScreenX,
      lastEvent.screenY - window.top.mozInnerScreenY
    );
  });

  // update directions input
  MouseGestureController.addEventListener("change", (events, directions) => {
    gestureDirectionsInput.value = directions.join("");
    // dipatch input event manually
    gestureDirectionsInput.dispatchEvent(new Event('input'));
  });

  // clear canvas
  MouseGestureController.addEventListener("end", () => {
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
  });
}


/**
 * Opens the command bar and passes the currently selected command if existing
 **/
function onCommandSelectButtonClick () {
  CommandBar.open(selectedCommand);
  CommandBar.onCancel(CommandBar.close);
  CommandBar.onSubmit((commandObject) => {
    CommandBar.close();
    selectedCommand = commandObject;
    // update popup fields
    commandButton.title = gestureLabelInput.placeholder = browser.i18n.getMessage(`commandLabel${commandObject.command}`);
  });
}


/**
 * Handles the allowed keys for the gesture directions input field and translates the arrow keys
 **/
function onGestureInputKeypress (event) {
  // ignore these keys
  if (event.key === "Backspace" || event.key === "Delete" || event.ctrlKey || event.altKey) return;

  const arrowKeyMapping = {
    "ArrowUp": "U",
    "ArrowRight": "R",
    "ArrowDown": "D",
    "ArrowLeft": "L"
  }
  // convert arrow keys to direction code
  const directionCode = arrowKeyMapping[event.key];
  // get precding and following char / direction
  const precedingDirectionCode = this.value.slice(this.selectionStart - 1, this.selectionStart);
  const followingDirectionCode = this.value.slice(this.selectionEnd, this.selectionEnd + 1);

  // prevent disallowed keys and direction doublings
  if (directionCode && precedingDirectionCode !== directionCode && followingDirectionCode !== directionCode) {
    const cursorPosition = this.selectionStart;
    this.value = this.value.slice(0, this.selectionStart) + arrowKeyMapping[event.key] + this.value.slice(this.selectionEnd);
    this.selectionStart = this.selectionEnd = cursorPosition + 1;
    // dipatch input event manually
    event.currentTarget.dispatchEvent(new Event('input'));
  }
  event.preventDefault();
}


/**
 * Verifies the gesture directions input and marks the field as invalid if the current combination of directions already exists
 **/
function onGestureDirectionsInput () {
  // detect if the gesture is already in use / a duplicate
  const gestureObject = gestureArray.find((ele) => ele.gesture === gestureDirectionsInput.value);
  // if a duplicate was found which is not the current object mark input as invalid
  if (gestureObject && gestureObject !== currentlyActiveGestureObject) {
    let commandName = browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
    if (gestureObject.label) commandName = `${gestureObject.label} (${commandName})`;
    this.setCustomValidity(browser.i18n.getMessage('gesturePopupDirectionsNotificationDuplicate', commandName));
  }
  else {
    this.setCustomValidity("");
  }
}


/**
 * Dispatches all submit event listeners
 * Constructs and passes the selected gesture object
 **/
function submitGesture (event) {
  event.preventDefault();
  // create gesture object
  const gestureObject = {
    gesture: gestureDirectionsInput.value
  };
  // add command data
  Object.assign(gestureObject, selectedCommand);
  // add label if not empty
  if (gestureLabelInput.validity.valid && gestureLabelInput.value) {
    gestureObject.label = gestureLabelInput.value;
  }

  // dispatch all listeners
  gestureSubmitEventHandler.forEach((callback) => callback(gestureObject));
}


/**
 * Dispatches all cancel event listeners
 **/
function cancelGesture () {
  gestureCancelEventHandler.forEach((callback) => callback());
}
