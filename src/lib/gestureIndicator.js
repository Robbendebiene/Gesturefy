'use strict'


/**
 * GestureIndicator "singleton" class using the modul pattern
 * handles the representation of the gesture handler indicators
 * on default the handler is disabled and must be enabled via enable()
 * REQUIRES: contentCommons.js and gestureHandler.js
 **/
const GestureIndicator = (function() {

// public variables and methods

  let modul = {};

	/**
	 * Add the event listener if settings were applied
	 **/
  modul.enable = function enable () {
		if (Settings) {
			// setup GestureHandler event callbacks
			GestureHandler
				.on("start", initializeOverlay)
				.on("update", updateCanvas)
				.on("change", updateDirections)
				.on("change", updateAction)
				.on("end", terminateOverlay);
		}
  };


	/**
	 * Saves the current settings and applies all custom styles to the html elements
	 **/
	modul.applySettings = function applySettings (settings) {
    if (!Settings) initialize();

		// save settings to private variable
		Settings = settings;

		Canvas.style.setProperty('opacity', Settings.Gesture.Trace.style.opacity, 'important');
		maximizeCanvas();

		// assign all css properties defined in the Settings.Directions
		Directions.style.setProperty('font-size', Settings.Gesture.Directions.style.fontSize, 'important');
		Directions.style.setProperty('text-align', Settings.Gesture.Directions.style.textAlign, 'important');
		Directions.style.setProperty('color', Settings.Gesture.Directions.style.color, 'important');
		Directions.style.setProperty('background-color', 'rgba('
			+ hexToRGB(Settings.Gesture.Directions.style.backgroundColor).join(",") + ','
			+ Settings.Gesture.Directions.style.backgroundOpacity +
		')', 'important');

		// assign all css properties defined in the Settings.Action
		Action.style.setProperty('font-size', Settings.Gesture.Action.style.fontSize, 'important');
		Action.style.setProperty('color', Settings.Gesture.Action.style.color, 'important');
		Action.style.setProperty('background-color', 'rgba('
			+ hexToRGB(Settings.Gesture.Action.style.backgroundColor).join(",") + ','
			+ Settings.Gesture.Action.style.backgroundOpacity +
		')', 'important');
	}

// private variables and methods

	let Settings = null;

  let Overlay, Canvas, Context, Directions, Action;


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
			z-index: 1999999999 !important;
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
			letter-spacing: 1vw !important;
			width: 100% !important;
			text-shadow: 1px 1px 5px rgba(0,0,0, 0.8) !important;
			padding: 1vh 1vh !important;
			white-space: nowrap !important;
		`;

  	Action = document.createElement("div");
		Action.style = `
      all: initial !important;
			position: absolute !important;
			top: 50% !important;
			left: 50% !important;
			transform: translate(-50%, -50%) !important;
			font-family: Orkney Regular !important;
			line-height: normal !important;
			text-shadow: 1px 1px 5px rgba(0,0,0, 0.8) !important;
			text-align: center !important;
			padding: 25px 20px 20px 20px !important;
			border-radius: 5px !important;
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
        strokeStyle: Settings.Gesture.Trace.style.strokeStyle
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
		//Canvas.getContext('2d').scale(1/window.devicePixelRatio, 1/window.devicePixelRatio);
		//Canvas.style.transform = "scale("+ 1/window.devicePixelRatio+","+ 1/window.devicePixelRatio+")";

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
			Context.beginPath();
			Context.moveTo(x, y);
		}
	}


	/**
	 * draw line for gesture
	 **/
	function updateCanvas (x, y) {
		if (Settings.Gesture.Trace.display && Overlay.contains(Canvas)) {
			Context.lineWidth = Math.min(
				Settings.Gesture.Trace.style.lineWidth,
				Context.lineWidth += Settings.Gesture.Trace.style.lineGrowth
			);
			Context.lineTo(x, y);
			Context.stroke();
			Context.closePath();
			Context.beginPath();
			Context.moveTo(x, y);
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
	 * update action by asking thrr background script for a match
	 **/
	function updateAction (directions, action) {
		if (Settings.Gesture.Action.display) {
			if (action) {
				if (!Overlay.contains(Action)) Overlay.appendChild(Action);
				Action.textContent = action;
			}
			else Overlay.removeChild(Action);
		}
	}


	/**
	 * remove and reset all elements
	 * send the final gesture to the background script
	 **/
	function terminateOverlay (directions) {
    if (document.body.tagName.toUpperCase() === "FRAMESET")
			document.documentElement.removeChild(Overlay);
    else document.body.removeChild(Overlay);
    
		if (Settings.Gesture.Trace.display && Overlay.contains(Canvas)) {
			Context.clearRect(0, 0, Canvas.width, Canvas.height);
			Overlay.removeChild(Canvas);
		}
		if (Settings.Gesture.Action.display && Overlay.contains(Action)) {
			Action.textContent = "";
			Overlay.removeChild(Action);
		}
		if (Settings.Gesture.Directions.display && Overlay.contains(Directions)) {
			Directions.textContent = "";
			Overlay.removeChild(Directions);
		}

		// reset trace line width
		Context.lineWidth = 1;
	}

	// due to modul pattern: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
	return modul;
})();
