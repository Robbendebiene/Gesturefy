import { Build } from "/views/shared/commons.mjs";

import { ContentLoaded, Config } from "/views/options/main.mjs";

import MouseGestureController from "/core/controllers/mouse-gesture-controller.mjs";

import Gesture from "/core/models/gesture.mjs";
import CommandStack from "/core/models/command-stack.mjs";

import PatternConstructor from "/core/utils/pattern-constructor.mjs";

import { getClosestGestureByPattern } from "/core/utils/matching-algorithms.mjs";
import PatternPreview from "/views/options/components/pattern-preview/pattern-preview.mjs";

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
  const fragment = document.createDocumentFragment();
  for (let gestureJSON of Config.get("Gestures")) {
    const gesture = Gesture.fromJSON(gestureJSON);
    const gestureListItem = createGestureListItem(gesture);
    // use the reference to the gestureItem as the Map key to the gesture object
    Gestures.set(gestureListItem, gesture);
    fragment.prepend(gestureListItem);
  }
  const gestureList = document.getElementById("gestureContainer");
        gestureList.appendChild(fragment);
        gestureList.dataset.noResultsHint = browser.i18n.getMessage('gestureHintNoSearchResults');
  // add mouse gesture controller event listeners
  mouseGestureControllerSetup();
}

/**
 * Creates a gesture list item html element by a given gestureObject and returns it
 **/
function createGestureListItem (gesture) {
  return Build('li', {
      classList: 'gl-item',
      onclick: onItemClick,
      onpointerenter: onItemPointerenter,
    },
    Build('pattern-preview', {
      classList: 'gl-thumbnail',
      pattern: gesture.pattern,
    }),
    Build('div', {
      classList: 'gl-command',
      textContent: gesture.toString(),
    }),
    Build('button', {
      classList: 'gl-remove-button icon-delete',
    }),
  );
}


/**
 * Adds a given gesture list item to the gesture list ui
 **/
function addGestureListItem (gestureListItem) {
  const gestureList = document.getElementById("gestureContainer");
  const gestureAddButtonItem = gestureList.firstElementChild;

  // prepend new entry, this pushes all elements by the height / width of one entry
  gestureAddButtonItem.after(gestureListItem);

  // select all gesture items
  const gestureItems = gestureList.querySelectorAll(".gl-item");

  // check if at least one node already exists
  if (gestureItems.length > 0) {
    // get grid gaps and grid sizes
    const gridComputedStyle = window.getComputedStyle(gestureList);
    const gridRowGap = parseFloat(gridComputedStyle.getPropertyValue("grid-row-gap"));
    const gridColumnGap = parseFloat(gridComputedStyle.getPropertyValue("grid-column-gap"));
    const gridRowSizes = gridComputedStyle.getPropertyValue("grid-template-rows").split(" ").map(parseFloat);
    const gridColumnSizes = gridComputedStyle.getPropertyValue("grid-template-columns").split(" ").map(parseFloat);

    // translate all elements to their previous positions (minus the dimensions of one grid item)
    for (let i = 0; i < gestureItems.length; i++) {
      const gestureItem = gestureItems[i];
      // get corresponding grid row and column size
      const gridColumnSize = gridColumnSizes[i % gridColumnSizes.length];
      //const gridRowSize = gridRowSizes[Math.floor(i / gridColumnSizes.length)];
      // console.log("template rows", gridComputedStyle.getPropertyValue("grid-template-rows"));
      const gridRowSize = gridRowSizes[0];

      // translate last element of row one row up and to the right end
      if ((i + 1) % gridColumnSizes.length === 0) {
        gestureItem.style.setProperty('transform', `translate(
          ${(gridColumnSize + gridColumnGap) * (gridColumnSizes.length - 1)}px,
          ${-gridRowSize - gridRowGap}px)
        `);
      }
      else {
        gestureItem.style.setProperty('transform', `translateX(${-gridColumnSize - gridColumnGap}px)`);
      }
    }
  }

  // remove animation class on animation end
  gestureListItem.addEventListener('animationend', event => {
    event.currentTarget.classList.remove('gl-item-animate-add');

    // remove transform so all elements move to their new position
    for (const gestureItem of gestureItems) {
      gestureItem.addEventListener('transitionend', event => {
        event.currentTarget.style.removeProperty('transition')
      }, {once: true });
      gestureItem.style.setProperty('transition', 'transform .3s');
      gestureItem.style.removeProperty('transform');
    }
  }, {once: true });

  // setup gesture item add animation
  gestureListItem.classList.add('gl-item-animate-add');
  gestureListItem.style.transform += `scale(1.6)`;
  // trigger reflow / gesture item add animation
  gestureListItem.offsetHeight;
  gestureListItem.style.setProperty('transition', 'transform .3s');
  gestureListItem.style.transform = gestureListItem.style.transform.replace("scale(1.6)", "");
  // hide new item in case search is active
  onSearchInput();
}


