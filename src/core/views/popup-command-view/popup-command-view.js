/**
 * PopupCommandView
 * Listens for "PopupRequest" background connection and displays a popup according to the message data
 * An iframe is used in order to protect the user data from webpages that may try to read or manipulate the contents of the popup
 **/

// private variables and methods

const Popup = document.createElement("iframe");
      Popup.style = `
          all: initial !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          border: 0 !important;
          z-index: 2147483647 !important;
          box-shadow: 1px 1px 5px rgba(0,0,0,0.4) !important;
          opacity: 0 !important;
          transition: opacity .3s !important;
        `;
      Popup.onload = initialize;
      Popup.src = browser.extension.getURL("/core/views/popup-command-view/popup-command-view.html");

// save a reference to the current channel
let channel = null;

// contains the message data
let data = null;

// contains the mouse position retrieved from the message
const position = {
  x: 0,
  y: 0
}

// setup background/command connection event listener
browser.runtime.onConnect.addListener(handleConnection);


/**
 * Called on popup load
 * Builds all html contents, sizes and positions the popup
 **/
function initialize () {
  const popupWindow = Popup.contentWindow;
  const popupDocument = Popup.contentDocument;

  // add event listeners
  popupWindow.addEventListener("wheel", handleWheel, true);
  popupWindow.addEventListener("contextmenu", handleContextmenu, true);
  popupWindow.addEventListener("keydown", handleKeyDown, true);

  // create list
  const list = popupDocument.createElement("ul");
        list.id = "list";
  // map data to list items
  for (let element of data) {
    const item = popupDocument.createElement("li");
          item.classList.add("item");
          item.onpointerup = handleItemSelection;
          item.dataset.id = element.id;
    // add image icon if available
    if (element.icon) {
      const image = popupDocument.createElement("img");
            image.src = element.icon;
      item.appendChild(image);
    }
    // add label
    const text = popupDocument.createElement("span");
          text.textContent = element.label;
    item.appendChild(text);

    list.appendChild(item);
  }
  // append list
  popupDocument.body.appendChild(list);
  // focus Popup frame
  popupWindow.focus();
  popupWindow.onblur = handleBlur;

  // try to get the relative screen width without scrollbar
  const relativeScreenWidth = document.documentElement.clientWidth || document.body.clientWidth || window.innerWidth;
  const relativeScreenHeight = document.documentElement.clientHeight || document.body.clientHeight || window.innerHeight;

  // get the absolute maximum available height from the current position either from the top or bottom
  const maxAvailableHeight = Math.max(relativeScreenHeight - position.y, position.y);

  // get absolute list dimensions
  const width = list.scrollWidth;
  const height = Math.min(list.scrollHeight, maxAvailableHeight);

  // convert absolute to relative dimensions
  const relativeWidth = width;
  const relativeHeight = height;

  // calculate absolute available space to the right and bottom
  const availableSpaceRight = (relativeScreenWidth - position.x);
  const availableSpaceBottom = (relativeScreenHeight - position.y);

  // get the ideal relative position based on the given available space and dimensions
  const x = availableSpaceRight >= width ? position.x : position.x - relativeWidth;
  const y = availableSpaceBottom >= height ? position.y : position.y - relativeHeight;

  // add scroll buttons if list is scrollable
  if (height < list.scrollHeight) {
    const buttonUp = popupDocument.createElement("div");
          buttonUp.classList.add("button", "up");
          buttonUp.onmouseover = handleScrollButtonMouseover;
    const buttonDown = popupDocument.createElement("div");
          buttonDown.classList.add("button", "down");
          buttonDown.onmouseover = handleScrollButtonMouseover;
    popupDocument.body.append(buttonUp, buttonDown);
  }

  // apply scale, position, dimensions to Popup / iframe and make it visible
  Popup.style.setProperty('width', Math.round(width) + 'px', 'important');
  Popup.style.setProperty('height', Math.round(height) + 'px', 'important');
  Popup.style.setProperty('transform-origin', `0 0`, 'important');
  Popup.style.setProperty('transform', `translate(${Math.round(x)}px, ${Math.round(y)}px)`, 'important');
  Popup.style.setProperty('opacity', '1', 'important');
}


/**
 * Terminates the popup and closes the messaging channel
 **/
function terminate () {
  channel.disconnect();
  Popup.remove();
  Popup.style.setProperty('opacity', '0', 'important');
}


/**
 * Handles background connection request to create a popup
 **/
function handleConnection (port) {
  if (port.name === "PopupRequest") {
    // popup is not working in a pure svg page thus cancel the popup creation
    if (document.documentElement.tagName.toUpperCase() === "SVG") return;
    // save reference to port object
    channel = port;
    // add listener
    channel.onMessage.addListener(handleMessage);
    channel.onDisconnect.addListener(handleDisconnect);
  }
}


/**
 * Handles the messages from the channel that was established by a background command
 * This also exposes the message data to global scope and appends the popup
 **/
function handleMessage (message) {
  // store reference for other functions
  position.x = message.mousePosition.x - window.mozInnerScreenX;
  position.y = message.mousePosition.y - window.mozInnerScreenY;
  data = message.dataset;

  // this will start loading the iframe content
  if (document.body.tagName.toUpperCase() === "FRAMESET")
    document.documentElement.appendChild(Popup);
  else document.body.appendChild(Popup);
}


/**
 * Handles the channel disconnection from the background
 * Terminates the popup
 **/
function handleDisconnect (port) {
  terminate();
}


/**
 * Handles and emulates mouse wheel scrolling inside the popup
 **/
function handleWheel (event) {
  Popup.contentWindow.scrollBy(0, event.deltaY * 10);
  event.preventDefault();
  event.stopPropagation();
}


/**
 * Prevents the context menu because of design reason and for rocker gesture conflicts
 **/
function handleContextmenu (event) {
  event.preventDefault();
}


/**
 * Passes the id of the selected item to the corresponding command and terminates the popup
 **/
function handleItemSelection (event) {
  channel.postMessage({
    button: event.button,
    id: this.dataset.id
  });
}


/**
 * Handles up and down arrow keys
 **/
function handleKeyDown (event) {
  if (event.key === "ArrowUp")
    Popup.contentWindow.scrollBy(0, -28);
  else if (event.key === "ArrowDown")
    Popup.contentWindow.scrollBy(0, 28);
}


/**
 * Handles the up and down controls
 **/
function handleScrollButtonMouseover (event) {
  const direction = this.classList.contains("up") ? -4 : 4;
  const button = event.currentTarget;

  function step (timestamp) {
    if (!button.matches(':hover')) return;
    Popup.contentWindow.scrollBy(0, direction);
    window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
}


/**
 * Handles the blur event and terminates the popup if not already done
 **/
function handleBlur () {
  if (Popup.isConnected) {
    terminate();
  }
}