import {
  cloneObjectInto
} from "/core/commons.js";

import {
  Config,
  Commands,
  CommandSettingTemplates,
} from "/ui/js/content.js";

import Overlay from "/ui/js/modules/overlay.js";

import GesturePopup from "/ui/js/modules/gesture-popup.js";

// main code

const newGestureButton = document.getElementById('NewGesture');
      newGestureButton.onclick = onAddButtonClick;

// reference to the curently active gesture list item
let currentItem = null;

// reference to the dom node where the items will be appended
const gestureList = document.getElementById("Gestures");

// create and add all existing gesture items
const fragment = document.createDocumentFragment();
for (let gestureObject of Config.Gestures) {
  fragment.appendChild( createGestureListItem(gestureObject) );
}
gestureList.appendChild(fragment);

GesturePopup.init(
  Config.Settings.Gesture.mouseButton,
  Config.Gestures,
  Commands,
  CommandSettingTemplates
);


/**
 * Handles the gesture item click
 * Calls the remove gesture list item function on remove button click and removes it from the config
 * Otherwise opens the clicked gesture item in the gesture popup
 **/
function onItemClick (event) {
  // if delete button received the click
  if (event.target.classList.contains('gl-remove-button')) {
    removeGestureListItem(this);
    // remove gesture object from array
    const index = Config.Gestures.findIndex((ele) => ele.gesture === this.dataset.gesture);
    Config.Gestures.splice(index, 1);
  }
  else {
    // open gesture popup and hold reference to current item
    currentItem = this;
    // get gesture object from array
    const gestureObject = Config.Gestures.find((ele) => ele.gesture === this.dataset.gesture);
    openGesturePopup(gestureObject);
  }
}


/**
 * Handles the new gesture button click and opens the gesture popup
 **/
function onAddButtonClick (event) {
  currentItem = null;
  openGesturePopup();
}


/**
 * Opens the gesture popup and overlay on gesture list item click or new gesture button
 **/
function openGesturePopup (gestureObject) {
  Overlay.open();
  Overlay.onClick(closeGesturePopup);

  GesturePopup.open(gestureObject);
  GesturePopup.onCancel(closeGesturePopup);
  GesturePopup.onSubmit((gestureObject) => {
    // if no item is active create a new one
    if (!currentItem) {
      // store new gesture
      Config.Gestures.unshift(cloneObjectInto(
        gestureObject,
        window.top
      ));
      const gestureListItem = createGestureListItem(gestureObject);
      addGestureListItem(gestureListItem);
    }
    else {
      // update gesture list item
      const index = Config.Gestures.findIndex((ele) => ele.gesture === currentItem.dataset.gesture);
      Config.Gestures[index] = cloneObjectInto(
        gestureObject,
        window.top
      );
      updateGestureListItem(currentItem, gestureObject);
    }
    closeGesturePopup();
  });

}


/**
 * Closes the gesture popup and overlay
 **/
function closeGesturePopup () {
  Overlay.close();
  GesturePopup.close();
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
