'use strict'

/**
 * Get manifest object
 **/
const Manifest = chrome.runtime.getManifest();


/**
 * Get background page window object (Core)
 * and the current addon configuration
 * run main script afterwards
 **/
let Config, Core;

chrome.runtime.getBackgroundPage((object) => {
  Config = object.Config;
  Core = object;
  main();
});


function main () {

  // get menu sections
  const SettingsSection = document.getElementById('Settings'),
        GestureSection = document.getElementById('Gestures'),
        AboutSection = document.getElementById('About');

  // insert text from manifest
  let textElements = document.querySelectorAll('[data-manifest]');
  for (let element of textElements) {
    element.textContent = Manifest[element.dataset.manifest];
  }
  // insert text from language files
  textElements = document.querySelectorAll('[data-i18n]');
  for (let element of textElements) {
    element.textContent = browser.i18n.getMessage(element.dataset.i18n);
  }

  // apply values to toggle buttons and add their event function
  let toggleButtons = SettingsSection.getElementsByClassName("toggleButton");
      for (let button of toggleButtons) {
        button.checked = Config.Display[button.dataset.group][button.name];
        button.onchange = onToggleButton;
      }
  // apply values to input fields and add their event function
  let inputFields = SettingsSection.querySelectorAll(".colorField, .selectField, .valueField");
      for (let field of inputFields) {
        field.value = Config.Display[field.dataset.group].style[field.name];
        field.onchange = onInputField;
      }
  // apply values to gesture input fields and add their event function
  let gestureFields = GestureSection.getElementsByClassName("gestureInput");
      for (let field of gestureFields) {
        field.gesture.oninput = onGestureInput;
        field.gesture.onkeypress = onGestureInputKeypress;
        field.gesture.value = Config.Actions[field.name];
        field.record.onchange = onRecordButton;
      }
  // add the event function to all record buttons
  let recordButtons = GestureSection.getElementsByClassName("recordButton");
      for (let button of recordButtons) button.onclick = onRecordButton;


  // create overlay
  let overlay = document.createElement('div');
      overlay.classList.add('overlay');
  // add overlay recording border
  let recordBorder = document.createElement('div');
      recordBorder.classList.add('overlayBorderLeft');
      overlay.appendChild(recordBorder);
      recordBorder = document.createElement('div');
      recordBorder.classList.add('overlayBorderRight');
      overlay.appendChild(recordBorder);
  let cancelRecordButton = document.createElement('button');
      cancelRecordButton.textContent = browser.i18n.getMessage("recordCancelButton");
      cancelRecordButton.classList.add('cancelRecordButton');
      overlay.appendChild(cancelRecordButton);
      cancelRecordButton.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(canvas);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        tabGesture.disable();
      }

  /**
   * create the canvas for the gesture handler
   * style its contextStyle
   * create the gesture handler with its methods
   **/
  let canvas = document.createElement("canvas");
      canvas.style = "position: fixed; top: 0; left: 0; z-index: 9999999;";
  let context = canvas.getContext('2d');
  let contextStyle =	{
  	lineCap: "round",
  	lineJoin: "round",
    lineWidth: 10,
  	globalAlpha: 0.1
  };

  // resize canvas on window resize
  window.addEventListener('resize', adjustCanvasToMaxSize, true);

  function adjustCanvasToMaxSize () {
  	canvas.width = window.innerWidth;
  	canvas.height = window.innerHeight;
  	// reset all style properties becuase they get cleared on canvas resize
    canvas.style.opacity = Config.Display.Gesture.style.opacity;
  	Object.assign(context, contextStyle, {
			lineWidth: Config.Display.Gesture.style.lineWidth,
			strokeStyle: Config.Display.Gesture.style.strokeStyle
    });
  }
  adjustCanvasToMaxSize();

  let tabGesture = new GestureHandler();
      tabGesture.onStart = function (x, y) {
    		document.body.appendChild(canvas);
    		context.beginPath();
    		context.moveTo(x, y);
      }
      tabGesture.onUpdate = function (x, y) {
      	if (document.body.contains(canvas)) {
      		context.lineTo(x, y);
      		context.stroke();
      	}
      }


  /**
   * style gesture and append overlay on record button click
   * define "on getsure end" function
   **/
  function onRecordButton () {
    // adjust options gesture style
    adjustCanvasToMaxSize();

    document.body.appendChild(overlay);

    tabGesture.onEnd = (directions) => {
      document.body.removeChild(overlay);
      document.body.removeChild(canvas);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      this.form.gesture.value = directions.join("");
      this.form.gesture.oninput();
      tabGesture.disable();
    }
    tabGesture.enable();
  }


  /**
   * save toggle button state
   **/
  function onToggleButton () {
    Config.Display[this.dataset.group][this.name] = this.checked;
  }


  /**
   * save value if valid
   **/
  function onInputField () {
    if (this.validity.valid)
      Config.Display[this.dataset.group].style[this.name] = this.value;
  }


  /**
   * filter gesture input keys
   * only udrl, UDRL dlete and arrow keys are allowed
   * prevent same direction twice in a row
   **/
  function onGestureInputKeypress (event) {
    let lastLetter = this.value.toUpperCase()[this.value.length - 1],
        regex = /^[UDRL]+$/i;
    if (!regex.test(event.key)) {
      if (["Backspace", "ArrowRight", "ArrowLeft", "Delete"].indexOf(event.key) === -1 && !event.ctrlKey)
        event.preventDefault();
    }
    else if (lastLetter === event.key.toUpperCase()) {
      event.preventDefault();
    }
  }


  /**
   * validate the gesture and save it
   * add custom validation message if gesture already exists
   **/
  function onGestureInput () {
    let gesture, action, existingAction;

    // validation function
    function isValid (input) {
      gesture = input.value.toUpperCase();
      action = input.form.name;
      existingAction = Core.getActionByGesture(gesture);

      // gesture is valid if there is no other action with the same gesture or the gesture is empty
      if (existingAction === null || existingAction === action || gesture === "") {
        return true;
      }
      return false;
    }

    // check if current input is valid
    if (isValid(this)) {
      Config.Actions[action] = gesture;
      this.setCustomValidity('');
    }
    else this.setCustomValidity(
      browser.i18n.getMessage(
        'gestureInputNotificationInUse',
        browser.i18n.getMessage('actionName' + existingAction)
      )
    );

    // check if there are other invalid inputs which may get valid when this input changes
    let invalidInputs = document.querySelectorAll(".gestureInput > input:invalid");
    for (let input of invalidInputs) {
      if (isValid(input)) {
        Config.Actions[action] = gesture;
        input.setCustomValidity('');
      }
    }
  }


  /**
   * on tab close or url change or refresh save data to storage
   * also propagate the new settings to all tabs
   **/
  window.onblur = () => {
    Core.saveData(Config);
    Core.propagateData({Display: Config.Display});
  }
}


/**
 * set default start section
 * adjust tab title and navigation highlighting on section change
 **/
window.onhashchange = function () {
  let activeEntry = document.querySelector('#Sidebar > ul > li[data-active]');
  if (activeEntry !== null) delete activeEntry.dataset.active;

  let entryLink = document.querySelector('#Sidebar > ul > li > a[href="'+ window.location.hash +'"]');
  if (entryLink !== null) entryLink.parentNode.dataset.active = "";

  document.title = "Gesturefy - " + window.location.hash.slice(1);
}

if (window.location.hash === "") window.location.hash = '#Settings';
else window.onhashchange();
