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
  if (object) {
    Config = object.Config;
    Core = object;
    main();
  }
  // open new window in none-incognito mode as a workaround, see this issue: https://github.com/Robbendebiene/Gesturefy/issues/35
  else chrome.tabs.getCurrent((tab) => {
    chrome.windows.create({
      url: tab.url,
      incognito: false
    });
    chrome.tabs.remove(tab.id);
  })

  /** Back When setting is pressed,
   * the background page is displayed,
   * so the return operation was prohibited.
   * */
  history.pushState(null, null, null);
  window.addEventListener("popstate", function() {
      history.pushState(null, null, null);
  });
});


/**
 * set default start section
 * adjust tab title and navigation highlighting on section change
 **/
window.onhashchange = function () {
  let activeEntry = document.querySelector('#Sidebar > ul > li[data-active]');
  if (activeEntry !== null) delete activeEntry.dataset.active;

  let entryLink = document.querySelector('#Sidebar > ul > li > a[href="'+ window.location.hash +'"]');
  if (entryLink !== null) entryLink.parentNode.dataset.active = "";

  const hash  = window.location.hash.slice(1);
  const sectionName = browser.i18n.getMessage(`navigation${hash}`) || hash;
  document.title = `Gesturefy - ${decodeHtml(sectionName)}`;
}

if (window.location.hash === "") window.location.hash = '#Settings';
else window.onhashchange();


// -- MAIN CODE -- \\

function main () {

  // get menu sections
  const SettingsSection = document.getElementById('Settings'),
        GesturesSection = document.getElementById('Gestures'),
        ExtrasSection = document.getElementById('Extras'),
        AboutSection = document.getElementById('About');

  // insert text from manifest
  let textElements = document.querySelectorAll('[data-manifest]');
      for (let element of textElements) {
        element.textContent = Manifest[element.dataset.manifest];
      }
  // insert text from language files (innerHTML for entities)
  textElements = document.querySelectorAll('[data-i18n]');
      for (let element of textElements) {
        element.innerHTML = browser.i18n.getMessage(element.dataset.i18n);
      }

  // apply values to toggle buttons and add their event function
  let toggleButtons = document.getElementsByClassName("toggleButton");
      for (let button of toggleButtons) {
        // get property from object hierarchy https://stackoverflow.com/a/33397682/3771196
        button.checked = button.dataset.hierarchy.split('.').reduce((o,i) => o[i], Config.Settings)[button.name];
        button.onchange = onToggleButton;
      }

  // add the actions as options to all empty select fields
  let selectFields = ExtrasSection.querySelectorAll(".selectField:empty");
      for (let field of selectFields) {
        // append all actions
        for (let action in Config.Actions) {
          field.appendChild(
            new Option(
              browser.i18n.getMessage('actionName' + action),
              action
            )
          );
        }
      }

  // apply values to input fields and add their event function
  let inputFields = document.querySelectorAll(".colorField, .selectField, .valueField");
      for (let field of inputFields) {
        // get property from object hierarchy https://stackoverflow.com/a/33397682/3771196
        field.value = field.dataset.hierarchy.split('.').reduce((o,i) => o[i], Config.Settings)[field.name];
        field.onchange = onInputField;
      }

  // apply values to gesture input fields and add their event function
  let gestureFields = GesturesSection.getElementsByClassName("gestureInput");
      for (let field of gestureFields) {
        field.gesture.oninput = onGestureInput;
        field.gesture.onkeypress = onGestureInputKeypress;
        field.gesture.value = Config.Actions[field.name];
        field.record.onchange = onRecordButton;
      }
  // add the event function to all record buttons
  let recordButtons = GesturesSection.getElementsByClassName("recordButton");
      for (let button of recordButtons) button.onclick = onRecordButton;

  // toggle collapsables and add their event function
  let collapseButtons = document.querySelectorAll("[data-collapse]");
      for (let button of collapseButtons) {
        button.addEventListener('change', onCollapseButton);
        onCollapseButton.call(button);
      }

  // data management buttons
  let resetButton = document.getElementById("resetButton");
      resetButton.onclick = onResetButton;
  let backupButton = document.getElementById("backupButton");
      backupButton.onclick = onBackupButton;
  let restoreButton = document.getElementById("restoreButton");
      restoreButton.onchange = onRestoreButton;

  /**
   * on tab close or url change or refresh save data to storage
   * also propagate the new settings to all tabs
   **/
  window.onblur = () => {
    Core.saveData(Config);
    Core.propagateData({
      subject: "settingsChange",
      data: Config.Settings
    });
  }
}


