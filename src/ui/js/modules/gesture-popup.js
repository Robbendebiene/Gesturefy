'use strict'
/*
import * as mouseGestureDetector from '/lib/modules/mouse-gesture-detector.js';

mouseGestureDetector.addEventListener("update", (e) => {
  console.log("update",e);
});
mouseGestureDetector.addEventListener("change", (e,d) => {
  console.log("change",e,d);
});
function xyz (e,d) {
  console.log("end",e,d);
}
mouseGestureDetector.addEventListener("end", xyz);
mouseGestureDetector.configuration.mouseButton = "2";
console.log(mouseGestureDetector, mouseGestureDetector.configuration.mouseButton);

mouseGestureDetector.enable();
*/



/**
 * GesturePopup "singleton" class using the module pattern
 * The module needs to be initialized once before using
 * ## ############required parameters are an array of commands and a document fragment containing the command settings
 * ############ #provides an "onSelect" and "onCancel" event, an event listener can be registered via onEvent(callback)
 * REQUIRES: gesture-popup.css
 **/
const GesturePopup = (function() {



  const module = {};

// private variables

  // get root document
  const document = window.top.document;

  // hold certain node references for later use
  let popup,
      popupHeading,
      commandButton, gestureDirectionsInput, gestureLabelInput,
      saveButton;

  // holds the selected command
  let selectedCommand = null;

  // contains all existing gestures
  let gestureMap;

  // holds custom event handlers
  const commandSelectEventHandler = [];
  const gestureSubmitEventHandler = [];
  const gestureCancelEventHandler = [];

// public methods

  /**
   * Initializes the module
   * gestures = map of json formatted gestures
   **/
  module.init = function init (gestures) {
    gestureMap = gestures;
    // build the html structure
    build();
  };

  /**
   * Add onCommandSelect event handlers
   **/
  module.onCommandSelect = function onCommandSelect (handler) {
    commandSelectEventHandler.push(handler);
  }


  /**
   * Add onSubmit event handlers
   **/
  module.onSubmit = function onSubmit (handler) {
    gestureSubmitEventHandler.push(handler);
  }


  /**
   * Add onCancel event handlers
   **/
  module.onCancel = function onCancel (handler) {
    gestureCancelEventHandler.push(handler);
  }


  /**
   * Add the message event listener
   **/
  module.open = function open (gestureObject) {
    if (!document.body.contains(popup)) {
      if (gestureObject) {
        popupHeading.textContent = "New Gesture";
        commandButton.title = browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
        gestureDirectionsInput.value = gestureObject.gesture;
        gestureLabelInput.placeholder = commandButton.title;
        if (gestureObject.label) gestureLabelInput.value = gestureObject.label;
      }
      else {
        popupHeading.textContent = "Edit Gesture";
      }
      popup.classList.add("gp-hide");
      document.body.appendChild(popup);
      // trigger reflow
      popup.offsetHeight;
      popup.classList.replace("gp-hide", "gp-show");
    }
  }


  /**
   * Add the message event listener
   **/
  module.close = function close (rect) {
    if (document.body.contains(popup)) {
      popup.addEventListener("transitionend", () => {
        popup.classList.remove("cb-hide");
        popup.remove();
        // reset input field values
        commandButton.title = gestureDirectionsInput.value = gestureLabelInput.placeholder = gestureLabelInput.value = "";
      }, {once: true});
      popup.classList.replace("gp-show", "gp-hide");
    }

    // reset temporary variables
    selectedCommand = null;

    // clear event handler arrays
    commandSelectEventHandler.length = 0;
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
    popupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleNewGesture');
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
          commandDescription.textContent = "Choose a command that should be assigned to this gesture.";
    commandButton = document.createElement("button");
    commandButton.classList.add("gp-field-input", "gp-command");
    commandButton.type = "button";
    commandButton.onclick = selectCommand;

    commandField.append(commandLabel, commandDescription, commandButton);

    const gesturDirectionsField = document.createElement("label");
          gesturDirectionsField.classList.add("gp-field");
    const gestureDirectionsName = document.createElement("span");
          gestureDirectionsName.classList.add("gp-field-name");
          gestureDirectionsName.textContent = browser.i18n.getMessage('gesturePopupLabelGestureDirections');
    const gestureDirectionsDescription = document.createElement("p");
          gestureDirectionsDescription.classList.add("gp-field-description");
          gestureDirectionsDescription.textContent = "Use the arrow keys mouse directions the gesture";
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
          gestureLabelDescription.textContent = "Assign a custom name that will be shown instead of the command name.";
    gestureLabelInput = document.createElement("input");
    gestureLabelInput.classList.add("gp-field-input", "gp-label");
    gestureLabelInput.maxLength = 100;

    gestureLabelField.append(gestureLabelName, gestureLabelDescription, gestureLabelInput);

    const drawArea = document.createElement("div");
          drawArea.classList.add("gp-draw-area");
          drawArea.title = browser.i18n.getMessage('gesturePopupDrawAreaText');

    saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.classList.add("gp-save-button");
    saveButton.textContent = "Save";

    popupForm.append(commandField, gesturDirectionsField, gestureLabelField, saveButton);

    popupMain.append(popupForm, drawArea);

    popup.append(popupHead, popupMain);
  }


  /**
   * Handles the allowed keys for the gesture directions input field
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
   *
   **/
  function setCommand (commandObject) {
    console.log(commandObject);
    selectedCommand = commandObject;

    commandButton.title = gestureLabelInput.placeholder = browser.i18n.getMessage(`commandLabel${commandObject.command}`);
  }


  /**
   *
   **/
  function setGesture () {

    // write the drawn gesture to the input field

  }


  /**
   * Dispatches all gestureDirectionsChange event listeners
   * Passes the new gesture
   **/
  function onGestureDirectionsInput (x) {
    const gestureObject = gestureMap.get(gestureDirectionsInput.value);
    if (gestureObject) {
      let commandName = browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
      if (gestureObject.label) commandName = `${gestureObject.label} (${commandName})`;
      this.setCustomValidity(`This gesture is already in use by ${commandName}`);
    }
    else {
      this.setCustomValidity("");
    }
  }


  /**
   * Dispatches all commandSelect event listeners
   * Passes the setCommand function to set the command from external code
   **/
  function selectCommand () {
    commandSelectEventHandler.forEach((callback) => callback(setCommand));
  }

  /**
   * Dispatches all submit event listeners
   * Passes the selected gesture object
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

  return module;
})();
