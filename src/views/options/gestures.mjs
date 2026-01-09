import { ContentLoaded, Config } from "/views/options/main.mjs";
import Gesture from "/core/models/gesture.mjs";
import { morph } from "/views/shared/commons.mjs";
import { getClosestGestureByPattern } from "/core/utils/matching-algorithms.mjs";
import { GestureCard } from "/views/options/components/gesture-card/gesture-card.mjs";

ContentLoaded.then(main);

const Gestures = new Map();

/**
 * main function
 * run code that depends on async resources
 **/
function main (values) {
  // add event listeners
  const gestureSearchToggleButton = document.getElementById("gestureSearchToggleButton");
        gestureSearchToggleButton.onclick = onSearchToggle;
  const gestureSearchInput = document.getElementById("gestureSearchInput");
        gestureSearchInput.oninput = onSearchInput;
        gestureSearchInput.placeholder = browser.i18n.getMessage('gestureSearchPlaceholder');

  const gestureAddButton = document.getElementById("gestureAddButton");
        // Alternatively command="show-modal" commandfor="gesturePopup" could be used
        // However onbeforetoggle is to early and ontoggle to late to trigger the animation
        gestureAddButton.addEventListener("click", onGestureAddButtonClick);

  const gesturePopup = document.getElementById("gesturePopup");
        gesturePopup.addEventListener("cancel", onGesturePopupCancel);
        gesturePopup.addEventListener("close", onGesturePopupClose);
  const gesturePopupForm = document.getElementById("gesturePopupForm");
        gesturePopupForm.addEventListener("submit", onGesturePopupFormSave);
  const gesturePopupRecordingArea = document.getElementById("gesturePopupRecordingArea");
        gesturePopupRecordingArea.addEventListener('change', applySimilarityCheck);
  const gesturePopupCommandPicker = document.getElementById("gesturePopupCommandPicker")
        gesturePopupCommandPicker.addEventListener('change', applyCommandPlaceholder);

  // create and add all existing gesture items
  for (const gestureJSON of Config.get("Gestures")) {
    const gesture = Gesture.fromJSON(gestureJSON);
    const gestureListItem = new GestureCard(gesture, {onRemove: removeGesture});
          gestureListItem.addEventListener('click', onGestureCardClick);
    // use the reference to the gestureItem as the Map key to the gesture object
    Gestures.set(gestureListItem, gesture);
  }
  const gestureList = document.getElementById("gestureContainer");
        gestureList.append(...Gestures.keys().toArray().reverse());
}


function addGesture(gesture) {
  // create corresponding html item
  const gestureListItem = new GestureCard(gesture, {onRemove: removeGesture});
        gestureListItem.addEventListener('click', onGestureCardClick);
  Gestures.set(gestureListItem, gesture);
  Config.set("Gestures", Array.from(Gestures.values().map((g) => g.toJSON())));
  animateGestureAddition(gestureListItem);
}

function updateGesture(gestureListItem, gesture) {
  // update corresponding html item
  gestureListItem.gesture = gesture;
  Gestures.set(gestureListItem, gesture);
  Config.set("Gestures", Array.from(Gestures.values().map((g) => g.toJSON())));
  animateGestureUpdate(gestureListItem);
}

function removeGesture(gestureListItem) {
  Gestures.delete(gestureListItem);
  Config.set("Gestures", Array.from(Gestures.values().map((g) => g.toJSON())));
  animateGestureRemoval(gestureListItem);
}

/**
 * Animates the addition of a given gesture list item to the gesture list UI.
 * This actually adds the item to the DOM at the beginning.
 **/
async function animateGestureAddition(gestureListItem) {
  const gestureAddButton = document.getElementById("gestureAddButton");
  // read and cache all grid item positions first
  // use gesture add button as reference for newly added item
  const itemPositionCache = nextElementSiblings(gestureAddButton)
    .map(e => ({ element: e, x: e.offsetLeft, y: e.offsetTop }))
    .toArray();
  // prepend new entry, to push all elements to their new position
  gestureAddButton.after(gestureListItem);
  // update item position cache by calculating the item position differences
  for (const entry of itemPositionCache) {
    entry.x = entry.x - entry.element.offsetLeft,
    entry.y = entry.y - entry.element.offsetTop
  }
  // loop through all previous gesture items
  // do this in a separate loop for performance improvements
  for (const entry of itemPositionCache) {
    entry.element.animate([
      { translate: `${entry.x}px ${entry.y}px` },
      { translate: '0 0' },
    ], {
      duration: 300,
      easing: 'ease',
    });
  }
  // show inwards animation of newly added item
  await animateGestureUpdate(gestureListItem);
}

