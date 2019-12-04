/**
 * PopupCommandInterface
 * listens for "PopupRequest" background messages and displays an popup according to the message data
 * an iframe is used in order to protect the user data from webpages that may try to read or manipulate the contents of the popup
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
      Popup.src = browser.extension.getURL("/core/interfaces/html/popup-command-interface.html");

// contains the message response function
let respond = null;

// contains the message data
let data = null;

// contains the mouse position retrieved from the message
const position = {
  x: 0,
  y: 0
}

// setup background/command message event listener
browser.runtime.onMessage.addListener(handleMessage);


/**
 * Called on popup load
 * Exports all necessary functions
 * Builds all html contents, sizes and positions the popup
 **/
function initialize () {
  // unwrap iframe window
  const popupWindow = Popup.contentWindow.wrappedJSObject;

  // export necessary event handler functions
  popupWindow.handleWheel = exportFunction(handleWheel, popupWindow);
  popupWindow.handleContextmenu = exportFunction(handleContextmenu, popupWindow);
  popupWindow.handleItemSelection = exportFunction(handleItemSelection, popupWindow);
  popupWindow.handleKeyDown = exportFunction(handleKeyDown, popupWindow);
  popupWindow.handleBlur = exportFunction(handleBlur, popupWindow);
  popupWindow.handleScrollButtonMouseover = exportFunction(handleScrollButtonMouseover, popupWindow);

  // add event listeners
  popupWindow.addEventListener("wheel", popupWindow.handleWheel, true);
  popupWindow.addEventListener("contextmenu", popupWindow.handleContextmenu, true);
  popupWindow.addEventListener("keydown", popupWindow.handleKeyDown, true);

  // create list
  const list = Popup.contentDocument.createElement("ul");
        list.id = "list";
  // map data to list items
  for (let element of data) {
    const item = Popup.contentDocument.createElement("li");
          item.classList.add("item");
          item.onclick = handleItemSelection;
          item.dataset.id = element.id;
    // add image icon if available
    if (element.icon) {
      const image = Popup.contentDocument.createElement("img");
            image.src = element.icon;
      item.appendChild(image);
    }
    // add label
    const text = Popup.contentDocument.createElement("span");
          text.textContent = element.label;
    item.appendChild(text);

    list.appendChild(item);
  }
  // append list
  Popup.contentDocument.body.appendChild(list);
  // focus Popup (some tweaks to ensure the focus)
  Popup.contentDocument.body.tabIndex = -1;
  document.activeElement.blur();
  Popup.contentDocument.body.focus();
  Popup.contentDocument.body.onblur = handleBlur;

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
    const buttonUp = Popup.contentDocument.createElement("div");
          buttonUp.classList.add("button", "up");
          buttonUp.onmouseover = handleScrollButtonMouseover;
    const buttonDown = Popup.contentDocument.createElement("div");
          buttonDown.classList.add("button", "down");
          buttonDown.onmouseover = handleScrollButtonMouseover;
    Popup.contentDocument.body.append(buttonUp, buttonDown);
  }

  // apply scale, position, dimensions to Popup / iframe and make it visible
  Popup.style.setProperty('width', Math.round(width) + 'px', 'important');
  Popup.style.setProperty('height', Math.round(height) + 'px', 'important');
  Popup.style.setProperty('transform-origin', `0 0`, 'important');
  Popup.style.setProperty('transform', `translate(${Math.round(x)}px, ${Math.round(y)}px)`, 'important');
  Popup.style.setProperty('opacity', '1', 'important');
}


/**
 * Terminates the popup and closes the messaging channel by responding
 * Also used to pass the selected item to the corresponding command
 **/
function terminate (message = null) {
  respond(message);
  Popup.remove();
  Popup.style.setProperty('opacity', '0', 'important');
}


/**
 * Handles background messages which request to create a popup
 * This also exposes necessary data and the specific respond function
 **/
function handleMessage (message, sender, sendResponse) {
  if (message.subject === "PopupRequest") {
    // store reference for other functions
    position.x = message.data.mousePosition.x - window.mozInnerScreenX;
    position.y = message.data.mousePosition.y - window.mozInnerScreenY;
    data = message.data.dataset;

    // expose response function
    respond = sendResponse;

    // popup is not working in a pure svg page thus do not append the popup
    if (document.documentElement.tagName.toUpperCase() === "SVG") return;
    
    // this will start loading the iframe content
    if (document.body.tagName.toUpperCase() === "FRAMESET")
      document.documentElement.appendChild(Popup);
    else document.body.appendChild(Popup);

    // keep the messaging channel open (https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent)
    return true;
  }
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
 * Passes the id of the selected item to the termination function
 **/
function handleItemSelection () {
  terminate(this.dataset.id);
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
  if (document.documentElement.contains(Popup) || document.body.contains(Popup)) {
    terminate();
  }
}