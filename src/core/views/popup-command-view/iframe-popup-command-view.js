/**
 * PopupCommandView
 * Listens for "PopupConnection" background connection and displays the message dataset
 * An iframe is used in order to protect the user data from webpages that may try to read or manipulate the contents of the popup
 **/

// save a reference to the current channel
let channel = null;

browser.runtime.onConnect.addListener(handleConnection);

// add event listeners
window.addEventListener("contextmenu", handleContextmenu, true);

/**
 * Builds all popup html contents
 * Requires the background/command message containing the dataset
 **/
function initialize (dataset) {
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

  // use resize observer to reliably get dimensions after reflow/layout
  // otherwise if using offsetHeight or getBoundingBox even with setTimeout
  // the dimensions of the list element sometimes equal 0
  const resizeObserver = new ResizeObserver(async (entries) => {
	  const lastEntry = entries.pop();

    // the width and height the list occupies
    const requiredDimensions = {
      width: lastEntry.borderBoxSize.inlineSize,
      height: lastEntry.borderBoxSize.blockSize
    }

    resizeObserver.disconnect();

    // initiate popup display
    // also get the available width and height
    const availableDimensions =  await browser.runtime.sendMessage({
      subject: "popupInitiation",
      data: requiredDimensions
    });

    // focus popup frame
    window.focus();
    window.onblur = terminate;

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
  });

  // start observing and append the list element
  resizeObserver.observe(list, { box: "border-box" });

  document.body.appendChild(list);
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
    channel.onMessage.addListener(initialize);
    channel.onDisconnect.addListener(terminate);
  }
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