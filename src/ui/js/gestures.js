'use strict'

/**
 * TODO:
 * - gesture popup
 * - add grid / list swap button
 * - gesture add/remove functionality
 * - add "add gesture button"
 * - restyle gesture remove x button (maybe bin symbol)
 */

const Config = window.top.Config;

const Commands = window.top.Commands;

const settingTemplates = window.top.document.getElementById("CommandSettings").content;

CommandBar.init(Commands, settingTemplates);


// temporary test
setTimeout(() => {
  Overlay.open(); //automatically show , singelton class/ return this des andern overlay if vorhanden
  Overlay.onClick(() => {
    Overlay.close();
    CommandBar.close();
  })
  CommandBar.open(Config.Commands); //automatically show
  CommandBar.onChoice((x) => {
    console.log(x);
    Overlay.close();
    CommandBar.close();
  })
},1000)






// reference to the dom node where the items will be appended
const listElement = document.getElementById("Gestures");
// map which stores the gesture as the key with a reference to its data
const gestureMap = new Map();

const fragment = document.createDocumentFragment();

// add existing gestures
for (let gestureItem of Config.Gestures) {
  const key = gestureItem.gesture;
  // use gesture as key and store item reference
  gestureMap.set(key, gestureItem);

  const listItem = document.createElement("li");
        listItem.classList.add("gl-item");
        listItem.dataset.gesture = key;
        listItem.onclick = (event) => {
          const rect = event.currentTarget.getBoundingClientRect();;
          const data = gestureMap.get(event.currentTarget.dataset.gesture);
          Overlay.open();
          Overlay.onClick(() => {
            Overlay.close();
            Gesture.close(rect, data);
          })
          Gesture.open(rect, data);
        }
  const actionField = document.createElement("div");
        actionField.classList.add("gl-action");
        actionField.textContent = gestureItem.label || browser.i18n.getMessage(`commandName${gestureItem.command}`);
  const gestureField = document.createElement("div");
        gestureField.classList.add("gl-gesture");
        gestureField.textContent = gestureItem.gesture;
  const removeButton = document.createElement("button");
        removeButton.classList.add("gl-remove-button");
        removeButton.textContent = "⨯";
      //  removeButton.onclick = remove.bind(this);
  listItem.append(actionField, gestureField, removeButton);
  fragment.appendChild(listItem);
}
listElement.appendChild(fragment);
