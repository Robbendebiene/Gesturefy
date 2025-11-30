import { ContentLoaded, Config } from "/views/options/main.mjs";

import MouseGestureController from "/core/controllers/mouse-gesture-controller.mjs";

import Gesture from "/core/models/gesture.mjs";
import CommandStack from "/core/models/command-stack.mjs";

import PatternConstructor from "/core/utils/pattern-constructor.mjs";
import { getClosestGestureByPattern } from "/core/utils/matching-algorithms.mjs";

import PatternPreview from "/views/options/components/pattern-preview/pattern-preview.mjs";
import GestureCard from "/views/options/components/gesture-card/gesture-card.mjs";

ContentLoaded.then(main);

// reference to the curently active gesture list item
let currentItem = null;

// stores the current pattern of the gesture popup
let currentPopupPattern = null;

const Gestures = new Map();


/**
 * main function
 * run code that depends on async resources
 **/
function main (values) {
  // add event listeners
  const gesturePopup = document.getElementById("gesturePopup");
        gesturePopup.onclose = onGesturePopupClose;
  const gesturePopupSaveButton = document.getElementById("gesturePopupSaveButton");
        gesturePopupSaveButton.onclick = onGesturePopupSave;
  const gesturePopupCommandPicker = document.getElementById("gesturePopupCommandPicker")
        gesturePopupCommandPicker.addEventListener('change', onCommandSelectChange);
  const newGestureButton = document.getElementById("gestureAddButton");
        newGestureButton.onclick = onAddButtonClick;
  const gestureSearchToggleButton = document.getElementById("gestureSearchToggleButton");
        gestureSearchToggleButton.onclick = onSearchToggle;
  const gestureSearchInput = document.getElementById("gestureSearchInput");
        gestureSearchInput.oninput = onSearchInput;
        gestureSearchInput.placeholder = browser.i18n.getMessage('gestureSearchPlaceholder');
  // create and add all existing gesture items
  for (const gestureJSON of Config.get("Gestures")) {
    const gesture = Gesture.fromJSON(gestureJSON);
    const gestureListItem = new GestureCard(gesture, {onRemove: removeGesture});
    gestureListItem.addEventListener('click', onItemClick);
    // use the reference to the gestureItem as the Map key to the gesture object
    Gestures.set(gestureListItem, gesture);
  }
  const gestureList = document.getElementById("gestureContainer");
        gestureList.append(...Gestures.keys().toArray().reverse());
        gestureList.dataset.noResultsHint = browser.i18n.getMessage('gestureHintNoSearchResults');
  // add mouse gesture controller event listeners
  mouseGestureControllerSetup();
}


function addGesture(gesture) {
  // create corresponding html item
  const gestureListItem = new GestureCard(gesture, {onRemove: removeGesture});
        gestureListItem.addEventListener('click', onItemClick);
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
  const itemPositionCache = [
    // use gesture add button as reference for newly added item
    { element: gestureListItem, x: gestureAddButton.offsetLeft, y: gestureAddButton.offsetTop },
    ...nextElementSiblings(gestureAddButton).map(e => ({ element: e, x: e.offsetLeft, y: e.offsetTop }))
  ];
  // prepend new entry, to push all elements to their new position
  gestureAddButton.after(gestureListItem);
  // update item position cache by calculating the item position differences
  for (const entry of itemPositionCache) {
    entry.x = entry.x - entry.element.offsetLeft,
    entry.y = entry.y - entry.element.offsetTop
  }
  // loop through all previous gesture items
  // do this in a separate loop for performance improvements
  const animations = itemPositionCache.map(entry => {
    const animation = entry.element.animate([
      { translate: `${entry.x}px ${entry.y}px` },
      { translate: '0 0' },
    ], {
      duration: 300,
      easing: 'ease',
    });
    // pause animation so initial (backwards) translation is already applied
    animation.pause();
    return animation;
  });
  // show inwards animation of newly added item
  gestureListItem.style.setProperty('z-index', 1);
  await gestureListItem.animate([
    { scale: '1.6', opacity: 0 },
    { scale: '1', opacity: 1 }
  ], {
    duration: 300,
    easing: 'ease',
  }).finished;
  gestureListItem.style.removeProperty('z-index');
  // finally start moving items back to their new positions
  for (const animation of animations) animation.play();
  // hide new item in case search is active
  onSearchInput();
}

/**
 * Animates the update of a given gesture list item from the gesture list UI.
 **/
