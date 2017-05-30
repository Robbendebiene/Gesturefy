'use strict'

/**
 * calculates and returns the distance
 * between to points
 **/
function getDistance(x1, y1, x2, y2) {
	return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * calculates and returns the angle
 * between to points
 **/
function getAngle(x1, y1, x2, y2) {
	// outputs an angle from 0 to 180 | -180 to 0
	let angle = Math.atan2(x2 - x1, y1 - y2) / Math.PI * 180;
	// apply true modulo to get 0 to 360° angle (http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving)
	return ((angle % 360) + 360) % 360;
}

/**
 * translates the given angle to a direction letter
 * possible letter types are U,R,D and L
 **/
function getDirecion(angle) {
	if 			(angle > 315 && angle <= 360 || angle >= 0 && angle <= 45) return 'U';
	else if (angle > 45 && angle <= 135) return 'R';
	else if (angle > 135 && angle <= 225) return 'D';
	else if (angle > 225 && angle <= 315) return 'L';
}