// -- GESTURE RECORDER -- \\

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
// add overlay cancel button
let cancelRecordButton = document.createElement('button');
    cancelRecordButton.textContent = browser.i18n.getMessage("recordCancelButton");
    cancelRecordButton.classList.add('cancelRecordButton', 'overlayButton');
    overlay.appendChild(cancelRecordButton);
    cancelRecordButton.onclick = () => onRecordEnd();
// add overlay clear record button
let clearRecordButton = document.createElement('button');
    clearRecordButton.textContent = browser.i18n.getMessage("recordClearButton");
    clearRecordButton.classList.add('clearRecordButton', 'overlayButton');
    overlay.appendChild(clearRecordButton);
    clearRecordButton.onclick = () => onRecordEnd(null);

/**
 * create the canvas for the gesture handler
 * style its contextStyle
 * create the gesture handler with its methods
 **/
let canvas = document.createElement("canvas");
    overlay.appendChild(canvas);
let context = canvas.getContext('2d');
let contextStyle =	{
  lineCap: "round",
  lineJoin: "round",
  lineWidth: 1,
};

// resize canvas on window resize
window.addEventListener('resize', applyCanvasSettings, true);

GestureHandler
	.on("start", (x, y) => {
    context.beginPath();
    context.moveTo(x, y);
  })
	.on("update", (x, y) => {
    context.lineWidth = Math.min(
			Config.Settings.Gesture.Trace.style.lineWidth,
			context.lineWidth += Config.Settings.Gesture.Trace.style.lineGrowth
		);
		context.lineTo(x, y);
		context.stroke();
		context.closePath();
		context.beginPath();
		context.moveTo(x, y);
  })
  .on("abort", () => {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    // reset trace line width
    context.lineWidth = 1;
  })
  .on("end", onRecordEnd);


/**
 * restyle canvas and adjust its dimensions
 **/
function applyCanvasSettings () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // reset all style properties becuase they get cleared on canvas resize
  canvas.style.opacity = Config.Settings.Gesture.Trace.style.opacity;
  Object.assign(context, contextStyle, {
    strokeStyle: Config.Settings.Gesture.Trace.style.strokeStyle
  });
}


// -- FUNCTIONS -- \\

/**
 * style gesture and append overlay on record button click
 **/
function onRecordButton () {
  // save action name as reference
  overlay.dataset.action = this.form.name;
  applyCanvasSettings();
  GestureHandler.applySettings(Config.Settings);
  document.body.appendChild(overlay);
  GestureHandler.enable();
}


/**
 * remove and reset overlay
 * save directions to gesture input if specified
 **/
function onRecordEnd (directions) {
  let form = document.querySelector(`.gestureInput[name=${overlay.dataset.action}]`);
  if (directions === null) {
    form.gesture.value = "";
    form.gesture.oninput();
  }
  else if (Array.isArray(directions) && directions.length) {
    form.gesture.value = directions.join('');
    form.gesture.oninput();
  }
  delete overlay.dataset.action;
  document.body.removeChild(overlay);
  GestureHandler.disable();
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  // reset trace line width
  context.lineWidth = 1;
}


/**
 * save toggle button state
 **/
function onToggleButton () {
  // set property to given object hierarchy https://stackoverflow.com/a/33397682/3771196
  this.dataset.hierarchy.split('.').reduce((o,i) => o[i], Config.Settings)[this.name] = this.checked;
}


/**
 * save value if valid
 **/
