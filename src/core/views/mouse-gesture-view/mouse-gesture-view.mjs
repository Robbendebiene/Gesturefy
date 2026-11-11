import { getDistance } from "/core/utils/commons.mjs";

import { patternToPoints, createCatmullRomSVGPath } from "/core/utils/gesture-pattern-renderer.mjs";

/**
 * MouseGestureView "singleton"
 * provides multiple functions to manipulate the overlay
 **/


// public methods and variables


export default {
  initialize: initialize,
  updateGestureTrace: updateGestureTrace,
  updateGestureCommand: updateGestureCommand,
  updateGesturePattern: updateGesturePattern,
  terminate: terminate,

  // gesture Trace styles

  get gestureTraceLineColor () {
    const rgbHex = Context.fillStyle;
    const alpha = parseFloat(Canvas.style.getPropertyValue("opacity")) || 1;
    let aHex = Math.round(alpha * 255).toString(16);
    // add leading zero if string length is 1
    if (aHex.length === 1) aHex = "0" + aHex;
    return rgbHex + aHex;
  },
  set gestureTraceLineColor (value) {
    const rgbHex = value.substring(0, 7);
    const aHex = value.slice(7);
    const alpha = parseInt(aHex, 16)/255;
    Context.fillStyle = rgbHex;
    Canvas.style.setProperty("opacity", alpha, "important");
  },

  get gestureTraceLineWidth () {
    return gestureTraceLineWidth;
  },
  set gestureTraceLineWidth (value) {
    gestureTraceLineWidth = value;
  },

  get gestureTraceLineGrowth () {
    return gestureTraceLineGrowth;
  },
  set gestureTraceLineGrowth (value) {
    gestureTraceLineGrowth = Boolean(value);
  },

  // gesture command styles

  get gestureCommandFontSize () {
    return Label.style.getPropertyValue('font-size');
  },
  set gestureCommandFontSize (value) {
    Label.style.setProperty('font-size', value, 'important');
  },

  get gestureCommandFontColor () {
    return Label.style.getPropertyValue('color');
  },
  set gestureCommandFontColor (value) {
    Label.style.setProperty('color', value, 'important');
  },

  get gestureCommandBackgroundColor () {
    return Command.style.getPropertyValue('background-color');
  },
  set gestureCommandBackgroundColor (value) {
    Command.style.setProperty('background-color', value, 'important');
  },

  get gestureCommandFontFamily () {
    return Label.style.getPropertyValue('font-family');
  },
  set gestureCommandFontFamily (value) {
    Label.style.setProperty('font-family', value, 'important');
  },

  get gestureCommandBorderRadius () {
    return Command.style.getPropertyValue('border-radius');
  },
  set gestureCommandBorderRadius (value) {
    Command.style.setProperty('border-radius', value, 'important');
  },

  get gestureCommandPadding () {
    return Command.style.getPropertyValue('padding');
  },
  set gestureCommandPadding (value) {
    Command.style.setProperty('padding', value, 'important');
  },

  get gestureCommandWidth () {
    return Command.style.getPropertyValue('width');
  },
  set gestureCommandWidth (value) {
    const width = (!value || value === 'auto') ? 'max-content' : value;
    Command.style.setProperty('width', width, 'important');
    // keep the default 50vw cap for auto, but allow configured widths up to the viewport width
    Command.style.setProperty('max-width', width === 'max-content' ? '50vw' : '100vw', 'important');
  },

  get gestureCommandHorizontalPosition () {
    return parseFloat(Command.style.getPropertyValue("--horizontalPosition"));
  },
  set gestureCommandHorizontalPosition (value) {
    Command.style.setProperty("--horizontalPosition", value);
  },

  get gestureCommandVerticalPosition () {
    return parseFloat(Command.style.getPropertyValue("--verticalPosition"));
  },
  set gestureCommandVerticalPosition (value) {
    Command.style.setProperty("--verticalPosition", value);
  }
};


/**
 * append overlay and start drawing the gesture
 **/
function initialize (x, y) {
  // overlay is not working in a pure svg or other xml pages thus do not append the overlay
  if (!document.body && document.documentElement.namespaceURI !== "http://www.w3.org/1999/xhtml") {
    return;
  }
  if (document.body.tagName.toUpperCase() === "FRAMESET") {
    document.documentElement.appendChild(Overlay);
  }
  else {
    document.body.appendChild(Overlay);
  }
  Overlay.showPopover();
  // store starting point
  lastPoint.x = x;
  lastPoint.y = y;
}


/**
 * draw line for gesture
 */