/**
 * Animates the update of a given gesture list item from the gesture list UI.
 **/
async function animateGestureUpdate(gestureListItem) {
  // show inwards animation of newly updated item
  await animatePopupClose(gestureListItem);
  gestureListItem.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.05)' },
    { transform: 'scale(1)' }
  ], {
    duration: 300,
    easing: 'ease',
  });
  // hide updated item in case search is active
  onSearchInput();
}

/**
 * Animates the removal of a given gesture list item from the gesture list UI.
 * This actually removes the item to the DOM at the end.
 **/
async function animateGestureRemoval(gestureListItem) {
  // for performance improvements: read and cache all grid item positions first
  const itemOffsetCache = nextElementSiblings(gestureListItem).map(e => ({
    element: e,
    // calculate position difference to previous grid item position
    x: e.previousElementSibling.offsetLeft - e.offsetLeft,
    y: e.previousElementSibling.offsetTop - e.offsetTop
  })).toArray();

  await Promise.all([
    gestureListItem.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.9)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease',
    }).finished,
    // transform all following grid items to the previous grid item's position
    ...itemOffsetCache.map(entry => entry.element.animate([
      { transform: `translate(${entry.x}px, ${entry.y}px)` }
    ], {
      duration: 300,
      easing: 'ease',
    }).finished)
  ]);

  gestureListItem.remove();
}

/**
 * Animates the gesture popup together with the given source element.
 * If no target element is given the popup is opened with a basic animation.
 * Actually opens the popup at the beginning.
 */
async function animatePopupOpen(sourceElement) {
  const gesturePopup = document.getElementById("gesturePopup");
        gesturePopup.showModal();
  if (sourceElement) {
    sourceElement.style.setProperty('z-index', 1);
    const {from, to} = morph(sourceElement, gesturePopup, {
      duration: 300,
      fade: 'to',
    });
    await (from ?? to).finished;
    sourceElement.style.removeProperty('z-index');
    sourceElement.style.setProperty('visibility', 'hidden');
  }
  else {
    await gesturePopup.animate([
      {
        opacity: 0,
        transform: `scale(0.8)`,
      },
      {
        opacity: 1,
        transform: 'none',
      }
    ], {
      duration: 300,
      easing: 'ease'
    }).finished;
  }
}

/**
 * Animates the gesture popup together with the given target element.
 * If no target element is given the popup is closed with a basic animation.
 * Actually closes the popup at the end.
 **/
async function animatePopupClose(sourceElement) {
  const gesturePopup = document.getElementById("gesturePopup");
  if (sourceElement) {
    sourceElement.style.removeProperty('visibility');
    sourceElement.style.setProperty('z-index', 1);
    const {from, to} = morph(gesturePopup, sourceElement, {
      duration: 300,
      fade: 'from',
    });
    await from.finished;
    sourceElement.style.removeProperty('z-index');
    gesturePopup.close();
  }
  else {
    await gesturePopup.animate([
      {
        opacity: 0,
        scale: 0.8,
      }
    ], {
      id: 'closing',
      duration: 300,
      easing: 'ease'
    }).finished;
    gesturePopup.close();
  }
}

/**
 * Handles the input events of the search field and hides all unmatching gestures
 **/
function onSearchInput () {
  const gestureList = document.getElementById("gestureContainer");
  const searchQuery = document.getElementById("gestureSearchInput").value.toLowerCase().trim();
  const searchQueryKeywords = searchQuery.split(" ");

  for (const [gestureListItem, gesture] of Gestures) {
    // get the gesture string and transform all letters to lower case
    const gestureString = gesture.toString().toLowerCase();
    // check if all keywords are matching the command name
    const isMatching = searchQueryKeywords.every(keyword => gestureString.includes(keyword));
    // hide all unmatching commands and show all matching commands
    gestureListItem.classList.toggle("hidden", !isMatching);
  }

  gestureList.classList.toggle("searching", !!searchQuery.length);
}

/**
 * Handles visibility of the the search field
 **/
function onSearchToggle () {
  const gestureSearchForm = document.getElementById("gestureSearchForm");
  const gestureSearchInput = document.getElementById("gestureSearchInput");

  if (gestureSearchForm.classList.toggle("show")) {
    gestureSearchInput.focus();
  }
  else {
    gestureSearchForm.reset();
    onSearchInput();
  }
}


// Gesture Popup Code \\

// reference to the currently active gesture list item
let currentItem = null;

