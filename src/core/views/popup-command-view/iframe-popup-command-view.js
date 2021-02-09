/**
 * PopupCommandView
 * Listens for "PopupConnection" background connection and displays the message dataset
 * An iframe is used in order to protect the user data from webpages that may try to read or manipulate the contents of the popup
 **/

// save a reference to the current channel
let channel = null;

browser.runtime.onConnect.addListener(handleConnection);

/**
 * Builds all popup html contents
 **/
function initialize (dataset) {
  // add event listeners
  window.addEventListener("contextmenu", handleContextmenu, true);
  window.addEventListener("keydown", handleKeyDown, true);

  // create list
  const list = document.createElement("ul");
        list.id = "list";
  // map data to list items
  for (let element of dataset) {
    const item = document.createElement("li");
          item.classList.add("item");
          item.onpointerup = handleItemSelection;
          item.dataset.id = element.id;
    // add image icon if available
    if (element.icon) {
      const image = document.createElement("img");
            image.src = element.icon;
      item.appendChild(image);
    }
    // add label
    const text = document.createElement("span");
          text.textContent = element.label;
    item.appendChild(text);

    list.appendChild(item);
  }
  // append list
  document.body.appendChild(list);

  // append the code to the end of the event queue/wait untill the brwoser finished the reflow/repaint
  // otherwise sometimes the dimensions of the list element are 0 due to a race condition
  setTimeout(async () => {
    // the width and height the list occupies
    const requiredDimensions = {
      width: list.scrollWidth,
      height: list.scrollHeight
    }
    // initiate popup display
    // also get the available width and height
    const availableDimensions =  await browser.runtime.sendMessage({
      subject: "popupInitiation",
      data: requiredDimensions
    });

    // focus popup frame
    window.focus();
    window.onblur = handleBlur;

    // add scroll buttons if list is scrollable
    if (availableDimensions.height < requiredDimensions.height) {
      const buttonUp = document.createElement("div");
            buttonUp.classList.add("button", "up");
            buttonUp.onmouseover = handleScrollButtonMouseover;
      const buttonDown = document.createElement("div");
            buttonDown.classList.add("button", "down");
            buttonDown.onmouseover = handleScrollButtonMouseover;
      document.body.append(buttonUp, buttonDown);
    }
  }, 0);
}


/**
 * Closes the messaging channel and sends the popup termination message to close the popup
 **/
function terminate () {
  // disconnect channel
  channel.disconnect();
  // close/remove popup
  browser.runtime.sendMessage({
    subject: "popupTermination"
  });
}


/**
 * Handles background connection requests
 **/
function handleConnection (port) {
  if (port.name === "PopupConnection") {
    // save reference to port object
    channel = port;
    // add listener
    channel.onMessage.addListener(handleMessage);
    channel.onDisconnect.addListener(handleDisconnect);
  }
}


/**
 * Handles the background/command message containing the dataset as the message
 * Runs the popup initialization
 **/
function handleMessage (message) {
  initialize(message);
}


/**
 * Handles the channel disconnection from the background
 * Terminates the popup
 **/
function handleDisconnect (port) {
  terminate();
}


/**
 * Prevents the context menu because of design reason and for rocker gesture conflicts
 **/
function handleContextmenu (event) {
  event.preventDefault();
}


/**
 * Passes the id of the selected item to the corresponding command
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
  if (event.key === "ArrowUp") {
    window.scrollBy(0, -28);
  }
  else if (event.key === "ArrowDown") {
    window.scrollBy(0, 28);
  }
}


/**
 * Handles the up and down controls
 **/
function handleScrollButtonMouseover (event) {
  const direction = this.classList.contains("up") ? -4 : 4;
  const button = event.currentTarget;

  function step (timestamp) {
    if (!button.matches(':hover')) return;
    window.scrollBy(0, direction);
    window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
}


/**
 * Handles the blur event and terminates the popup
 **/
function handleBlur () {
  terminate();
}