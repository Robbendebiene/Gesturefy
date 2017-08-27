'use strict'

/**
 * calculates and returns the distance
 * between to points
 **/
function getDistance(x1, y1, x2, y2) {
	return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * translates the given vector to a direction letter
 * possible letter types are U,R,D and L
 **/
function getDirection(x1, y1, x2, y2) {
	if (Math.abs(y2 - y1) >= Math.abs(x2 - x1)) {
		if (y1 >= y2) return 'U';
		else return 'D';
	}
	else { 
		if (x2 >= x1) return 'R';
		else return 'L';
	}
}