// fires before the popup is closed,
function onGesturePopupCancel(event) {
  // prevent auto closing popup so we can play the animation
  event.preventDefault();
  closeGesturePopup(currentItem);
}

function onGesturePopupClose(event) {
  document.getElementById("gesturePopupForm").reset();
  currentItem = null;
}

function onGestureAddButtonClick(event) {
  openGesturePopup(currentItem);
}

function onGestureCardClick(event) {
  currentItem = this;
  openGesturePopup(currentItem, this.gesture);
}

/**
 * Gathers and saves the specified settings data from the input elements
 **/
function onGesturePopupFormSave(event) {
  const form = event.target;
  // create new gesture
  const newGesture = new Gesture(
    form.elements['pattern'].pattern,
    form.elements['commandStack'].commandStack,
    form.elements['label'].value,
  );
  // if no item is active create a new one
  if (!currentItem) {
    addGesture(newGesture);
  }
  else {
    updateGesture(currentItem, newGesture);
  }
  event.preventDefault();
}

/**
 * Opens the gesture popup and fills in the given values if any
 **/
function openGesturePopup(sourceElement, gesture = null) {
  const gesturePopupHeading = document.getElementById("gesturePopupHeading");
  const gesturePopupCommandPicker = document.getElementById("gesturePopupCommandPicker");
  const gesturePopupLabelInput = document.getElementById("gesturePopupLabelInput");
        gesturePopupLabelInput.title = browser.i18n.getMessage('gesturePopupDescriptionOptionalLabel');
  // setup recording area
  const gesturePopupRecordingArea = document.getElementById("gesturePopupRecordingArea");
        gesturePopupRecordingArea.mouseButton = Config.get("Settings.Gesture.mouseButton");

  // initiated by new gesture button
  const isNew = !gesture;

  if (isNew) {
    gesturePopupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleNewGesture');
  }
  else {
    gesturePopupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleEditGesture');
    // fill with current values
    // command stack is modified in place, therefore supply a clone in case the changes are not saved
    gesturePopupCommandPicker.commandStack = gesture.commands.clone();
    gesturePopupLabelInput.value = gesture.label;
    gesturePopupRecordingArea.pattern = gesture.pattern;
  }
  applySimilarityCheck();
  applyCommandPlaceholder();

  animatePopupOpen(sourceElement);
}

/**
 * Close gesture popup.
 **/
async function closeGesturePopup(sourceElement) {
  const gesturePopup = document.getElementById("gesturePopup");
  if (gesturePopup.getAnimations().length > 0) {
    // ignore as long as an animation is currently running
    // we could reverse any current opening animations
    // but this would require us to detect what is an opening or closing animation or a special gate variable
    return;
  }
  return animatePopupClose(sourceElement);
}

/**
 * Handles the gesture popup command select change and adjusts the label input placeholder based on its current value
 **/
function applyCommandPlaceholder() {
  const gesturePopupLabelInput = document.getElementById("gesturePopupLabelInput");
  const gesturePopupCommandPicker = document.getElementById("gesturePopupCommandPicker");
  gesturePopupLabelInput.placeholder = gesturePopupCommandPicker.commandStack.firstCommand?.label ?? '';
}

/**
 * Shows a warning icon and message if the pattern is too similar to an existing gesture.
 **/
function applySimilarityCheck () {
  const gesturePopupSaveButton = document.getElementById("gesturePopupSaveButton");
  const gesturePopupRecordingArea = document.getElementById("gesturePopupRecordingArea");
  const pattern = gesturePopupRecordingArea.pattern

  if (pattern) {
    // check if there is a very similar gesture and get it
    const mostSimilarGesture = getClosestGestureByPattern(
      pattern,
      Gestures
        .entries()
        // excluded the current gesture
        .filter(e => e[0] !== currentItem)
        .map(e => e[1]),
      0.1,
      Config.get("Settings.Gesture.matchingAlgorithm")
    );

    if (mostSimilarGesture) {
      // activate alert symbol and change title
      gesturePopupSaveButton.classList.add("alert");
      gesturePopupSaveButton.title = browser.i18n.getMessage(
        'gesturePopupNotificationSimilarGesture',
        mostSimilarGesture.toString()
      );
      return;
    }
  }

  gesturePopupSaveButton.classList.remove("alert");
  gesturePopupSaveButton.title = '';
}

/**
 * Returns an iterator over all following siblings of the given element.
 * If includeInitial is true the target element is included.
 */
function* nextElementSiblings(element, includeInitial = false) {
  let next = includeInitial ? element : element.nextElementSibling;
  while(next) {
    yield next;
    next = next.nextElementSibling;
  }
}
