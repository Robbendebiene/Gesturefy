import { rgbToHex, hexToRGB, getDistance } from "/core/commons.js";

import zoomController from "/core/workarounds/zoom-controller.content.js";

/**
 * MouseGestureInterface "singleton"
 * provides multiple functions to manipulate the overlay
 **/


// public methods and variables


export default {
  initialize: initialize,
  updateGestureTrace: updateGestureTrace,
  updateGestureCommand: updateGestureCommand,
  updateGestureDirections: updateGestureDirections,
  reset: reset,
  terminate: terminate,
  
  // gesture Trace styles

  get gestureTraceLineColor () {
    return Context.fillStyle;
  },
  set gestureTraceLineColor (value) {
    Context.fillStyle = value;
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

  get gestureTraceOpacity () {
    return Canvas.style.getProperty('opacity');
  },
  set gestureTraceOpacity (value) {
    Canvas.style.setProperty('opacity', value, 'important');
  },

  // gesture command styles

  get gestureCommandFontSize () {
    return Command.style.getProperty('font-size');
  },
  set gestureCommandFontSize (value) {
    Command.style.setProperty('font-size', value, 'important');
  },

  get gestureCommandTextColor () {
    return Command.style.getProperty('color');
  },
  set gestureCommandTextColor (value) {
    Command.style.setProperty('color', value, 'important');
  },

  get gestureCommandBackgroundColor () {
    const backgroundColorProperty = Command.style.getProperty('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );
    const colorArray = color.split(',').map(Number);
    return rgbToHex(...colorArray);
  },
  set gestureCommandBackgroundColor (value) {
    const backgroundColorProperty = Command.style.getProperty('background-color');
    const opacity = backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    );

    Command.style.setProperty(
      'background-color', 'rgba(' +
       hexToRGB(value).join(",") + ',' +
       opacity +
      ')', 'important'
    );
  },

  get gestureCommandBackgroundOpacity (value) {
    const backgroundColorProperty = Command.style.getProperty('background-color');
    return Number(backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    ));
  },
  set gestureCommandBackgroundOpacity (value) {
    const backgroundColorProperty = Command.style.getProperty('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );

    Command.style.setProperty(
      'background-color', 'rgba(' +
       color + ',' +
       value +
      ')', 'important'
    );
  },

  // gesture direction styles

  get gestureDirectionsFontSize () {
    return Directions.style.getProperty('font-size');
  },
  set gestureDirectionsFontSize (value) {
    Directions.style.setProperty('font-size', value, 'important');
  },

  get gestureDirectionsTextAlign () {
    return Directions.style.getProperty('text-align');
  },
  set gestureDirectionsTextAlign (value) {
    Directions.style.setProperty('text-align', value, 'important');
  },

  get gestureDirectionsTextColor () {
    return Directions.style.getProperty('color');
  },
  set gestureDirectionsTextColor (value) {
    Directions.style.setProperty('color', value, 'important');
  },

  get gestureDirectionsBackgroundColor () {
    const backgroundColorProperty = Directions.style.getProperty('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );
    const colorArray = color.split(',').map(Number);
    return rgbToHex(...colorArray);
  },
  set gestureDirectionsBackgroundColor (value) {
    const backgroundColorProperty = Directions.style.getProperty('background-color');
    const opacity = backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    );

    Directions.style.setProperty(
      'background-color', 'rgba(' +
       hexToRGB(value).join(",") + ',' +
       opacity +
      ')', 'important'
    );
  },

  get gestureDirectionsBackgroundOpacity (value) {
    const backgroundColorProperty = Directions.style.getProperty('background-color');
    return Number(backgroundColorProperty.substring(
      backgroundColorProperty.lastIndexOf(",") + 1, 
      backgroundColorProperty.lastIndexOf(")")
    ));
  },
  set gestureDirectionsBackgroundOpacity (value) {
    const backgroundColorProperty = Directions.style.getProperty('background-color');
    const color = backgroundColorProperty.substring(
      backgroundColorProperty.indexOf("(") + 1, 
      backgroundColorProperty.lastIndexOf(",")
    );

    Directions.style.setProperty(
      'background-color', 'rgba(' +
       color + ',' +
       value +
      ')', 'important'
    );
  }
};


/**
 * appand overlay and start drawing the gesture
 **/
function initialize (x, y) {
  // overlay is not working in a pure svg page thus do not append the overlay
  if (document.documentElement.tagName.toUpperCase() === "SVG") return;

  if (document.body.tagName.toUpperCase() === "FRAMESET") {
    document.documentElement.appendChild(Overlay);
  }
  else {
    document.body.appendChild(Overlay);
  }
  // convert point screen coordinates to css coordinates
  lastPoint.x = Math.round(x / zoomController.zoomFactor - window.mozInnerScreenX);
  lastPoint.y = Math.round(y / zoomController.zoomFactor - window.mozInnerScreenY);
}


/**
 * draw line for gesture
 */
function updateGestureTrace (points) {
  if (!Overlay.contains(Canvas)) Overlay.appendChild(Canvas);

  // temporary path in order draw all segments in one call
  const path = new Path2D();
  
  for (let point of points) {
    // convert point screen coordinates to css coordinates
    point.x = Math.round(point.x / zoomController.zoomFactor - window.mozInnerScreenX);
    point.y = Math.round(point.y / zoomController.zoomFactor - window.mozInnerScreenY);

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
  if (command) {
    if (!Overlay.contains(Command)) Overlay.appendChild(Command);
    Command.textContent = command;
  }
  else Overlay.removeChild(Command);
}


/**
 * update directions
 **/
function updateGestureDirections (directions) {
  if (!Overlay.contains(Directions)) Overlay.appendChild(Directions);
  // display the matching direction arrow symbols
  Directions.textContent = directions.join("");
}


/**
 * remove and reset all child elements
 **/
function reset () {
  if (Overlay.contains(Canvas)) {
    Overlay.removeChild(Canvas);
    Context.clearRect(0, 0, Canvas.width, Canvas.height);
    // reset trace line width
    lastTraceWidth = 0;
  }
  if (Overlay.contains(Command)) {
    Overlay.removeChild(Command);
    Command.textContent = "";
  }
  if (Overlay.contains(Directions)) {
    Overlay.removeChild(Directions);
    Directions.textContent = "";
  }
}


/**
 * remove overlay and reset overlay
 **/
function terminate () {
  Overlay.remove();
  reset();
}


// private variables and methods


// also used to caputre the mouse events over iframes
const Overlay = document.createElement("div");
      Overlay.style = `
        all: initial !important;
        position: fixed !important;
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 2147483647 !important;
      `;

const Canvas = document.createElement("canvas");
      Canvas.style = `
        all: initial !important;
      `;

const Context = Canvas.getContext('2d');

const Directions = document.createElement("div");
      Directions.style = `
        all: initial !important;
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        font-family: firefox-gesture-arrows !important;
        direction: rtl !important;
        letter-spacing: 0.3em !important;
        width: 100% !important;
        text-shadow: 0.01em 0.01em 0.07em rgba(0,0,0, 0.8) !important;
        padding: 0.2em 0.2em !important;
        white-space: nowrap !important;
      `;

const Command = document.createElement("div");
      Command.style = `
        all: initial !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -100%) !important;
        font-family: "NunitoSans Regular", "Arial", sans-serif !important;
        line-height: normal !important;
        text-shadow: 0.01em 0.01em 0.1em rgba(0,0,0, 0.8) !important;
        text-align: center !important;
        padding: 0.4em 0.4em 0.3em !important;
        border-radius: 0.07em !important;
        font-weight: bold !important;
      `;


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
    lineCap: Context.fillStyle,
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