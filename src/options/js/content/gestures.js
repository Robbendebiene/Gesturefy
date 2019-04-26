import { ContentLoaded, Config } from "/options/js/index.js";

import MouseGestureController from "/core/modules/mouse-gesture-controller.js";

ContentLoaded.then(main);

// reference to the curently active gesture list item
let currentItem = null;

/**
 * main function
 * run code that depends on async resources
 **/
function main (values) {
  // add event listeners
  const gesturePopup = document.getElementById("gesturePopup");
        gesturePopup.onclose = onGesturePopupClose;
  const gesturePopupForm = document.getElementById("gesturePopupForm");
        gesturePopupForm.onsubmit = onGesturePopupFormSubmit;
  const gesturePopupCommandSelect = document.getElementById("gesturePopupCommandSelect")
        gesturePopupCommandSelect.onchange = onCommandSelectChange;
  const gesturePopupDirectionsInput = document.getElementById("gesturePopupDirectionsInput");
        gesturePopupDirectionsInput.onkeydown = onGestureDirectionsKeydown;
        gesturePopupDirectionsInput.oninput = onGestureDirectionsInput;
        gesturePopupDirectionsInput.onpaste = event => event.preventDefault();
        gesturePopupDirectionsInput.onkeypress = event => event.preventDefault();
  const newGestureButton = document.getElementById('gestureAddButton');
        newGestureButton.onclick = onAddButtonClick;
  // create and add all existing gesture items
  const fragment = document.createDocumentFragment();
  for (let gestureObject of Config.get("Gestures")) {
    fragment.appendChild( createGestureListItem(gestureObject) );
  }
  const gestureList = document.getElementById("gestureContainer");
        gestureList.appendChild(fragment);
  // add mouse gesture controller event listeners
  mouseGestureControllerSetup();
}


/**
 * Opens the gesture popup and fills in the given values if any
 **/
function openGesturePopup (gestureObject) {
  const gesturePopupHeading = document.getElementById("gesturePopupHeading");
  const gesturePopupCommandSelect = document.getElementById("gesturePopupCommandSelect");
  const gesturePopupDirectionsInput = document.getElementById("gesturePopupDirectionsInput");
  const gesturePopupLabelInput = document.getElementById("gesturePopupLabelInput");
  // reset gesture popup
  gesturePopupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleNewGesture');
  gesturePopupCommandSelect.value = null;
  gesturePopupDirectionsInput.value = "";
  gesturePopupDirectionsInput.setCustomValidity("");
  gesturePopupLabelInput.value = "";
  gesturePopupLabelInput.placeholder = "";
  // fill current values if any
  if (gestureObject) {
    gesturePopupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleEditGesture');

    const commandObject = { command: gestureObject.command };
    if (gestureObject.settings) commandObject.settings = gestureObject.settings;
    gesturePopupCommandSelect.value = commandObject;

    gesturePopupDirectionsInput.value = gestureObject.gesture;
    gesturePopupLabelInput.placeholder = browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
    if (gestureObject.label) gesturePopupLabelInput.value = gestureObject.label;
  }
  // setup drawing area
  const currentUserMouseButton = Config.get("Settings.Gesture.mouseButton");
  const mouseButtonLabelMap = {
    1: 'gesturePopupMouseButtonLeft',
    2: 'gesturePopupMouseButtonRight',
    4: 'gesturePopupMouseButtonMiddle'
  }
  const gesturePopupRecordingArea = document.getElementById("gesturePopupRecordingArea");
        gesturePopupRecordingArea.title = browser.i18n.getMessage(
          'gesturePopupRecordingAreaText',
          browser.i18n.getMessage(mouseButtonLabelMap[currentUserMouseButton])
        );
  MouseGestureController.mouseButton = currentUserMouseButton;
  MouseGestureController.enable();
  // open popup
  const gesturePopup = document.getElementById("gesturePopup");
        gesturePopup.open = true;
}


