/**
 * Element construction method to ease imperative HTML creation.
 * ```
 * this.shadowRoot.append(
 *   Build('link', {
 *     rel: "stylesheet",
 *     href: 'layout.css',
 *   }),
 *   Build('div', {
 *       id: '123',
 *     }, (e) => {
 *       e.addEventListener('onchange', this.#handleChange.bind(this));
 *     }
 *   ),
 *   Build('button', {
 *     popoverTargetElement: this.#xyz,
 *   }),
 * ),
 * ```
 */

export function Build (name, props = {}, run = null, ...children) {
  const ele = document.createElement(name);
  if (props instanceof Node) {
    ele.append(props);
  }
  else {
    Object.assign(ele, props);
  }
  if (run instanceof Node) {
    ele.append(run);
  }
  else {
    run?.(ele);
  }
  ele.append(...children);
  return ele;
}

/**
 * Get HTML file as fragment from url,
 * Returns a promise which is fulfilled with the fragment
 * Otherwise it's rejected
 **/
export async function fetchHTMLAsFragment (url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch error! status: ${response.status}`);
  }
  const text = await response.text();
  return document.createRange().createContextualFragment(text);
}

/**
 * Morphs one element to the size and position of another element via transform animations.
 * Expects two HTML elements as parameters.
 * morph: Which of the elements should be animated. Can be 'to', 'from' or 'both'.
 * fade: Which of the elements should be faded. Can be 'to', 'from' or 'both'.
 **/
export function morph(from, to, {
  duration = 300,
  easing = 'ease',
  morph = 'both', // to, from, both
  fade = 'both', // to, from, both
  fill = 'none'
} = {}) {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();

  const animations = {from: undefined, to: undefined};

  if (morph !== 'to') {
    animations.from = from.animate([
      {
        opacity: 1,
        transform: 'none',
        transformOrigin: '0 0',
      },
      {
        opacity: fade !== 'to' ? 0 : 1,
        transform: fit(fromRect, toRect),
        transformOrigin: '0 0',
      }
    ], {
      duration,
      easing,
      fill,
    });
  }
  if (morph !== 'from') {
    animations.to = to.animate([
      {
        opacity: fade !== 'from' ? 0 : 1,
        transform: fit(toRect, fromRect),
        transformOrigin: '0 0',
      },
      {
        opacity: 1,
        transform: 'none',
        transformOrigin: '0 0',
      }
    ], {
      duration,
      easing,
      fill,
    });
  }
  return animations;
}

// helper for morph function
function fit(fromRect, toRect) {
  const scaleX = toRect.width / fromRect.width;
  const scaleY = toRect.height / fromRect.height;
  const translateX = toRect.x - fromRect.x;
  const translateY = toRect.y - fromRect.y;
  return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}
