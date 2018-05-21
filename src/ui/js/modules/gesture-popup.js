'use strict'




// -------------------


/*
für jede geste ein gesture objekt erstellen und in einem array oder map speichern

update funktion, aktualisiert den inhalt (auch deas json speiher objekt)

delte function (removed alle event listener und this objekte auf null setzen)

*/
*
/**
 * settingNameDistanceThreshold
 *
 * settingNameDistanceThresholdas
 * saveData
 *
 *
 *
 *
 */



function onGestureInputKeypress (event) {
  // ignore these keys
  if (event.key === "Backspace" || event.key === "Delete" || event.ctrlKey || event.altKey) return;

  const allowedKeys = ["u", "r", "d", "l", "U", "R", "D", "L"];

  const arrowKeyMapping = {
    "ArrowUp": "U",
    "ArrowRight": "R",
    "ArrowDown": "D",
    "ArrowLeft": "L"
  }

  // prevent disallowed keys
  if (!allowedKeys.includes(event.key)) {
    event.preventDefault();
  }
  // replace arrow keys with direction code
  if (event.key in arrowKeyMapping) {
    const cursorIndex = selectionStart;
    value = value.slice(0, cursorIndex) + arrowKeyMapping[event.key] + value.slice(cursorIndex);
    selectionStart = selectionEnd = cursorIndex + 1;
  }
}





// info icon in gesture code und label input feld (in das input feld ganz rechts)


const GesturePopup = (function() {

  const module = {};

// private variables

  // get root document
  const document = window.top.document;

  // hold certain node references for later use
  let popup,
      commandInput, gestureCodeInput, gestureLabelInput;

  // holds the selected command for the settings page
  let selectedCommand = null;

  const commandSelectEventHandler = [];
  const gestureSubmitEventHandler = [];

// public methods


  /**
   * Initializes the module
   * commands = array of json formatted commands
   * settings = document fragment containing a template per command setting
   **/
  module.init = function init () {

    // build the html structure
    build();
  };

  /**
   *
   **/
  module.onCommandSelect = function onCommandSelect (handler) {
    commandSelectEventHandler.push(handler);
  }



  /**
   * Add the message event listener
   **/
  module.onSubmit = function onSubmit (handler) {
    gestureSubmitEventHandler.push(handler);
  }


  /**
   * Add the message event listener
   **/
  module.open = function open (gestureObject) {
    if (!document.body.contains(popup)) {
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
    console.log("test");

    if (document.body.contains(popup)) {
      popup.addEventListener("transitionend", () => {
        popup.classList.remove("cb-hide");
        popup.remove();
      }, {once: true});
      popup.classList.replace("gp-show", "gp-hide");
    }

    // reset temporary variables
    selectedCommand = null;

    // clear event handler array
    commandSelectEventHandler.length = 0;
    gestureSubmitEventHandler.length = 0;
  }

// private methods

  /**
   * Add the message event listener
   **/
  function build () {
    // create dom nodes
    popup = document.createElement("div");
    popup.classList.add("gesture-popup");

    const gestureCommandField = document.createElement("form");
          gestureCommandField.classList.add("gp-field");

    commandInput = document.createElement("input");
    commandInput.classList.add("gp-field-input");
    commandInput.placeholder = "No command selected, select on to the right";
    commandInput.required = true;
    const commandSelectButton = document.createElement("button");
          commandSelectButton.classList.add("gp-command-select-button");
          commandSelectButton.textContent = "Select";
          commandSelectButton.onclick = handleCommandSelect;
    gestureCommandField.append(commandInput, commandSelectButton);

    const drawArea = document.createElement("div");
          drawArea.classList.add("gp-draw-area");

    const fieldContainer = document.createElement("div");
          fieldContainer.classList.add("gp-field-container");

    const gestureCodeField = document.createElement("form");
          gestureCodeField.classList.add("gp-field");
    const gestureCodeText = document.createElement("label");
          gestureCodeText.classList.add("gp-field-label");
          gestureCodeText.htmlFor = "GesturePopupCodeInput";
          gestureCodeText.textContent = "Code:";
    gestureCodeInput = document.createElement("input");
    gestureCodeInput.classList.add("gp-field-input", "code");
    gestureCodeInput.id = "GesturePopupCodeInput";
    gestureCodeInput.pattern = "(\\b(?:([UDRLudrl])(?!\\2{1}))+\\b)";
    gestureCodeInput.required = true;
    gestureCodeInput.placeholder = "No Gesture yet";

    gestureCodeField.append(gestureCodeText, gestureCodeInput);

    const gestureLabelField = document.createElement("form");
          gestureLabelField.classList.add("gp-field");
    const gestureLabelText = document.createElement("label");
          gestureLabelText.classList.add("gp-field-label");
          gestureLabelText.htmlFor = "GesturePopupLabelInput";
          gestureLabelText.textContent = "Label:";
    gestureLabelInput = document.createElement("input");
    gestureLabelInput.classList.add("gp-field-input", "label");
    gestureLabelInput.id = "GesturePopupLabelInput";
    gestureLabelInput.maxLength = 100;

    gestureLabelField.append(gestureLabelText, gestureLabelInput);

    const saveButton = document.createElement("button");
          saveButton.classList.add("gp-save-button");
          saveButton.textContent = "Save";
          saveButton.onclick = submitGesture;
    fieldContainer.append(gestureCodeField, gestureLabelField, saveButton);

    popup.append(gestureCommandField, drawArea, fieldContainer);
  }

  function setCommand (commandObject) {
    console.log("test");
    selectedCommand = commandObject;

    commandInput.value = browser.i18n.getMessage(`commandName${commandObject.command}`);

    gestureLabelInput.placeholder = browser.i18n.getMessage(`commandName${commandObject.command}`);
  }

  function setGesture () {
    console.log("test2");

  }

  function submitGesture () {
    if (!gestureCodeInput.validity.valid) {
      console.log("error1");
      return;
    }

    if (!commandInput.validity.valid) {
      console.log("error2");
      return;
    }

    // create gesture object
    const gestureObject = {
      gesture: gestureCodeInput.value
    };
    // add command data
    Object.assign(gestureObject, selectedCommand);

    // add label if not empty
    if (gestureLabelInput.validity.valid && gestureLabelInput.value) {
      gestureObject.label = gestureLabelInput.value;
    }

    gestureSubmitEventHandler.forEach((callback) => callback(gestureObject));
    console.log(gestureObject);
  }

  /**
   * Add all commands in the commands panel
   **/
  function handleCommandSelect () {
    commandSelectEventHandler.forEach((callback) => callback(setCommand));
  }

  return module;
})();