/**
 * Creates a gesture list item html element by a given gestureObject and returns it
 **/
function createGestureListItem (gestureObject) {
  const gestureListItem = document.createElement("li");
        gestureListItem.classList.add("gl-item");
        gestureListItem.dataset.gesture = gestureObject.gesture;
        gestureListItem.onclick = onItemClick;
  const commandField = document.createElement("div");
        commandField.classList.add("gl-command");
        commandField.textContent = gestureObject.label || browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
  const gestureField = document.createElement("div");
        gestureField.classList.add("gl-gesture");
        gestureField.textContent = gestureObject.gesture;
  const removeButton = document.createElement("button");
        removeButton.classList.add("gl-remove-button", "icon-delete");
  gestureListItem.append(commandField, gestureField, removeButton);
  return gestureListItem;
}


/**
 * Adds a given gesture list item to the gesture list ui
 **/
function addGestureListItem (gestureListItem) {
  const gestureList = document.getElementById("gestureContainer");
  // append item, hide it and move it out of flow to calculate its dimensions
  gestureList.prepend(gestureListItem);
  gestureListItem.style.setProperty('visibility', 'hidden');
  gestureListItem.style.setProperty('position', 'absolute');
  // calculate total entry height
  const computedStyle = window.getComputedStyle(gestureListItem);
  const outerHeight = parseInt(computedStyle.marginTop) + gestureListItem.offsetHeight + parseInt(computedStyle.marginBottom);

  // move all entries up by one entry excluding the new one
  for (const node of gestureList.children) {
    if (node !== gestureListItem) {
      node.style.setProperty('transform', `translateY(-${outerHeight}px)`);
      // remove ongoing transitions if existing
      node.style.removeProperty('transition');
    }
  }
  // show new entry and bring it back to flow, which pushes all elements down by the height of one entry
  gestureListItem.style.removeProperty('visibility', 'hidden');
  gestureListItem.style.removeProperty('position', 'absolute');

  // trigger reflow
  gestureList.offsetHeight;

  gestureListItem.addEventListener('animationend', (event) => {
    event.currentTarget.classList.remove('gl-item-animate-add');
  }, {once: true });
  gestureListItem.classList.add('gl-item-animate-add');

  // move all entries down excluding the new one
  for (const node of gestureList.children) {
    if (node !== gestureListItem) {
      node.addEventListener('transitionend', (event) => event.currentTarget.style.removeProperty('transition'), {once: true });
      node.style.setProperty('transition', 'transform 0.3s');
      node.style.removeProperty('transform');
    }
  }
}


/**
 * Updates a given gesture list item ui by the provided gestureObject
 **/
function updateGestureListItem (gestureListItem, gestureObject) {
  // add popout animation for the updated gesture list item
  gestureListItem.addEventListener("animationend", () => {
    gestureListItem.classList.remove("gl-item-animate-update");
  }, { once: true });
  gestureListItem.classList.add("gl-item-animate-update");

  const commandField = gestureListItem.querySelector(".gl-command");
  const gestureField = gestureListItem.querySelector(".gl-gesture");
  gestureListItem.dataset.gesture = gestureObject.gesture;
  commandField.textContent = gestureObject.label || browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
  gestureField.textContent = gestureObject.gesture;
}


/**
 * Removes a given gesture list item from the gesture list ui
 **/
function removeGestureListItem (gestureListItem) {
  const computedStyle = window.getComputedStyle(gestureListItem);
  const outerHeight = parseInt(computedStyle.marginTop) + gestureListItem.offsetHeight + parseInt(computedStyle.marginBottom);

  let node = gestureListItem.nextElementSibling;
  while (node) {
    node.addEventListener('transitionend', (event) => {
      event.currentTarget.style.removeProperty('transition');
      event.currentTarget.style.removeProperty('transform');
    }, {once: true });
    node.style.setProperty('transition', 'transform 0.3s');
    node.style.setProperty('transform', `translateY(-${outerHeight}px)`);
    node = node.nextElementSibling;
  }
  gestureListItem.addEventListener('animationend', (event) => event.currentTarget.remove(), {once: true });
  gestureListItem.classList.add('bl-entry-animate-remove');
}


