'use strict'

let Settings = null,
		TargetData = null;

// declare styles always with !important to prevent style changes as much as possible

// also used to caputre the mouse events over iframes
let Overlay = document.createElement("div");
		Overlay.style = `
			position: fixed !important;
			top: 0 !important;
			bottom: 0 !important;
			left: 0 !important;
			right: 0 !important;
			z-index: 1999999999 !important;
			display: blocK !important;
		`;

let Canvas = document.createElement("canvas");
let Context = Canvas.getContext('2d');
let ContextStyle = {
			lineCap: "round",
			lineJoin: "round"
		};
let Directions = document.createElement("div");
		Directions.style = `
			position: absolute !important;
			bottom: 0 !important;
			left: 0 !important;
			font-family: firefox-gesture-arrows !important;
			direction: rtl !important;
			letter-spacing: 1vw !important;
			width: 100% !important;
			text-shadow: 1px 1px 5px rgba(0,0,0, 0.8) !important;
			padding: 1vh 1vh !important;
			line-height: normal !important;
			white-space: nowrap !important;
		`;
let Action = document.createElement("div");
		Action.style = `
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


// get target data from iframes
window.addEventListener("message", (event) => {
	if (TargetData === null &&
			typeof event.data === 'object' &&
			"src" in event.data &&
			"href" in event.data &&
			"selection" in event.data
		) TargetData = event.data;
}, false);


// get target data on first mousemove and right click
document.addEventListener('mousemove', (event) => {
	if (event.buttons === 2 && TargetData === null) {
		TargetData = {
			href: getLinkHref(event.target),
			src: getImageSrc(event.target),
			selection: getTextSelection()
		}
	}
}, true);


// listen for propagations from the options or background script and apply styles afterwards
chrome.runtime.onMessage.addListener((message) => {
  if (message.Display) {
		Settings = message.Display;
		applySettings();
		GestureHandler.enable();
	}
});


// get necessary data from storage and apply styles afterwards
chrome.storage.local.get("Display", (settings) => {
	if (Object.keys(settings).length !== 0) {
		Settings = settings.Display;
		applySettings();
		GestureHandler.enable();
	}
});


// setup GestureHandler event callbacks
GestureHandler
	.on("start", initializeOverlay)
	.on("update", updateCanvas)
	.on("change", updateDirections)
	.on("change", updateAction)
	.on("end", terminateOverlay);


/**
 * will adjust the canvas size
 * and apply its custom styles
 **/
function adjustCanvasToMaxSize () {
	Canvas.width = window.innerWidth;
	Canvas.height = window.innerHeight;
	// FIX ZOOM
	//Canvas.getContext('2d').scale(1/window.devicePixelRatio, 1/window.devicePixelRatio);
	//Canvas.style.transform = "scale("+ 1/window.devicePixelRatio+","+ 1/window.devicePixelRatio+")";

	// reset all style properties becuase they get cleared on canvas resize
	Object.assign(
		Context,
		ContextStyle,
		{
			lineWidth: Settings.Gesture.style.lineWidth,
			strokeStyle: Settings.Gesture.style.strokeStyle
		}
	);
}


/**
 * applies all custom styles to the html elements
 **/
function applySettings () {
	if (Settings.Gesture.display) {
		Canvas.style.setProperty('opacity', Settings.Gesture.style.opacity, 'important');

		// resize canvas on window resize
		window.addEventListener('resize', adjustCanvasToMaxSize, true);
		adjustCanvasToMaxSize();
	}

	// assign all css properties defined in the Settings.Directions
	if (Settings.Directions.display) {
		Directions.style.setProperty('font-size', Settings.Directions.style.fontSize, 'important');
		Directions.style.setProperty('text-align', Settings.Directions.style.textAlign, 'important');
		Directions.style.setProperty('color', Settings.Directions.style.color, 'important');
		Directions.style.setProperty('background-color', 'rgba('
			+ hexToRGB(Settings.Directions.style.backgroundColor).join(",") + ','
			+ Settings.Directions.style.backgroundOpacity +
		')', 'important');
	}

	// assign all css properties defined in the Settings.Action
	if (Settings.Action.display) {
		Action.style.setProperty('font-size', Settings.Action.style.fontSize, 'important');
		Action.style.setProperty('color', Settings.Action.style.color, 'important');
		Action.style.setProperty('background-color', 'rgba('
			+ hexToRGB(Settings.Action.style.backgroundColor).join(",") + ','
			+ Settings.Action.style.backgroundOpacity +
		')', 'important');
	}
}


/**
 * converts a hex color either with hash or not
 * to an rgb color array
 **/
function hexToRGB (hex) {
	if (hex[0] === "#") hex = hex.slice(1);
	let arrayBuffer = new ArrayBuffer(4),
			view = new DataView(arrayBuffer);
			view.setUint32(0, parseInt(hex, 16), false);
	return new Uint8Array(arrayBuffer).slice(1);
}


/**
 * appand overlay
 * start drawing the gesture
 **/
function initializeOverlay (x, y) {
	document.body.appendChild(Overlay);

	if (Settings.Gesture.display) {
		if (!Overlay.contains(Canvas)) Overlay.appendChild(Canvas);
		Context.beginPath();
		Context.moveTo(x, y);
	}
}


/**
 * draw line for gesture
 **/
function updateCanvas (x, y) {
	if (Settings.Gesture.display && Overlay.contains(Canvas)) {
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
	if (Settings.Directions.display) {
		if (!Overlay.contains(Directions)) Overlay.appendChild(Directions);

		// display the matching direction arrow symbols
		Directions.textContent = directions.join("");
	}
}


/**
 * update action by asking thrr background script for a match
 **/
function updateAction (directions) {
	if (Settings.Action.display) {

		// send message to background on gesture change
		let message = browser.runtime.sendMessage({
			gesture: directions.join(""),
			completed: false
		});

		// display or remove action on response
		message.then((response) => {
			if (response) {
				if (!Overlay.contains(Action)) Overlay.appendChild(Action);
				Action.textContent = response.action;
			}
			else Overlay.removeChild(Action);
		});
	}
}


/**
 * remove and reset all elements
 * send the final gesture to the background script
 **/
function terminateOverlay (directions) {
	document.body.removeChild(Overlay);

	if (Settings.Gesture.display && Overlay.contains(Canvas)) {
		Context.clearRect(0, 0, Canvas.width, Canvas.height);
		Overlay.removeChild(Canvas);
	}
	if (Settings.Action.display && Overlay.contains(Action)) {
		Action.textContent = "";
		Overlay.removeChild(Action);
	}
	if (Settings.Directions.display && Overlay.contains(Directions)) {
		Directions.textContent = "";
		Overlay.removeChild(Directions);
	}

	// send message to background with the final gesture if directions is not empty
	if (directions.length > 0) browser.runtime.sendMessage({
		gesture: directions.join(""),
		completed: true,
		data: TargetData
	});

	TargetData = null;
}
