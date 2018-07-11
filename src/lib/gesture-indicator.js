'use strict'


/**
 * GestureIndicator "singleton" class using the module pattern
 * handles the representation of the gesture handler indicators
 * on default the handler is disabled and must be enabled via enable()
 * REQUIRES: contentCommons.js and gestureHandler.js
 **/
const GestureIndicator = (function() {

// public variables and methods

  const module = {};

	/**
	 * Add the event listener if settings were applied
	 **/
  module.enable = function enable () {
		if (Settings) {
			// setup GestureHandler event callbacks
			GestureHandler
				.on("start", initializeOverlay)
				.on("update", updateCanvas)
				.on("change", updateDirections)
				.on("change", updateCommand)
        .on("abort", resetOverlay)
				.on("end", terminateOverlay);
		}
  };


	/**
	 * Saves the current settings and applies all custom styles to the html elements
	 **/
	module.applySettings = function applySettings (settings) {
    if (!Settings) initialize();

		// save settings to private variable
		Settings = settings;

		Canvas.style.setProperty('opacity', Settings.Gesture.Trace.Style.opacity, 'important');
		maximizeCanvas();

		// assign all css properties defined in the Settings.Directions
		Directions.style.setProperty('font-size', Settings.Gesture.Directions.Style.fontSize, 'important');
		Directions.style.setProperty('text-align', Settings.Gesture.Directions.Style.textAlign, 'important');
		Directions.style.setProperty('color', Settings.Gesture.Directions.Style.color, 'important');
		Directions.style.setProperty('background-color', 'rgba('
			+ hexToRGB(Settings.Gesture.Directions.Style.backgroundColor).join(",") + ','
			+ Settings.Gesture.Directions.Style.backgroundOpacity +
		')', 'important');

		// assign all css properties defined in the Settings.Command
		Command.style.setProperty('font-size', Settings.Gesture.Command.Style.fontSize, 'important');
		Command.style.setProperty('color', Settings.Gesture.Command.Style.color, 'important');
		Command.style.setProperty('background-color', 'rgba('
			+ hexToRGB(Settings.Gesture.Command.Style.backgroundColor).join(",") + ','
			+ Settings.Gesture.Command.Style.backgroundOpacity +
		')', 'important');
	}

// private variables and methods

	let Settings = null;

  let Overlay, Canvas, Context, Directions, Command;

  let zoomFactor = 1;

  /**
	 * creates and styles the gesture indicator html elements
   * declare styles always with !important to prevent style changes as much as possible
	 **/
  function initialize () {
  	// also used to caputre the mouse events over iframes
  	Overlay = document.createElement("div");
		Overlay.style = `
      all: initial !important;
			position: fixed !important;
			top: 0 !important;
			bottom: 0 !important;
			left: 0 !important;
			right: 0 !important;
			z-index: 2147483647 !important;
		`;

  	Canvas = document.createElement("canvas");
    Canvas.style = `
      all: initial !important;
    `;

  	Context = Canvas.getContext('2d');

  	Directions = document.createElement("div");
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

  	Command = document.createElement("div");
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

    // resize canvas on window resize
    window.addEventListener('resize', maximizeCanvas, true);
  }


  /**
	 * applies context properties
	 **/
  function styleContext () {
    Object.assign(Context,
      {
  			lineCap: "round",
  			lineJoin: "round",
  			lineWidth: 1,
        strokeStyle: Settings.Gesture.Trace.Style.strokeStyle
  		}
    );
  }


	/**
	 * will adjust the canvas size
	 * and apply its custom styles
	 **/
	function maximizeCanvas () {
		Canvas.width = window.innerWidth;
		Canvas.height = window.innerHeight;
		// FIX ZOOM
		/*
      const zoomFactor = ZoomHandler ? ZoomHandler.getZoom() : 1;
      Canvas.style.setProperty('transform-origin', `0 0`, 'important');
      Canvas.style.setProperty('transform', `scale(${1/zoomFactor})`, 'important');
    */
		// reset all context properties becuase they get cleared on canvas resize
		styleContext();
	}


	/**
	 * appand overlay
	 * start drawing the gesture
	 **/
	function initializeOverlay (x, y) {
    if (document.body.tagName.toUpperCase() === "FRAMESET")
			document.documentElement.appendChild(Overlay);
    else document.body.appendChild(Overlay);

		if (Settings.Gesture.Trace.display) {
			if (!Overlay.contains(Canvas)) Overlay.appendChild(Canvas);

      // get and store current zoom factor
      zoomFactor = ZoomHandler ? ZoomHandler.getZoom() : 1;
      //  convert point screen coordinates to css coordinates
      x = Math.round(x / zoomFactor - window.mozInnerScreenX);
      y = Math.round(y / zoomFactor - window.mozInnerScreenY);

			Context.beginPath();
			Context.moveTo(x, y);
		}
	}


	/**
	 * draw line for gesture
	 **/
	function updateCanvas (points) {
		if (Settings.Gesture.Trace.display && Overlay.contains(Canvas)) {
      // convert point screen coordinates to css coordinates
      points.forEach((point) => {
        point.x = Math.round(point.x / zoomFactor - window.mozInnerScreenX);
        point.y = Math.round(point.y / zoomFactor - window.mozInnerScreenY);
      });

      // get last point of the points array and remove it
      const lastPoint = points.pop();
      // if more than 1 point left draw curve
      while (points.length > 1) {
        const point = points.shift();
        const xc = (point.x + points[0].x) / 2;
        const yc = (point.y + points[0].y) / 2;
        Context.quadraticCurveTo(point.x, point.y, xc, yc);
      }
      // draw last 2 points
      if (points.length === 1) {
        Context.quadraticCurveTo(points[0].x, points[0].y, lastPoint.x, lastPoint.y);
      }
      else {
        Context.lineTo(lastPoint.x, lastPoint.y);
      }
      // grow line to its maximum
      if (Context.lineWidth < Settings.Gesture.Trace.Style.lineWidth) {
        const growthValue = Settings.Gesture.Trace.Style.lineGrowth ? 0.6 : Settings.Gesture.Trace.Style.lineWidth;
        Context.lineWidth = Math.min(
          Context.lineWidth + growthValue,
          Settings.Gesture.Trace.Style.lineWidth
        );
      }
      // draw the path
      Context.stroke();
      // start a possible upcomming path
      Context.beginPath();
      Context.moveTo(lastPoint.x, lastPoint.y);
    }
	}


	/**
	 * update directions
	 **/
	function updateDirections (directions) {
		if (Settings.Gesture.Directions.display) {
			if (!Overlay.contains(Directions)) Overlay.appendChild(Directions);

			// display the matching direction arrow symbols
			Directions.textContent = directions.join("");
		}
	}


	/**
	 * update command on match
	 **/
	function updateCommand (directions, command) {
		if (Settings.Gesture.Command.display) {
			if (command) {
				if (!Overlay.contains(Command)) Overlay.appendChild(Command);
				Command.textContent = command;
			}
			else Overlay.removeChild(Command);
		}
	}


  /**
	 * remove and reset all child elements
	 **/
	function resetOverlay () {
    if (Settings.Gesture.Trace.display && Overlay.contains(Canvas)) {
			Overlay.removeChild(Canvas);
      Context.clearRect(0, 0, Canvas.width, Canvas.height);
      // reset trace line width
  		Context.lineWidth = 1;
    }
		if (Settings.Gesture.Command.display && Overlay.contains(Command)) {
			Overlay.removeChild(Command);
      Command.textContent = "";
    }
		if (Settings.Gesture.Directions.display && Overlay.contains(Directions)) {
			Overlay.removeChild(Directions);
      Directions.textContent = "";
    }
	}


	/**
	 * remove overlay and reset overlay
	 **/
	function terminateOverlay () {
    if (document.body.tagName.toUpperCase() === "FRAMESET")
			document.documentElement.removeChild(Overlay);
    else document.body.removeChild(Overlay);

    resetOverlay();
	}

	// due to module pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return module;
})();
