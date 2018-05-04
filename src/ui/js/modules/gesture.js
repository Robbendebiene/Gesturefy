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






/*
  myInput.onpaste = function(e) {
    // e.clipboardData.getData('Text');
    // validieren und dann preventen oder nicht
    e.preventDefault();
  }
*/





// OVERLAY UND SIDEBAR AUCH IN DEN IFRAME AUSLAGERN UND WIE HIER MIT WINDOW.TOP ARBEITEN AM ENDE ALLES IN EINZELNE CLASS FILES AUSLAGERN

//gesture.class.js

//gesture.handler.js??
//gesture-handler.js??


const Gesture = (function() {

  const module = {};

  // private variables

  // get root document
  const document = window.top.document;


  const popup = buildPopup();

// public methods

/**
 * Add the message event listener
 **/
function buildPopup () {
  // create dom nodes
  const popup = document.createElement("div");
        popup.classList.add("gesture-popup");

  const header = document.createElement("div");
        header.classList.add("gp-header");
  const actionInput = document.createElement("input");
        actionInput.classList.add("gp-action-label-input");
        actionInput.placeholder = "No Action selected, select on to the right";
        actionInput.maxLength = 100;
  const actionSelect = document.createElement("button");
        actionSelect.classList.add("gp-action-select-button");
        actionSelect.textContent = "Select";
  header.append(actionInput, actionSelect);

  const main = document.createElement("div");
        main.classList.add("gp-main");
  const drawArea = document.createElement("div");
        drawArea.classList.add("gp-draw-area");
  main.append(drawArea);

  const footer = document.createElement("div");
        footer.classList.add("gp-footer");
  const gestureInput = document.createElement("input");
        gestureInput.classList.add("gp-gesture-code-input");
        gestureInput.pattern = "(\\b(?:([UDRLudrl])(?!\\2{1}))+\\b)";
        gestureInput.placeholder = "No Gesture yet";
  const saveButton = document.createElement("button");
        saveButton.classList.add("gp-save-button");
        saveButton.textContent = "Save";
  footer.append(gestureInput, saveButton);

  popup.append(header, main, footer);

  return popup;
}


/**
 * Add the message event listener
 **/
module.open = function open (rect) {
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
module.onSubmit = function onSubmit () {


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
}

  return module;
})();
