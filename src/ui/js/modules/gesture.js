'use strict'




// -------------------


/*
für jede geste ein gesture objekt erstellen und in einem array oder map speichern

update funktion, aktualisiert den inhalt (auch deas json speiher objekt)

delte function (removed alle event listener und this objekte auf null setzen)

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
        popup.classList.add("gesture-popup", "hide");

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
  // append element to receive its dimensions
  document.body.appendChild(popup);

  const popupRect = popup.getBoundingClientRect();

  const startX = rect.x;
  const startY = rect.y;
  const startScaleX = rect.width/popupRect.width;
  const startScaleY = rect.height/popupRect.height;


  popup.classList.replace("hide", "gp-animation-init");
  popup.style.transform = `
    translate(${startX+100}px, ${startY}px) scale(${startScaleX}, ${startScaleY})
  `;
  // --s-asd-asd


  popup.offsetHeight;

  popup.classList.add("gp-animation-run");
  popup.style.transform = `
    translate(${popupRect.x}px, ${popupRect.y}px) scale(1, 1)
  `;
  popup.ontransitionend = () => {
    popup.style = "";
    popup.classList.remove("gp-animation-init", "gp-animation-run");
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
  const popupRect = popup.getBoundingClientRect();
  // if item does not exist get the last item off all gestures and caluclate the new position of the new item, sonderfall, wenn keine geste existiert

  // need to get the target dimensions
  const endX = rect.x;
  const endY = rect.y;
  const endScaleX = rect.width/popupRect.width;
  const endScaleY = rect.height/popupRect.height;

  popup.classList.add("gp-animation-init");
  popup.style.transform = `
    translate(${popupRect.x}px, ${popupRect.y}px) scale(1, 1)
  `;
  popup.style.opacity = 1;


  popup.offsetHeight;

  popup.classList.add("gp-animation-run");
  popup.style.transform = `
    translate(${endX+100}px, ${endY}px) scale(${endScaleX}, ${endScaleY})
  `;
  popup.style.opacity = 0;
  popup.ontransitionend = (event) => {
    if (event.propertyName === "opacity") popup.remove();

  }
}
  return module;
})();
