
export default {
  open: open,
  close: close,
  onClick: onClick
};

/**
 * Overlay "singleton"
 * shows or hides an overlay - only one overlay at the time can be displayed
 * onclick event listener can be added - they will get removed on overlay close
 * REQUIRES: overlay.css
 **/

// private variables

const document = window.top.document;

const overlay = document.createElement("div");
      overlay.classList.add("overlay", "o-hide");
      overlay.onclick = () => {
        // execute event handler
        eventHandler.forEach((callback) => callback());
      };

const eventHandler = [];

// public methods

/**
 * Show the overlay
 **/
function open () {
  if (!document.body.contains(overlay)) {
    document.body.appendChild(overlay);
    // trigger reflow
    overlay.offsetHeight;
    overlay.classList.replace("o-hide", "o-show");
  }
};


/**
 * Hide the overlay
 **/
function close () {
  if (document.body.contains(overlay)) {
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
    }, {once: true});
    overlay.classList.replace("o-show", "o-hide");
    // clear event handler array
    eventHandler.length = 0;
  }
};


/**
 * Add event handler which fire on overlay click and get removed on overlay close
 **/
function onClick (handler) {
  eventHandler.push(handler);
}
