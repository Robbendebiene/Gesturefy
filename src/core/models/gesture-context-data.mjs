/**
 * This class contains any data of the context a gesture is performed in.
 * The data can be automatically collected using the "fromElement" constructor method.
 *
 * This data is required and used by commands.
 **/
export default class GestureContextData {

  target; link; selection; mouse;

  constructor ({
    target = new ElementData(),
    link = null,
    selection = new SelectionData(),
    mouse = new MouseData(),
  } = {}) {
    this.target = target;
    this.link = link;
    this.selection = selection;
    this.mouse = mouse;
  }

  static fromEvent (event) {
    // use composedPath to get true target inside shadow DOMs
    // because for elements using shadow DOM the "event.target" property will not be the "lowest" element
    const composedPath = event.composedPath();
    // fallback to original target element
    const target = composedPath[0] ?? event.target;
    // get closest link
    const link = composedPath.find((e) => {
      const nodeName = e?.nodeName?.toLowerCase();
      return nodeName === 'a' || nodeName === 'area';
    });

    return new GestureContextData({
      target: new ElementData({
        nodeName: target.nodeName,
        src: target.currentSrc ?? target.src ?? null,
        title: target.title ?? null,
        alt: target.alt ?? null,
        textContent: target.textContent?.trim(),
      }),
      selection: SelectionData.fromWindow(),
      link: (link)
        ? new LinkData({
          href: link.href ?? null,
          title: link.title ?? null,
          textContent: link.textContent?.trim()
        })
        : null,
      mouse: new MouseData({
        endpoint: {
          // transform coordinates to css screen coordinates
          x: event.clientX + window.mozInnerScreenX,
          y: event.clientY + window.mozInnerScreenY
        }
      })
    });
  }
}


export class ElementData {
  nodeName;
  src; title; alt;
  textContent;

  constructor ({
    nodeName = null,
    src = null,
    title = null,
    alt = null,
    textContent = null,
  } = {}) {
    this.nodeName = nodeName;
    this.src = src;
    this.title = title;
    this.alt = alt;
    this.textContent = textContent;
  }
}


export class LinkData {
  href; title;
  textContent;

  constructor ({
    href = null,
    title = null,
    textContent = null,
  } = {}) {
    this.href = href;
    this.title = title;
    this.textContent = textContent;
  }
}


export class SelectionData {
  text;

  constructor ({
    text = '',
  } = {}) {
    this.text = text;
  }

  static fromWindow () {
    return new SelectionData({
      text: SelectionData._getTextSelection(),
    });
  }

  /**
   * returns the selected text, if no text is selected it will return an empty string
   * inspired by https://stackoverflow.com/a/5379408/3771196
   **/
  static _getTextSelection () {
    // get input/textfield text selection
    if (document.activeElement &&
        typeof document.activeElement.selectionStart === 'number' &&
        typeof document.activeElement.selectionEnd === 'number') {
          return document.activeElement.value.slice(
            document.activeElement.selectionStart,
            document.activeElement.selectionEnd
          );
    }
    // get normal text selection
    return window.getSelection().toString();
  }
}


export class MouseData {
  endpoint;

  constructor ({
    endpoint = null,
  } = {}) {
    this.endpoint = endpoint;
  }
}
