/**
 * Helper function to easily mixin additional functionality into commands.
 *
 * Usage:
 * ```js
 * class MainCommand extends mix(Command).with(MixinA, MixinB) {
 *   ...
 * }
 * ```
 */
export const mix = (Base) => ({
  with: (...mixins) => mixins.reduce((c, m) => m(c), Base)
});


/**
 * Mixin for commands that open a new tab.
 */
export const NewTabCommand = (Base) => class extends Base {
  /**
   * Returns the index of the new tab based on the settings.
   */
  getNewTabIndex(sender) {
    switch (this.settings.position) {
      case "before": return sender.tab.index;
      case "after": return sender.tab.index + 1;
      case "start": return 0;
      case "end": return Number.MAX_SAFE_INTEGER;
      // default behaviour - insert new tabs as adjacent children
      // depends on browser.tabs.insertRelatedAfterCurrent and browser.tabs.insertAfterCurrent
      default: return null;
    }
  }
};


/**
 * Mixin for commands that require an URL either from text selection, target link or clipboard.
 */
export const GetURLCommand = (Base) => class extends Base {
  /**
   * Returns a legal (non-privileged) URL from the text selection or target link.
   * If no URL can be extracted it will return null.
   **/
  getURLFromContext(data, {allowPrivileged = false} = {}) {
    const selectionURL = this.getURLFromSelection(data);
    if (selectionURL) return selectionURL;
    // check if the provided url can be opened by webextensions (is not privileged)
    else if (data.link?.href && (allowPrivileged || this.isLegalURL(data.link.href))) return data.link.href;
    return null;
  }

  /**
   * Returns a http/https URL from the text selection.
   * If no URL can be extracted it will return null.
   **/
  getURLFromSelection(data) {
    // only allow http/https urls to open from text selection to better mimic Firefox's behaviour
    if (this.isHTTPURL(data.selection.text)) return data.selection.text.trim();
    // if selected text matches the format of a domain name add the missing protocol
    else if (this.isDomainName(data.selection.text)) return "http://" + data.selection.text.trim();
    return null;
  }

  /**
   * Returns a legal (non-privileged) URL from the clipboard.
   * If no URL can be extracted it will return null.
   **/
  async getURLFromClipboard() {
    const clipboardText = await navigator.clipboard.readText();
    // check if the provided url can be opened by webextensions (is not privileged)
    if (this.isLegalURL(clipboardText)) return clipboardText.trim();
    // if clipboard text matches the format of a domain name add the missing protocol
    else if (this.isDomainName(clipboardText)) return "http://" + clipboardText.trim();
    return null;
  }

  /**
   * Check if the given string is an URL that points to a non-privileged url.
   **/
  isLegalURL(string) {
    const privilegedURLProtocols = ["chrome:", "about:", "data:", "javascript:", "file:"];
    const exceptedURLs = ["about:blank"];

    try {
      const url = new URL(string);
      if (privilegedURLProtocols.includes(url.protocol) && !exceptedURLs.includes(url.href)) {
        return false;
      }
    }
    catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Check if the given string is http/https url.
   **/
  isHTTPURL (string) {
    try {
      const url = new URL(string);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return true;
      }
    }
    catch (e) {}
    return false;
  }

  /**
   * Check if the given string matches the format of a domain
   * top level domain must be at least 2 characters long
   * ignores whitespaces at the start and end of the string
   * the check is case insensitive
   **/
  isDomainName (string) {
    return /^\s*([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}\s*$/i.test(string);
  }
};


/**
 * Mixin for commands that must match a number in the URL.
 */
export const MatchURLNumberCommand = (Base) => class extends Base {
  /**
   * Returns the regex pattern that matches the number in the URL.
   */
  getNumberPattern() {
    // get user defined regex or use regex that matches the last number occurrence
    // the regex matches number between or at the end of slashes (e.g. /23/)
    // and the values of query parameters (e.g. ?param=23)
    // therefore it should ignore numbers in the domain, port and hash
    // the regex is used on the whole url to give users with custom regex more control
    if (this.settings.regex) {
      return RegExp(this.settings.regex);
    }
    else {
      // matches /<NUMBER>(/|?|#|END)
      const matchBetweenSlashes = /(?<=\/)(\d+)(?=[\/?#]|$)/;
      // matches (?|&)parameter=<NUMBER>(?|&|#|END)
      const matchQueryParameterValue = /(?<=[?&]\w+=)(\d+)(?=[?&#]|$)/;
      // combine regex patterns and use negative lookahead to match the last occurrence
      return new RegExp(
        "((" + matchBetweenSlashes.source + ")|(" + matchQueryParameterValue.source + "))" +
        "(?!.*((" + matchBetweenSlashes.source + ")|(" + matchQueryParameterValue.source + ")))"
      );
    }
  }
};


/**
 * Mixin for commands that open a popup.
 */
export const PopupCommand = (Base) => class extends Base {

  /**
   * The content argument must be an array of objects with the properties: id, label and icon.
   *
   * The response handler must be a function with two arguments:
   * message: a message object sent by the popup
   * close: a function that closes the popup
   *
   * The close function must be called eventually to close the popup.
   **/
  async openPopup({
    context,
    content,
    responseHandler,
  }) {
    // request popup creation and wait for response
    const popupCreatedSuccessfully = await browser.tabs.sendMessage(context.sender.tab.id, {
      subject: "popupRequest",
      data: {
        mousePositionX: context.mouse.endpoint.x,
        mousePositionY: context.mouse.endpoint.y
      },
    }, { frameId: 0 });

    // if popup creation failed exit this command function
    if (!popupCreatedSuccessfully) return;

    const channel = browser.tabs.connect(context.sender.tab.id, {
      name: "PopupConnection"
    });

    channel.postMessage(content);

    channel.onMessage.addListener((message) => {
      responseHandler(message, channel.disconnect);
    });
  }
};


/**
 * Mixin for scrolling commands.
 **/
export const ScrollCommand = (Base) => class extends Base {

  /**
   * Scrolls in the given tab.
   * The direction and distance is determined by the given scrollBy value.
   * If the scrollBy value is +-Infinity it will scroll to the bottom/top.
   * If dryRun is true the scroll will be simulated but not executed.
   * Returns true if the scrolling is successful else false.
   */
  async tryScrollInTab(sender, scrollBy, duration, dryRun = false) {

    /// Injected as a content script.
    /// This must therefore include all used variables and functions.
    function contentScript ({scrollBy, duration, scrollDocument = false, dryRun = false} = {}) {

      /**
       * Returns the closest html parent element that matches the conditions of the provided test function or null
       **/
      function getClosestElement (startNode, testFunction) {
        let node = startNode;
        // weak comparison to check for null OR undefined
        while (node != null && !testFunction(node)) {
          // second condition allows traversing up shadow DOMs
          node = node.parentElement ?? node.parentNode?.host;
        }
        return node;
      }

      /**
       * Checks if an element has a vertical scrollbar
       **/
      function isScrollableY (element) {
        if (!(element instanceof Element)) {
          return false;
        }
        const style = window.getComputedStyle(element);

        if (element.scrollHeight > element.clientHeight &&
            style["overflow-y"] !== "hidden" &&
            style["overflow-y"] !== "clip"
        ) {
          if (element === document.scrollingElement) {
            return true;
          }
          // exception for textarea elements
          else if (element.tagName.toLowerCase() === "textarea") {
            return true;
          }
          // normal elements with display inline can never be scrolled
          else if (style["overflow-y"] !== "visible" && style["display"] !== "inline") {
            // special check for body element (https://drafts.csswg.org/cssom-view/#potentially-scrollable)
            if (element === document.body) {
              const parentStyle = window.getComputedStyle(element.parentElement);
              if (parentStyle["overflow-y"] !== "visible" && parentStyle["overflow-y"] !== "clip") {
                return true;
              }
            }
            else {
              return true;
            }
          }
        }
        return false;
      }

      const EASING_FUNCTIONS = {
        // fast in - slow out: sin((pi/2) * x)
        // https://www.wolframalpha.com/input?i=y+%3D+sin%28%28pi%2F2%29*x%29+for+x%3E%3D0%2C+x+%3C%3D+1
        fastInSlowOut: (x) => Math.sin(Math.PI/2 * x),
        // slow in - fast out: cos((pi/2)*x +pi ) + 1
        // https://www.wolframalpha.com/input?i=y+%3D+cos%28%28pi%2F2%29*x+%2Bpi+%29+%2B+1+for+x%3E%3D0%2C+x+%3C%3D+1
        slowInFastOut: (x) => Math.cos(Math.PI/2 * x + Math.PI) + 1,
        // slow in - slow out: 1/2 * (cos((x * pi) + pi) + 1)
        // https://www.wolframalpha.com/input?i=y+%3D+1%2F2+*+%28cos%28%28x+*+pi%29+%2B+pi%29+%2B+1%29+for+x%3E%3D0%2C+x+%3C%3D+1
        slowInSlowOut: (x) => 0.5 * (Math.cos((x * Math.PI) + Math.PI) + 1)
      }

      /**
       * Smooth scrolling to a given x/y position
       * duration: scroll duration in milliseconds; default is 0 (no transition)
       * element: the html element that should be scrolled; default is the main scrolling element
       * easingFunction: the easing function to use; default is EASING_FUNCTIONS.slowInSlowOut
       **/
      function smoothScrollTo ({
        top,
        left,
        duration = 0,
        element = document.scrollingElement,
        easingFunction = EASING_FUNCTIONS.slowInSlowOut
      }) {
        // save starting scroll positions
        const startTop = element.scrollTop, startLeft = element.scrollLeft;
        // if unset assign current position so scrolling has no affect for this axis
        top ??= startTop;
        left ??= startLeft;
        // clamp top position between 0 and max scroll position
        top = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, top));
        left = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, left));
        // cancel if already on target position
        if (startTop === top && startLeft === left) return;
        // calculate scroll distance for each axis
        const distanceTop = top - startTop, distanceLeft = left - startLeft;

        let x = 0, prevTimestamp = null;

        function step (newTimestamp) {
          // if duration is 0 x will be Infinity
          x += (newTimestamp - prevTimestamp) / duration;
          // clamp x to 1
          x = Math.min(x, 1);
          // calculate proportional fraction based on given easing function
          const fraction = easingFunction(x);
          // jump to scroll position
          element.scroll({
            top: startTop + fraction * distanceTop,
            left: startLeft + fraction * distanceLeft,
            behavior: 'instant'
          });
          // exit function when finished
          if (x >= 1) return;
          // restart function again on next frame
          prevTimestamp = newTimestamp;
          window.requestAnimationFrame(step);
        }
        // use first frame to initialize the timestamp
        window.requestAnimationFrame((timestamp) => {
          prevTimestamp = timestamp;
          window.requestAnimationFrame(step);
        });
      }

      // content script main code

      // infinity cannot be passed/serialized therefore convert back from string
      switch (scrollBy) {
        case '+Infinity':
          scrollBy = Infinity;
          break;
        case '-Infinity':
          scrollBy = -Infinity;
          break;
      }

      const scrollableElement = scrollDocument
        ? isScrollableY(document.scrollingElement) ? document.scrollingElement : null
        : getClosestElement(TARGET, isScrollableY);

      const hasScrollableElement = Boolean(scrollableElement);
      if (hasScrollableElement) {
        // calc new scrollTop position, maybe be +-Infinity if scrollBy is +-Infinity
        let newScrollTop = scrollableElement.scrollTop + scrollableElement.clientHeight * scrollBy;
        // clamp top position between 0 and max scroll position
        newScrollTop = Math.max(0, Math.min(scrollableElement.scrollHeight - scrollableElement.clientHeight, newScrollTop));
        // check if scrollTop has changed
        if (scrollableElement.scrollTop !== newScrollTop) {
          if (!dryRun) {
            smoothScrollTo({
              top: newScrollTop,
              element: scrollableElement,
              duration: duration
            });
          }
          return [hasScrollableElement, true];
        }
      }
      return [hasScrollableElement, false];
    }

    // content script end \\

    // infinity cannot be passed/serialized therefore convert to string
    switch (scrollBy) {
      case Infinity:
        scrollBy = '+Infinity';
        break;
      case -Infinity:
        scrollBy = '-Infinity';
        break;
      default:
        scrollBy = Number(scrollBy);
        break;
    }

    // returns true if there exists a scrollable element in the injected frame
    // which can be scrolled upwards else false
    let [{result: [hasScrollableElement, canScroll]}] = await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [ sender.frameId ?? 0 ]
      },
      injectImmediately: true,
      func: contentScript,
      args: [{
        scrollBy: scrollBy,
        duration: Number(duration),
        dryRun: Boolean(dryRun)
      }]
    });
    // if there was no scrollable element and the gesture was triggered from a frame
    // try scrolling the main scrollbar of the main frame
    if (!hasScrollableElement && sender.frameId !== 0) {
      [{result: [hasScrollableElement, canScroll]}] = await browser.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [ 0 ]
        },
        injectImmediately: true,
        func: contentScript,
        args: [{
          scrollBy: scrollBy,
          duration: Number(duration),
          scrollDocument: true,
          dryRun: Boolean(dryRun)
        }]
      });
    }
    // confirm success/failure
    return canScroll;
  }
};