function animateGestureUpdate(gestureListItem) {
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


function* nextElementSiblings(element, includeInitial = false) {
  let next = includeInitial ? element : element.nextElementSibling;
  while(next) {
    yield next;
    next = next.nextElementSibling;
  }
}

/**
 * Returns the gesture object which gesture pattern is the closest match to the provided pattern,
 * if its deviation is below 0.1 else return null
 * Gesture items can be excluded via the second parameter
 **/
function getMostSimilarGestureByPattern (gesturePattern, excludedGestureItem = null) {
  return getClosestGestureByPattern(
    gesturePattern,
    Gestures
      .entries()
      .filter(e => e[0] !== excludedGestureItem)
      .map(e => e[1]),
    0.1,
    Config.get("Settings.Gesture.matchingAlgorithm")
  );
}

/**
 * Handles the gesture item click and opens the gesture item in the gesture popup.
 **/
function onItemClick (event) {
  // open gesture popup and hold reference to current item
  currentItem = this;
  // open gesture popup and pass related gesture object
  openGesturePopup( Gestures.get(this) );
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
  gesturePopupLabelInput.placeholder = event.target.commandStack.firstCommand?.label ?? '';
}


/**
 * Gathers and saves the specified settings data from the input elements and closes the coommand bar
 **/
function onGesturePopupSave (event) {
  const gesturePopupCommandPicker = document.getElementById("gesturePopupCommandPicker");
  const gesturePopupLabelInput = document.getElementById("gesturePopupLabelInput");

  const commandStack = gesturePopupCommandPicker.commandStack;
  // exit function if command select is empty or no pattern exists
  if (gesturePopupCommandPicker.commandStack.isEmpty || !currentPopupPattern) return;

  // create new gesture
  const newGesture = new Gesture(currentPopupPattern, commandStack, gesturePopupLabelInput.value);
  // if no item is active create a new one
  if (!currentItem) {
    addGesture(newGesture);
  }
  else {
    updateGesture(currentItem, newGesture);
  }
  const gesturePopup = document.getElementById("gesturePopup");
  gesturePopup.open = false;
}


/**
 * Disables the mouse gesture controller when the popup closes and clear the pattern
 **/
function onGesturePopupClose () {
  MouseGestureController.disable();
  // clear recorded gesture pattern
  currentPopupPattern = null;

  const gesturePopupPatternContainer = document.getElementById("gesturePopupPatternContainer");
  const gesturePopupHeading = document.getElementById("gesturePopupHeading");
  const gesturePopupCommandPicker = document.getElementById("gesturePopupCommandPicker");
  const gesturePopupLabelInput = document.getElementById("gesturePopupLabelInput");

  // reset gesture popup
  gesturePopupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleNewGesture');
  gesturePopupCommandPicker.commandStack = new CommandStack();
  gesturePopupLabelInput.value = "";
  gesturePopupLabelInput.placeholder = "";
  // clear popup gesture pattern if any
  if (gesturePopupPatternContainer.firstChild) gesturePopupPatternContainer.firstChild.remove();
}


/**
 * Opens the gesture popup and fills in the given values if any
 **/
function openGesturePopup (gesture = null) {
  const gesturePopupHeading = document.getElementById("gesturePopupHeading");
  const gesturePopupCommandPicker = document.getElementById("gesturePopupCommandPicker");
  const gesturePopupLabelInput = document.getElementById("gesturePopupLabelInput");
  // setup recording area
  const currentUserMouseButton = Config.get("Settings.Gesture.mouseButton");
  const mouseButtonLabelMap = {
    1: 'gesturePopupMouseButtonLeft',
    2: 'gesturePopupMouseButtonRight',
    4: 'gesturePopupMouseButtonMiddle'
  }
  const gesturePopupPatternContainer = document.getElementById("gesturePopupPatternContainer");
        gesturePopupPatternContainer.classList.remove("alert");
        gesturePopupPatternContainer.dataset.gestureRecordingHint = browser.i18n.getMessage(
          'gesturePopupRecordingAreaText',
          browser.i18n.getMessage(mouseButtonLabelMap[currentUserMouseButton])
        );
        gesturePopupPatternContainer.title = "";

  MouseGestureController.mouseButton = currentUserMouseButton;
  MouseGestureController.enable();
  // fill current values if any
  if (gesture) {
    gesturePopupHeading.textContent = browser.i18n.getMessage('gesturePopupTitleEditGesture');
    gesturePopupCommandPicker.commandStack = gesture.commands;
    gesturePopupLabelInput.placeholder = gesture.commands.firstCommand.label;
    gesturePopupLabelInput.value = gesture.label;
    gesturePopupLabelInput.title = browser.i18n.getMessage('gesturePopupDescriptionOptionalLabel');
    currentPopupPattern = gesture.pattern;
    // add popup gesture pattern
    const gestureThumbnail = new PatternPreview(gesture.pattern);
          gestureThumbnail.classList.add('gl-thumbnail');
    gesturePopupPatternContainer.append(gestureThumbnail);

    // check if there is a very similar gesture and get it
    const mostSimilarGesture = getMostSimilarGestureByPattern(currentPopupPattern, currentItem);

    // if there is a similar gesture report it to the user
    if (mostSimilarGesture) {
      // activate alert symbol and change title
      gesturePopupPatternContainer.classList.add("alert");
      gesturePopupPatternContainer.title = browser.i18n.getMessage(
        'gesturePopupNotificationSimilarGesture',
        mostSimilarGesture.toString()
      );
    }
    else {
      gesturePopupPatternContainer.classList.remove("alert");
      gesturePopupPatternContainer.title = gesturePopupPatternContainer.dataset.gestureRecordingHint;
    }
  }

  // open popup
  const gesturePopup = document.getElementById("gesturePopup");
        gesturePopup.open = true;
}


/**
 * Adds necessary event listeners to the mouse gesture controller
 **/
function mouseGestureControllerSetup () {
  const gesturePopupCanvas = document.getElementById("gesturePopupCanvas");
  const canvasContext = gesturePopupCanvas.getContext("2d");

  MouseGestureController.addEventListener("start", (event, events) => {
    // detect if the gesture started on the recording area
    if (!event.target.closest("#gesturePopupRecordingArea")) {
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
    // dradditionalArrowWidth all occurred events
    canvasContext.beginPath();
    canvasContext.moveTo(
      firstEvent.clientX,
      firstEvent.clientY
    );
    for (let event of events) canvasContext.lineTo(
      event.clientX,
      event.clientY
    );
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(
      lastEvent.clientX,
      lastEvent.clientY
    );
  });

  MouseGestureController.addEventListener("update", (event) => {
    // include fallback if getCoalescedEvents is not defined
    const events = event.getCoalescedEvents?.() ?? [event];

    const lastEvent = events[events.length - 1];
    for (let event of events) canvasContext.lineTo(
      event.clientX,
      event.clientY
    );
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(
      lastEvent.clientX,
      lastEvent.clientY
    );
  });

  MouseGestureController.addEventListener("abort", (event) => {
    // clear canvas
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.clearRect(0, 0, gesturePopupCanvas.width, gesturePopupCanvas.height);
  });

  MouseGestureController.addEventListener("end", (event, events) => {
    // clear canvas
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.clearRect(0, 0, gesturePopupCanvas.width, gesturePopupCanvas.height);

    // setup pattern extractor
    const patternConstructor = new PatternConstructor(
      Config.get("Settings.Gesture.patternDifferenceThreshold") ?? 0.12,
      Config.get("Settings.Gesture.patternDistanceThreshold") ?? 10
    );

    // gather all events in one array
    // calling getCoalescedEvents for an event other then pointermove will return an empty array
    const coalescedEvents = events.flatMap(event => {
      const events = event.getCoalescedEvents?.();
      // if events is null/undefined or empty (length == 0) return plain event
      return (events?.length > 0) ? events : [event];
    });

    // build gesture pattern
    for (const event of coalescedEvents) {
      patternConstructor.addPoint(event.clientX, event.clientY);
    }
    // update current pattern
    currentPopupPattern = patternConstructor.getPattern();

    // update popup gesture pattern
    const gestureThumbnail = new PatternPreview(currentPopupPattern);
          gestureThumbnail.classList.add('gl-thumbnail');
    const gesturePopupPatternContainer = document.getElementById("gesturePopupPatternContainer");
    // remove previous pattern if any
    if (gesturePopupPatternContainer.firstChild) gesturePopupPatternContainer.firstChild.remove();
    gesturePopupPatternContainer.append(gestureThumbnail);

    // check if there is a very similar gesture and get it
    const mostSimilarGesture = getMostSimilarGestureByPattern(currentPopupPattern, currentItem);

    // if there is a similar gesture report it to the user
    if (mostSimilarGesture) {
      // activate alert symbol and change title
      gesturePopupPatternContainer.classList.add("alert");
      gesturePopupPatternContainer.title = browser.i18n.getMessage(
        'gesturePopupNotificationSimilarGesture',
        mostSimilarGesture.toString()
      );
    }
    else {
      gesturePopupPatternContainer.classList.remove("alert");
      gesturePopupPatternContainer.title = gesturePopupPatternContainer.dataset.gestureRecordingHint;
    }
  });
}