function updateGestureTrace (points) {
  if (!Overlay.contains(Canvas)) Overlay.appendChild(Canvas);

  // temporary path in order draw all segments in one call
  const path = new Path2D();

  for (let point of points) {
    if (gestureTraceLineGrowth && lastTraceWidth < gestureTraceLineWidth) {
      // the length in pixels after which the line should be grown to its final width
      // in this case the length depends on the final width defined by the user
      const growthDistance = gestureTraceLineWidth * 50;
      // the distance from the last point to the current
      const distance = getDistance(lastPoint.x, lastPoint.y, point.x, point.y);
      // cap the line width by its final width value
      const currentTraceWidth = Math.min(
        lastTraceWidth + distance / growthDistance * gestureTraceLineWidth,
        gestureTraceLineWidth
      );
      const pathSegment = createGrowingLine(lastPoint.x, lastPoint.y, point.x, point.y, lastTraceWidth, currentTraceWidth);
      path.addPath(pathSegment);

      lastTraceWidth = currentTraceWidth;
    }
    else {
      const pathSegment = createGrowingLine(lastPoint.x, lastPoint.y, point.x, point.y, gestureTraceLineWidth, gestureTraceLineWidth);
      path.addPath(pathSegment);
    }

    lastPoint.x = point.x;
    lastPoint.y = point.y;
  }
  // draw accumulated path segments
  Context.fill(path);
}


/**
 * update command on match
 **/
function updateGestureCommand (command) {
  if (command && Overlay.isConnected) {
    Label.textContent = command;
    if (!Command.contains(Label)) Command.appendChild(Label);
    if (!Overlay.contains(Command)) Overlay.appendChild(Command);
  }
  else {
    Label.textContent = "";
    Label.remove();
    // remove the overlay container if the gesture pattern isn't displayed either
    if (!Command.contains(Pattern)) Command.remove();
  }
}


/**
 * update matched gesture pattern on match
 **/
function updateGesturePattern (pattern) {
  if (pattern && pattern.length > 0 && Overlay.isConnected) {
    Pattern.replaceChildren(createGestureThumbnail(pattern));
    if (!Command.contains(Pattern)) Command.prepend(Pattern);
    if (!Overlay.contains(Command)) Overlay.appendChild(Command);
  }
  else {
    Pattern.remove();
    // remove the overlay container if the command text isn't displayed either
    if (!Command.contains(Label)) Command.remove();
  }
}


/**
 * remove and reset overlay
 **/
function terminate () {
  Overlay.hidePopover();
  Overlay.remove();
  Canvas.remove();
  Command.remove();
  // clear canvas
  Context.clearRect(0, 0, Canvas.width, Canvas.height);
  // reset trace line width
  lastTraceWidth = 0;
  Pattern.remove();
  Label.remove();
  Label.textContent = "";
}


// private variables and methods

// use HTML namespace so proper HTML elements will be created even in foreign doctypes/namespaces (issue #565)

const Overlay = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
      Overlay.popover = "manual";
      Overlay.style = `
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;

        pointer-events: none !important;
      `;

const Canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
      Canvas.style = `
        all: initial !important;

        pointer-events: none !important;
      `;

const Context = Canvas.getContext('2d');
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const Command = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
      Command.style = `
        --horizontalPosition: 0;
        --verticalPosition: 0;
        all: initial !important;
        position: absolute !important;
        top: calc(var(--verticalPosition) * 1%) !important;
        left: calc(var(--horizontalPosition) * 1%) !important;
        transform: translate(calc(var(--horizontalPosition) * -1%), calc(var(--verticalPosition) * -1%)) !important;
        padding: 0.4em 0.4em 0.3em !important;
        background-color: rgba(0,0,0,0) !important;
        border-radius: 0px !important;
        width: max-content !important;
        max-width: 50vw !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;

        pointer-events: none !important;
      `;

const Pattern = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
      Pattern.style = `
        all: initial !important;
        display: block !important;
        margin-bottom: 0.2em !important;
        pointer-events: none !important;
      `;

const Label = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
      Label.style = `
        all: initial !important;
        display: block !important;
        font-family: "NunitoSans Regular", "Arial", sans-serif !important;
        line-height: normal !important;
        text-shadow: 0.01em 0.01em 0.01em rgba(0,0,0, 0.5) !important;
        text-align: center !important;
        font-weight: bold !important;
        max-width: 100% !important;
        pointer-events: none !important;
      `;

Command.append(Pattern, Label);


let gestureTraceLineWidth = 10,
    gestureTraceLineGrowth = true;


let lastTraceWidth = 0,
    lastPoint = { x: 0, y: 0 };


