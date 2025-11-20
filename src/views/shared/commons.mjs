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
