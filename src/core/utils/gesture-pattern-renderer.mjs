/**
 * Shared helpers to render a gesture pattern (array of 2D vectors) as svg paths.
 * Used by both the options page thumbnails and the mouse gesture overlay.
 **/


/**
 * Converts a gesture pattern (array of 2D vectors) into an array of points.
 * The first point is always { x: 0, y: 0 }.
 **/
export function patternToPoints (pattern) {
  const points = [{ x: 0, y: 0 }];
  for (const vector of pattern) {
    points.push({
      x: points[points.length - 1].x + vector[0],
      y: points[points.length - 1].y + vector[1]
    });
  }
  return points;
}


/**
 * Creates a smooth catmull-rom svg path data string from the given points.
 * Returns the value for the "d" attribute of an svg path element.
 **/
export function createCatmullRomPathData (points, alpha = 0.5) {
  let pathData = `M${points[0].x},${points[0].y} C`;

  const size = points.length - 1;

  for (let i = 0; i < size; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1],
          p1 = points[i],
          p2 = points[i + 1],
          p3 = i === size - 1 ? p2 : points[i + 2];

    const d1 = Math.hypot(p0.x - p1.x, p0.y - p1.y),
          d2 = Math.hypot(p1.x - p2.x, p1.y - p2.y),
          d3 = Math.hypot(p2.x - p3.x, p2.y - p3.y);

    const d3powA  = Math.pow(d3, alpha),
          d3pow2A = Math.pow(d3, 2 * alpha),
          d2powA  = Math.pow(d2, alpha),
          d2pow2A = Math.pow(d2, 2 * alpha),
          d1powA  = Math.pow(d1, alpha),
          d1pow2A = Math.pow(d1, 2 * alpha);

    const A = 2 * d1pow2A + 3 * d1powA * d2powA + d2pow2A,
          B = 2 * d3pow2A + 3 * d3powA * d2powA + d2pow2A;

    let N = 3 * d1powA * (d1powA + d2powA),
        M = 3 * d3powA * (d3powA + d2powA);

    if (N > 0) N = 1 / N;
    if (M > 0) M = 1 / M;

    let x1 = (-d2pow2A * p0.x + A * p1.x + d1pow2A * p2.x) * N,
        y1 = (-d2pow2A * p0.y + A * p1.y + d1pow2A * p2.y) * N;

    let x2 = (d3pow2A * p1.x + B * p2.x - d2pow2A * p3.x) * M,
        y2 = (d3pow2A * p1.y + B * p2.y - d2pow2A * p3.y) * M;

    if (x1 === 0 && y1 === 0) { x1 = p1.x; y1 = p1.y; }
    if (x2 === 0 && y2 === 0) { x2 = p2.x; y2 = p2.y; }

    pathData += ` ${x1},${y1},${x2},${y2},${p2.x},${p2.y}`;
  }

  return pathData;
}


const SVG_NAMESPACE = "http://www.w3.org/2000/svg";


/**
 * Creates and returns an svg path element for the given points using a catmull-rom spline.
 * Only the "d" attribute is set; styling is left to the caller.
 **/
export function createCatmullRomSVGPath (points, alpha = 0.5) {
  const pathElement = document.createElementNS(SVG_NAMESPACE, 'path');
        pathElement.setAttribute('d', createCatmullRomPathData(points, alpha));
  return pathElement;
}