/**
 * Handles the gesture item click
 * Calls the remove gesture list item function on remove button click and removes it from the config
 * Otherwise opens the clicked gesture item in the gesture popup
 **/
function onItemClick (event) {
  const gestures = Config.get("Gestures");
  // if delete button received the click
  if (event.target.classList.contains('gl-remove-button')) {
    removeGestureListItem(this);
    // remove gesture object from array
    const index = gestures.findIndex((element) => element.gesture === this.dataset.gesture);
    gestures.splice(index, 1);
    Config.set("Gestures", gestures);
  }
  else {
    // open gesture popup and hold reference to current item
    currentItem = this;
    // get gesture object from array
    const gestureObject = gestures.find((element) => element.gesture === this.dataset.gesture);
    openGesturePopup(gestureObject);
  }
}


/**
 * Handles the new gesture button click and opens the empty gesture popup
 **/
function onAddButtonClick (event) {
  currentItem = null;
  openGesturePopup();
}


/**
 * Handles the gesture popup command select change and adjusts the label input placeholder based on its current value
 **/
function onCommandSelectChange (event) {
  const gesturePopupLabelInput = document.getElementById("gesturePopupLabelInput");
        gesturePopupLabelInput.placeholder = browser.i18n.getMessage(`commandLabel${this.value.command}`);
}


/**
 * Handles the gesture popup gesture input and converts arrow keys to UDRL
 **/
function onGestureDirectionsKeydown (event) {
  const arrowKeyMapping = {
    "ArrowUp": "U",
    "ArrowRight": "R",
    "ArrowDown": "D",
    "ArrowLeft": "L"
  };
  // convert arrow keys to direction code
  const directionCode = arrowKeyMapping[event.key];

  if (directionCode) {
    // prevent key actions
    event.preventDefault();
    // get precding and following char / direction
    const precedingDirectionCode = this.value.slice(this.selectionStart - 1, this.selectionStart);
    const followingDirectionCode = this.value.slice(this.selectionEnd, this.selectionEnd + 1);
    // prevent direction doublings
    if (precedingDirectionCode !== directionCode && followingDirectionCode !== directionCode) {
      const cursorPosition = this.selectionStart;
      this.value = this.value.slice(0, this.selectionStart) + arrowKeyMapping[event.key] + this.value.slice(this.selectionEnd);
      this.selectionStart = this.selectionEnd = cursorPosition + 1;
      // dipatch input event manually
      event.currentTarget.dispatchEvent(new Event('input'));
    }
  }
}


/**
 * Verifies the gesture directions input and marks the field as invalid if the current combination of directions already exists
 **/
function onGestureDirectionsInput () {
  // detect if the gesture is already in use / a duplicate
  const gestureObject = Config.get("Gestures").find((element) => element.gesture === this.value);
  // if a duplicate was found which is not the current item mark input as invalid
  if (gestureObject && (!currentItem || this.value !== currentItem.dataset.gesture)) {
    let commandName = browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
    if (gestureObject.label) commandName = `${gestureObject.label} (${commandName})`;
    this.setCustomValidity(browser.i18n.getMessage('gesturePopupDirectionsNotificationDuplicate', commandName));
  }
  else {
    this.setCustomValidity("");
  }
}


/**
 * Gathers and saves the specified settings data from the input elements and closes the coommand bar
 **/