/**
 * Updates a given gesture list item ui by the provided gestureObject
 **/
function updateGestureListItem (gestureListItem, gesture) {
  // add popout animation for the updated gesture list item
  gestureListItem.addEventListener("animationend", () => {
    gestureListItem.classList.remove("gl-item-animate-update");
  }, { once: true });
  gestureListItem.classList.add("gl-item-animate-update");

  const currentGestureThumbnail = gestureListItem.querySelector(".gl-thumbnail");
  currentGestureThumbnail.pattern = gesture.pattern;

  const commandField = gestureListItem.querySelector(".gl-command");
  commandField.textContent = gesture.toString();
  // hide updated item in case search is active
  onSearchInput();
}


/**
 * Removes a given gesture list item from the gesture list ui
 **/
function removeGestureListItem (gestureListItem) {
  const gestureList = document.getElementById("gestureContainer");
  // get child index for current gesture item
  const gestureItemIndex = Array.prototype.indexOf.call(gestureList.children, gestureListItem);
  // select all gesture items starting from given gesture item index
  const gestureItems = gestureList.querySelectorAll(`.gl-item:nth-child(n + ${gestureItemIndex + 1})`);

  // for performance improvements: read and cache all grid item positions first
  const itemPositionCache = new Map();
  gestureItems.forEach(gestureItem => itemPositionCache.set(gestureItem, {x: gestureItem.offsetLeft, y: gestureItem.offsetTop}));

  // remove styles after transition
  function handleTransitionEnd (event) {
    event.currentTarget.style.removeProperty('transition');
    event.currentTarget.style.removeProperty('transform');
    event.currentTarget.removeEventListener('transitionend', handleTransitionEnd);
  }

  // remove element on animation end
  function handleAnimationEnd (event) {
    if (event.animationName === "animateRemoveItem") {
      event.currentTarget.remove();
      event.currentTarget.removeEventListener('animationend', handleAnimationEnd);
    }
  }

  // skip the first/current gesture item and loop through all following siblings
  for (let i = 1; i < gestureItems.length; i++) {
    const currentGestureItem = gestureItems[i];
    const previousGestureItem = gestureItems[i - 1];
    // get item positions from cache
    const currentItemPosition = itemPositionCache.get(currentGestureItem);
    const previousItemPosition = itemPositionCache.get(previousGestureItem);

    currentGestureItem.addEventListener('transitionend', handleTransitionEnd);
    // calculate and transform grid item to previous grid item position
    currentGestureItem.style.setProperty('transform', `translate(
      ${previousItemPosition.x - currentItemPosition.x}px,
      ${previousItemPosition.y - currentItemPosition.y}px)`
    );
    currentGestureItem.style.setProperty('transition', 'transform 0.3s');
  }

  gestureListItem.addEventListener('animationend', handleAnimationEnd);
  gestureListItem.classList.add('gl-item-animate-remove');
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
 * Handles the gesture item click
 * Calls the remove gesture list item function on remove button click and removes it from the config
 * Otherwise opens the clicked gesture item in the gesture popup
 **/
function onItemClick (event) {
  // if delete button received the click
  if (event.target.classList.contains('gl-remove-button')) {
    // remove gesture object and gesture list item
    Gestures.delete(this);
    removeGestureListItem(this);
    // update config
    Config.set("Gestures", Array.from(Gestures.values().map((g) => g.toJSON())));
  }
  else {
    // open gesture popup and hold reference to current item
    currentItem = this;
    // open gesture popup and pass related gesture object
    openGesturePopup( Gestures.get(this) );
  }
}


/**
 * Handles the gesture item hover and triggers the demo animation
 **/
function onItemPointerenter (event) {
  // add delay so it only triggers if the mouse stays on the item
  setTimeout(() => {
    if (this.matches(":hover")) this.querySelector(".gl-thumbnail").playDemo();
  }, 200);
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
  gesturePopupLabelInput.placeholder = event.target.commandStack.firstCommand.label;
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

  // if no item is active create a new one
  if (!currentItem) {
    // create new gesture
    const newGesture = new Gesture(currentPopupPattern, commandStack, gesturePopupLabelInput.value);
    // create corresponding html item
    const gestureListItem = createGestureListItem(newGesture);
    // store new gesture
    Gestures.set(gestureListItem, newGesture);
    // update config
    Config.set("Gestures", Array.from(Gestures.values().map((g) => g.toJSON())));
    // append html item
    addGestureListItem(gestureListItem);
  }
  else {
    const currentGesture = Gestures.get(currentItem);
    // update gesture data
    currentGesture.pattern = currentPopupPattern;
    currentGesture.commands = gesturePopupCommandPicker.commandStack;
    currentGesture.label = gesturePopupLabelInput.value;
    // update config
    Config.set("Gestures", Array.from(Gestures.values().map((g) => g.toJSON())));
    // update html item
    updateGestureListItem(currentItem, currentGesture);
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