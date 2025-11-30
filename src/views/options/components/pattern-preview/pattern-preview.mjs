import { Build } from '/views/shared/commons.mjs';

/**
 * Displays a given gesture pattern as an SVG path.
 * The pattern can be animated by calling the playDemo() method.
 * The pattern can be read and updated via the pattern property.
 * Some styling can be applied by overriding CSS properties like: fill, stroke and stroke-width
 **/
export default class PatternPreview extends HTMLElement {
  #pattern;
  #svgElement;

  constructor(pattern = undefined) {
    super();
    this.#pattern = pattern;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.append(
      Build('link', {
        rel: 'stylesheet',
        href: import.meta.resolve('./layout.css'),
      }),
      this.#svgElement = this.#createSVG(this.#pattern)
    );
  }

  disconnectedCallback() {
    this.shadowRoot.replaceChildren();
    this.#svgElement = null;
  }

  set pattern(value) {
    this.#pattern = value;
    if (this.isConnected) {
      this.#svgElement.replaceWith(
        this.#svgElement = this.#createSVG(this.#pattern)
      );
    }
  }

  get pattern() {
    return this.#pattern;
  }

  /**
   * Animates drawing the path of the pattern.
   **/
  playDemo() {
    if (!this.#svgElement.classList.contains('demo')) {
      this.#svgElement.classList.add('demo');
      this.#svgElement.addEventListener('animationend',
        () => this.#svgElement?.classList.remove('demo'), { once: true }
      );
    }
  }

  /**
   * Creates and returns an SVG element of a given gesture pattern.
   **/
  #createSVG(pattern) {
    const viewBoxX = 0;
    const viewBoxY = 0;
    const viewBoxWidth = 100;
    const viewBoxHeight = 100;

    // convert vector array to points starting by 0, 0
    const points = [ {x: 0, y: 0} ];
    pattern.forEach((vector, i) => points.push({
      x: points[i].x + vector[0],
      y: points[i].y + vector[1]
    }));
    this.#fitPathToViewBox(points, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight);

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          group.id = 'group';
    // create gesture trail as svg path element
    const patternPathElement = this.#createCatmullRomSVGPath(points);
          patternPathElement.id = 'trail';

    // create arrow as svg path element
    const arrowPathElement = this.#createArrowSVGPath();
          arrowPathElement.id = 'arrow';
          // using offset-path: url('#trail'); doesn't work
          arrowPathElement.style.setProperty('offset-path', `path('${patternPathElement.getAttribute('d')}')`);
    group.append(patternPathElement, arrowPathElement);

    const gesturePathLength = patternPathElement.getTotalLength();
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          // scales the svg elements to always fit the svg canvas
          svgElement.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
          // add path length and scale as css variables for animations and styling
          svgElement.style.setProperty('--pathLength', gesturePathLength);
    svgElement.append(group);
    return svgElement;
  }

  /**
   * Creates and returns an arrow head as an SVG path element.
   **/
  #createArrowSVGPath(scale = 9) {
    // the arrow could be scaled together with the path if we were using it as a marker
    // however markers cannot be moved along the path (see https://stackoverflow.com/questions/75166361/svg-animation-of-drawing-line-with-marker)
    const arrowPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          arrowPathElement.setAttribute('d', `M0,${-1 * scale} L${2 * scale},0 L0,${1 * scale} z`);
    return arrowPathElement;
  }

  /**
   * Creates and returns a smooth SVG path element from the given points.
   **/
  #createCatmullRomSVGPath(points, alpha = 0.5) {
    let path = `M${points[0].x},${points[0].y} C`;

    const size = points.length - 1;

    for (let i = 0; i < size; i++) {
      const p0 = i === 0 ? points[0] : points[i - 1],
            p1 = points[i],
            p2 = points[i + 1],
            p3 = i === size - 1 ? p2 : points[i + 2];

      const d1 = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2)),
            d2 = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)),
            d3 = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));

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

      if (x1 === 0 && y1 === 0) {
        x1 = p1.x;
        y1 = p1.y;
      }

      if (x2 === 0 && y2 === 0) {
        x2 = p2.x;
        y2 = p2.y;
      }

      path += ` ${x1},${y1},${x2},${y2},${p2.x},${p2.y}`;
    }
    // create path element
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pathElement.setAttribute('d', path);

    return pathElement;
  }

  /**
   * Fits the given path in the form of [{x,y}, ...] to the given view box.
   * Scales the coordinates and centers the path.
   * The path is manipulated in place.
   **/
  #fitPathToViewBox(path, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight) {
    // find min/max values for both axes
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    for (const {x, y} of path) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    // calculate original dimensions and scaling factors
    const width = maxX - minX;
    const height = maxY - minY;
    // uniform scaling factor (maintain aspect ratio)
    const scale = Math.min(
      viewBoxWidth / width,
      viewBoxHeight / height,
    );
    // calculate the translation needed to center the path
    const offsetX = viewBoxX + (viewBoxWidth - width * scale) / 2;
    const offsetY = viewBoxY + (viewBoxHeight - height * scale) / 2;
    // scale and translate all points
    for (const point of path) {
      point.x = (point.x - minX) * scale + offsetX;
      point.y = (point.y - minY) * scale + offsetY;
    }
    return path;
  }
}

customElements.define('pattern-preview', PatternPreview);