function onGesturePopupFormSubmit (event) {
  // prevent page reload
  event.preventDefault();
  // exit function if command select is empty
  const gesturePopupCommandSelect = document.getElementById("gesturePopupCommandSelect");
  if (!gesturePopupCommandSelect.value) return;
  // construct gesture object
  const gestureObject = gesturePopupCommandSelect.value;
        gestureObject.gesture = this.elements.gesturePopupDirectionsInput.value;
  // add label if not empty
  if (this.elements.gesturePopupLabelInput.validity.valid && this.elements.gesturePopupLabelInput.value) {
    gestureObject.label = this.elements.gesturePopupLabelInput.value;
  }

  // if no item is active create a new one
  if (!currentItem) {
    // store new gesture
    const gestures = Config.get("Gestures");
          gestures.unshift(gestureObject);
    Config.set("Gestures", gestures);
    const gestureListItem = createGestureListItem(gestureObject);
    addGestureListItem(gestureListItem);
  }
  else {
    // update gesture list item
    const gestures = Config.get("Gestures");
    const index = gestures.findIndex((element) => element.gesture === currentItem.dataset.gesture);
    gestures[index] = gestureObject;
    Config.set("Gestures", gestures);
    updateGestureListItem(currentItem, gestureObject);
  }

  const gesturePopup = document.getElementById("gesturePopup");
        gesturePopup.open = false;
}


/**
 * Disables the mouse gesture controller when the popup closes
 **/
function onGesturePopupClose () {
  MouseGestureController.disable();
}


/**
 * Adds necessary event listeners to the mouse gesture controller
 **/
function mouseGestureControllerSetup () {
  const gesturePopupDirectionsInput = document.getElementById("gesturePopupDirectionsInput");
  const gesturePopupCanvas = document.getElementById("gesturePopupCanvas");
  const canvasContext = gesturePopupCanvas.getContext("2d");

  // detect if the gesture started on the canvas element and draw the beginning of the trace
  MouseGestureController.addEventListener("start", (events) => {
    if (events[0].target !== gesturePopupCanvas) {
      // cancel gesture and event handler if the first click was not within the recording area
      MouseGestureController.cancel();
      return;
    }

    // initialize canvas properties (correct width and height are only known after the popup has been opened)
    gesturePopupCanvas.width = gesturePopupCanvas.offsetWidth;
    gesturePopupCanvas.height = gesturePopupCanvas.offsetHeight;
    canvasContext.lineCap = "round";
    canvasContext.lineJoin = "round";
    canvasContext.lineWidth = 10;
    canvasContext.strokeStyle = "#00aaa0";

    // get first event and remove it from the array
    const firstEvent = events.shift();
    const lastEvent = events[events.length - 1] || firstEvent;
    // translate the canvas coordiantes by the position of the canvas element
    const clientRect = gesturePopupCanvas.getBoundingClientRect();
    canvasContext.setTransform(1, 0, 0, 1, -clientRect.x, -clientRect.y);
    // draw all occurred events
    canvasContext.beginPath();
    canvasContext.moveTo(
      firstEvent.screenX - window.mozInnerScreenX,
      firstEvent.screenY - window.mozInnerScreenY
    );
    for (let event of events) canvasContext.lineTo(
      event.screenX - window.mozInnerScreenX,
      event.screenY - window.mozInnerScreenY
    );
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(
      lastEvent.screenX - window.mozInnerScreenX,
      lastEvent.screenY - window.mozInnerScreenY
    );
  });

  // draw gesture trace
  MouseGestureController.addEventListener("update", (events) => {
    const lastEvent = events[events.length - 1];
    for (let event of events) canvasContext.lineTo(
      event.screenX - window.mozInnerScreenX,
      event.screenY - window.mozInnerScreenY
    );
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(
      lastEvent.screenX - window.mozInnerScreenX,
      lastEvent.screenY - window.mozInnerScreenY
    );
  });

  // update directions input
  MouseGestureController.addEventListener("change", (events, directions) => {
    gesturePopupDirectionsInput.value = directions.join("");
    // dipatch input event manually
    gesturePopupDirectionsInput.dispatchEvent(new Event('input'));
  });

  // clear canvas
  MouseGestureController.addEventListener("end", () => {
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.clearRect(0, 0, gesturePopupCanvas.width, gesturePopupCanvas.height);
  });
}