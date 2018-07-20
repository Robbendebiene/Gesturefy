'use strict'

/**
 * TODO:
 * cloneObjectInto will be necessary
 */


const Commands = window.top.Commands;
const settingTemplates = window.top.document.getElementById("CommandSettings").content;
const newGestureButton = document.getElementById('NewGesture');
      newGestureButton.onclick = onAddButtonClick;

// reference to the curently active gesture list item
let currentItem = null;
// reference to the dom node where the items will be appended
const gestureList = document.getElementById("Gestures");
// map which stores the gesture as the key with a reference to its data
const gestureMap = new Map();

const fragment = document.createDocumentFragment();
// add existing gestures
for (let gestureObject of Config.Gestures) {
  // use gesture as key and store gesture object reference
  gestureMap.set(gestureObject.gesture, gestureObject);
  // create list item element
  const gestureListItem = createGestureListItem(gestureObject);
  fragment.appendChild(gestureListItem);
}
gestureList.appendChild(fragment);

CommandBar.init(Commands, settingTemplates);
GesturePopup.init(gestureMap);



console.log(Array.from(gestureMap.values()));



function openGesture (gestureObject) {
  Overlay.open();
  Overlay.onClick(closeGesture);

  GesturePopup.open(gestureObject);
  GesturePopup.onCommandSelect((xyz) => {
    CommandBar.open();
    CommandBar.onSubmit((commandObject) => {
      xyz(commandObject);
      closeCommandBar();
    });
  });
  GesturePopup.onSubmit((gestureObject) => {
    // if no item is active create a new one
    if (!currentItem) {
      const gestureListItem = createGestureListItem(gestureObject);
      addGestureListItem(gestureListItem);
      // store new gesture in map
      gestureMap.set(gestureObject.gesture, gestureObject);
    }
    else {

    /*  if (gestureMap.delete(currentItem.dataset.gesture)) {

      }
      else {

      }*/


      // update gesture list item
      updateGestureListItem(currentItem, gestureObject);
      // update stored values
      gestureMap.set(gestureObject.gesture, gestureObject);
    }
    closeGesture();
  });
  GesturePopup.onCancel(closeGesture);

  CommandBar.onCancel(closeCommandBar);
}


function closeGesture () {
  Overlay.close();
  GesturePopup.close();
  CommandBar.close();
}

function closeCommandBar () {
  CommandBar.close();
}




function onAddButtonClick (event) {
  currentItem = null;
  openGesture();
}




/**
 *
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
 *
 **/
function addGestureListItem (gestureListItem) {
  // append entry, hide it and move it out of flow to calculate its dimensions
  gestureList.prepend(gestureListItem);
  gestureListItem.style.setProperty('visibility', 'hidden');
  gestureListItem.style.setProperty('position', 'absolute');
  // calculate total entry height
  const computedStyle = window.getComputedStyle(gestureListItem);
  const outerHeight = parseInt(computedStyle.marginTop) + gestureListItem.offsetHeight + parseInt(computedStyle.marginBottom);

  // move all entries up by one entry including the new one
  for (const node of gestureList.children) {
    node.style.setProperty('transform', `translateY(-${outerHeight}px)`);
    // remove ongoing transitions if existing
    node.style.removeProperty('transition');
  }
  // show new entry and bring it back to flow, which pushes all elements down by the height of one entry
  gestureListItem.style.removeProperty('visibility', 'hidden');
  gestureListItem.style.removeProperty('position', 'absolute');

  // trigger reflow
  gestureList.offsetHeight;

  gestureListItem.addEventListener('animationend', (event) => {
    event.currentTarget.classList.remove('bl-entry-animate-add');
  }, {once: true });
  gestureListItem.classList.add('bl-entry-animate-add');

  // move all entries down including the new one
  for (const node of gestureList.children) {
    node.addEventListener('transitionend', (event) => event.currentTarget.style.removeProperty('transition'), {once: true });
    node.style.setProperty('transition', 'transform 0.3s');
    node.style.removeProperty('transform');
  }
}



/**
 *
 **/
function updateGestureListItem (gestureListItem, gestureObject) {
  const commandField = gestureListItem.querySelector(".gl-command");
  const gestureField = gestureListItem.querySelector(".gl-gesture");
  gestureListItem.dataset.gesture = gestureObject.gesture;
  commandField.textContent = gestureObject.label || browser.i18n.getMessage(`commandLabel${gestureObject.command}`);
  gestureField.textContent = gestureObject.gesture;
}


/**
 *
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
 *
 **/
function onItemClick (event) {
  // if delete button received the click
  if (event.target.classList.contains('gl-remove-button')) {
    removeGestureListItem(this);
    // remove gesture object from map
    gestureMap.delete(this.dataset.gesture);
  }
  else {
    // hold reference to current item
    currentItem = this;
    const gestureObject = gestureMap.get(this.dataset.gesture);
    openGesture(gestureObject);
  }
}