function onInputField () {
  if (this.validity.valid) {
    // get value either as string or number
    let value = this.valueAsNumber ? this.valueAsNumber : this.value;
    // set property to given object hierarchy https://stackoverflow.com/a/33397682/3771196
    this.dataset.hierarchy.split('.').reduce((o,i) => o[i], Config.Settings)[this.name] = value;
  }
}


/**
 * hide or show on collapse toggle
 **/
function onCollapseButton (event) {
  let element = document.querySelector('.collapsable' + this.dataset.collapse);

  if (element.style.height === "0px" && this.checked)
    element.style.height = element.scrollHeight + "px";
  // if user dispatched the function, then hide with animation, else hide without animation
  else if (!this.checked) {
    if (event) {
      element.style.height = element.scrollHeight + "px";
      // trigger reflow
      element.offsetHeight;
    }
    element.style.height = "0px";
  }
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
    if (!["Backspace", "ArrowRight", "ArrowLeft", "Delete"].includes(event.key) && !event.ctrlKey)
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
 * merges the default config into the current config
 * reloads the options page afterwards
 **/
function onResetButton () {
  if (window.confirm(browser.i18n.getMessage('aboutResetNotificationConfirm')))
    Core.getJsonFileAsObject(chrome.runtime.getURL("res/config.json"), (config) => {
      // keep the reference by using assign
      Object.assign(Config, config);
      // reload option page to update the ui and save/propagate new data
      window.location.reload(false);
    });
}


/**
 * creates a json file with the current config and prompts a download dialog
 **/
function onBackupButton () {
  let url = URL.createObjectURL(
        new Blob([JSON.stringify(Config, null, '  ')], {type: 'application/json'})
      );
  let date = new Date().toDateString();

  chrome.downloads.download({
    url: url,
    filename: `${Manifest.name} ${Manifest.version} ${date}.json`,
    saveAs: true
  }, (downloadId) => {
    // catch error and free the blob for gc
    if (chrome.runtime.lastError) URL.revokeObjectURL(url);
    else chrome.downloads.onChanged.addListener(function clearURL(downloadDelta) {
      if (downloadId === downloadDelta.id && downloadDelta.state.current === "complete") {
        URL.revokeObjectURL(url);
        chrome.downloads.onChanged.removeListener(clearURL);
      }
    });
  });
}


/**
 * creates a json file with the current config and prompts a download dialog
 **/
function onRestoreButton (event) {
  if (this.files[0].type === "application/json") {
    let reader = new FileReader();
        reader.onloadend = () => {
          let restoredConfig = JSON.parse(reader.result),
              count = 0;

          // this will iterate through the current config and check if there is a corresponding value in the restore config
          function updateDeep(target, source) {
            for (let key in target) {
              if (key in source) {
                if (Core.isObject(target[key]) && Core.isObject(source[key]))
                  updateDeep(target[key], source[key]);
                else if (!Core.isObject(target[key]) && !Core.isObject(source[key])) {
                  target[key] = source[key];
                  count++;
                }
              }
            }
          }
          updateDeep(Config, restoredConfig);

          alert(browser.i18n.getMessage('aboutRestoreNotificationSuccess', count));
          // reload option page to update the ui and save/propagate new data
          window.location.reload(false);
        }
        reader.readAsText(this.files[0]);
  }
  else alert(browser.i18n.getMessage('aboutRestoreNotificationWrongFile'));
}


/**
 * convert a string containing entities
 * https://stackoverflow.com/a/7394787
 **/
function decodeHtml(html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}


// TEMPORARY
// display alert text for mouse button
chrome.runtime.getPlatformInfo((info) => {
  if (info.os === "linux" || info.os === "mac") {
    const info = document.querySelector('.option[data-i18n="settingNameMouseButton"]');
          info.textContent += " - On Linux and MacOS the right mouse button will only work on the latest Firefox 58 or above. ";
    const a = document.createElement('a');
          a.href = "https://github.com/Robbendebiene/Gesturefy/issues/1";
          a.textContent = "(More Information)";
    info.appendChild(a);
  }
});