// resize canvas on window resize
window.addEventListener('resize', maximizeCanvas, true);
maximizeCanvas();


/**
 * Adjust the canvas size to the size of the window
 **/
function maximizeCanvas () {
  // save context properties, because they get cleared on canvas resize
  const tmpContext = {
    lineCap: Context.lineCap,
    lineJoin: Context.lineJoin,
    fillStyle: Context.fillStyle,
    strokeStyle: Context.strokeStyle,
    lineWidth: Context.lineWidth
  };

  Canvas.width = window.innerWidth;
  Canvas.height = window.innerHeight;

  // restore previous context properties
  Object.assign(Context, tmpContext);
}


/**
 * creates a growing line from a starting point and strike width to an end point and stroke width
 * returns a path 2d object
 **/
function createGrowingLine (x1, y1, x2, y2, startWidth, endWidth) {
  // calculate direction vector of point 1 and 2
  const directionVectorX = x2 - x1,
        directionVectorY = y2 - y1;
  // calculate angle of perpendicular vector
  const perpendicularVectorAngle = Math.atan2(directionVectorY, directionVectorX) + Math.PI/2;
  // construct shape
  const path = new Path2D();
        path.arc(x1, y1, startWidth/2, perpendicularVectorAngle, perpendicularVectorAngle + Math.PI);
        path.arc(x2, y2, endWidth/2, perpendicularVectorAngle + Math.PI, perpendicularVectorAngle);
        path.closePath();
  return path;
}


/**
 * Creates and returns an svg element that visualizes the given gesture pattern
 **/
function createGestureThumbnail (pattern) {
  const viewBoxWidth = 100;
  const viewBoxHeight = 100;
  const padding = 15;

  // convert vector array to points starting at 0, 0
  const points = patternToPoints(pattern);

  // compute bounding box of the pattern
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const patternWidth = maxX - minX;
  const patternHeight = maxY - minY;

  // scale pattern to fit the viewBox while keeping a padding (handle zero dimensions gracefully)
  const availableWidth = Math.max(viewBoxWidth - padding * 2, 1);
  const availableHeight = Math.max(viewBoxHeight - padding * 2, 1);
  const scale = (patternWidth || patternHeight)
    ? Math.min(availableWidth / (patternWidth || 1), availableHeight / (patternHeight || 1))
    : 1;

  // center the scaled pattern in the viewBox
  const offsetX = (viewBoxWidth - patternWidth * scale) / 2 - minX * scale;
  const offsetY = (viewBoxHeight - patternHeight * scale) / 2 - minY * scale;

  const scaledPoints = points.map(point => ({
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY
  }));

  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
        svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.cssText = `
          all: initial !important;
          display: block !important;
          width: 96px !important;
          height: 96px !important;
          overflow: visible !important;
          pointer-events: none !important;
        `;

  const group = document.createElementNS(SVG_NAMESPACE, 'g');

  const trail = createCatmullRomSVGPath(scaledPoints);
        trail.style.cssText = `
          fill: none !important;
          stroke: ${Context.fillStyle} !important;
          stroke-width: 10 !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
        `;

        group.append(trail, createDirectionArrow(scaledPoints));
        svg.append(group);

  return svg;
}


/**
 * Creates an arrow head at the end of the given points indicating the gesture direction
 **/
function createDirectionArrow (points) {
  const arrow = document.createElementNS(SVG_NAMESPACE, 'path');

  if (points.length < 2) return arrow;

  const tip = points[points.length - 1];
  const previous = points[points.length - 2];

  const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x);
  const arrowLength = 30;
  const arrowWidth = 16;
  // push the tip past the stroke end so the rounded line cap doesn't cover it
  const overhang = 10;

  const arrowTip = {
    x: tip.x + Math.cos(angle) * overhang,
    y: tip.y + Math.sin(angle) * overhang
  };
  const base = {
    x: arrowTip.x - Math.cos(angle) * arrowLength,
    y: arrowTip.y - Math.sin(angle) * arrowLength
  };
  const left = {
    x: base.x - Math.sin(angle) * arrowWidth,
    y: base.y + Math.cos(angle) * arrowWidth
  };
  const right = {
    x: base.x + Math.sin(angle) * arrowWidth,
    y: base.y - Math.cos(angle) * arrowWidth
  };

  arrow.setAttribute('d', `M${left.x},${left.y} L${arrowTip.x},${arrowTip.y} L${right.x},${right.y} Z`);
  arrow.style.cssText = `
    fill: ${Context.fillStyle} !important;
    stroke: none !important;
  `;

  return arrow;
}
