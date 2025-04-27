/**
 * Custom element to smoothly order elements via drag and drop.
 * Dispatches custom events:
 * - orderstart: OrderEvent.oldIndex will be set and OrderEvent.newIndex will be -1
 * - orderchange: OrderEvent.oldIndex and OrderEvent.newIndex will be set
 * - orderend: OrderEvent.oldIndex and OrderEvent.newIndex will be set
 * It also provides a special transitionChildMutations function to smoothly add and remove children.
 **/
export class OrderableCollection extends HTMLElement {
  #itemCache;
  #originalItemIndex;
  #draggedItem;
  #cursorDragOffset;
  #requestAnimationFrameId;

  #onDragStartRef = this.#onDragStart.bind(this);
  #onDragUpdateRef = (event) => {
    // special handling to debounce callback
    // this also helps to circumvent a bug where the style is not yet computed/applied when rapidly executing beforeDOMChange and afterDOMChange
    if (this.#requestAnimationFrameId !== null) {
      globalThis.cancelAnimationFrame(this.#requestAnimationFrameId);
    }
    this.#requestAnimationFrameId = globalThis.requestAnimationFrame(this.#onDragUpdate.bind(this, event));
    // important as this allows a drop in the area to happen and preserves the effectAllowed = 'move' value
    // if an item is moved outside of the area or the Escape key is pressed effectAllowed is set 'none'
    event.preventDefault();
  }
  #onDragEndRef = this.#onDragEnd.bind(this);

  constructor() {
    super();
    this.#reset();
  }

  #onDragStart(event) {
    this.#itemCache = this.#getItemRects();
    // find and store index of dragged element
    this.#originalItemIndex = this.#findChildElementIndex(event.target);
    // store dragged element item
    this.#draggedItem = this.#itemCache[this.#originalItemIndex];
    // calculate offset from cursor to dragged element
    this.#cursorDragOffset = DOMPoint.fromPoint({
      x: event.pageX - this.#draggedItem.staticRect.x,
      y: event.pageY - this.#draggedItem.staticRect.y
    });
    // use dragover event as the drag event does not provide a cursor position
    this.addEventListener('dragover', this.#onDragUpdateRef);
    this.addEventListener('dragend', this.#onDragEndRef, {once: true});
    // required to prevent ghost image from shrinking/scaling
    event.dataTransfer.setDragImage(this.#draggedItem.element, this.#cursorDragOffset.x, this.#cursorDragOffset.y);
    // set drag effect
    event.dataTransfer.effectAllowed = 'move';
    dispatchEvent(new OrderEvent('orderstart', event, this.#originalItemIndex));
  }

  #onDragUpdate(event) {
    // current cursor position & current element size => drag rect
    const dragRect = DOMRect.fromRect({
      x: event.pageX - this.#cursorDragOffset.x,
      y: event.pageY - this.#cursorDragOffset.y,
      width: this.#draggedItem.staticRect.width,
      height: this.#draggedItem.staticRect.height,
    });
    // get closest item
    const targetItem = this.#findMostOverlappingItem(dragRect);
    if (targetItem && targetItem.element !== this.#draggedItem.element) {
      this.#transitionChildMutations(this.#itemCache, () => {
        this.#moveChild(this.#draggedItem.element, targetItem.element);
        const newItemIndex = this.#findChildElementIndex(this.#draggedItem.element);
        dispatchEvent(new OrderEvent('orderchange', event, this.#originalItemIndex, newItemIndex));
      });
    }
  }

  async #onDragEnd(event) {
    this.removeEventListener('dragover', this.#onDragUpdateRef);
    // handle drag cancellation e.g. triggered by Escape key
    if (event.dataTransfer.dropEffect === 'none') {
      // move the dragged item back to its original position
      this.#transitionChildMutations(this.#itemCache, () => {
        this.#moveChild(this.#draggedItem.element, this.children[this.#originalItemIndex]);
      });
    }
    // cancel any pending callback
    globalThis.cancelAnimationFrame(this.#requestAnimationFrameId);
    const newItemIndex = this.#findChildElementIndex(this.#draggedItem.element);
    dispatchEvent(new OrderEvent('orderend', event, this.#originalItemIndex, newItemIndex));
    this.#reset();
  }

  /**
   * Reset internal state.
   **/
  #reset() {
    this.#itemCache = null;
    this.#originalItemIndex = -1;
    this.#draggedItem = null;
    this.#cursorDragOffset = null;
    this.#requestAnimationFrameId = null;
    // (re)enable listening for new drag start events
    this.addEventListener('dragstart', this.#onDragStartRef, {once: true});
  }

  /**
   * Move child to another child's position.
   **/
   #moveChild(source, target) {
    // move the dragged item after/before the target item in the DOM
    const compareResult = source.compareDocumentPosition(target);
    if (compareResult & 0x04) {
      target.after(source);
    }
    else if (compareResult & 0x02) {
      target.before(source);
    }
  }

  /**
   * Find the index of a given child element.
   **/
  #findChildElementIndex(element) {
    return Array.prototype.indexOf.call(this.children, element);
  }

  /**
   * Find the RectItem from the item cache that overlaps the most with the given sample rect.
   **/
  #findMostOverlappingItem(sampleRect) {
    let bestOverlapArea = 0;
    let bestItem = null;
    for (const item of this.#itemCache) {
      const newOverlapArea = item.findOverlapArea(sampleRect);
      if (newOverlapArea > bestOverlapArea) {
        bestOverlapArea = newOverlapArea;
        bestItem = item;
      }
    }
    return bestItem;
  }

  #getItemRects() {
    const list = [];
    for (const child of this.children) {
      list.push(ItemRect.fromElement(child));
    }
    return list;
  }

  #transitionChildMutations(itemCache, mutation) {
    // update internal rects to current transformed rect
    for (const item of itemCache) {
      item.beforeDOMChange();
    }
    mutation();
    // update rects to new untransformed rect and animate difference between transformed rect
    for (const item of itemCache) {
      item.afterDOMChange({
        duration: this.animationDuration,
        easing: this.animationEasing,
      });
    }
  }

  /**
   * Function to transition any kind of child mutations like adding or removing children.
   * Any child mutations have to be done in the provided callback function.
   **/
  transitionChildMutations(mutation) {
    const itemCache = this.#getItemRects();
    this.#transitionChildMutations(itemCache, mutation);
  }

  /**
   * Getter for the "animation-duration" attribute
   **/
  get animationDuration() {
    return Number(this.getAttribute("animation-duration") ?? 300);
  }

  /**
   * Setter for the "animation-duration" attribute
   **/
  set animationDuration(value) {
    this.setAttribute("animation-duration", value);
  }

  /**
   * Getter for the "animation-easing" attribute
   **/
  get animationEasing() {
    return this.getAttribute("animation-easing") ?? 'ease';
  }

  /**
   * Setter for the "animation-easing" attribute
   **/
  set animationEasing(value) {
    this.setAttribute("animation-easing", value);
  }
}


class OrderEvent extends DragEvent {
  oldIndex;
  newIndex;

  constructor(type, dragEventInit, oldIndex = -1, newIndex = -1) {
    super(type, dragEventInit);
    this.oldIndex = oldIndex;
    this.newIndex = newIndex;
  }
}


// define custom element <orderable-collection></orderable-collection>
window.customElements.define('orderable-collection', OrderableCollection);


/*
  Working principle

  On reorder:
  1. calculate the current children positions including the animation transform in case the element is still animating from an earlier change (=current position)
  2. change the actual HTML by moving the child element to its new DOM location
  3. calculate the new children positions position without the animation transform (=new position)
  4. calculate the translation difference of the current and new positions
  5. Shift each item by the translation difference and animate to 0 translation

  This automatically handles any sort of element wrapping (when different sizes, or for grids).
*/
class ItemRect {
  element;
  staticRect;
  liveRect;

  static get animationId() {
    return 'itemChange';
  }

  constructor(element, rect) {
    this.element = element;
    this.staticRect = rect;
  }

  static fromElement(element) {
    return new ItemRect(
      element,
      ItemRect.#absoluteRectWithoutTransformFrom(element)
    );
  }

  static #absoluteRectWithTransformFrom(element) {
    const rect = element.getBoundingClientRect();
    return DOMRect.fromRect({
      x: rect.x + globalThis.scrollX,
      y: rect.y + globalThis.scrollY,
      width: rect.width,
      height: rect.height,
    });
  }

  static #absoluteRectWithoutTransformFrom(element) {
    const rect = ItemRect.#absoluteRectWithTransformFrom(element);
    const transform = new DOMMatrix(window.getComputedStyle(element).transform);
    return DOMRect.fromRect({
      // counter translate
      x: Math.round(rect.x - transform.m41),
      y: Math.round(rect.y - transform.m42),
      width: rect.width,
      height: rect.height,
    });
  }

  findOverlapArea(otherRect) {
    // Find the coordinates of the intersection rectangle
    const xOverlap = Math.max(
      0, Math.min(this.staticRect.x + this.staticRect.width, otherRect.x + otherRect.width) - Math.max(this.staticRect.x, otherRect.x)
    );
    const yOverlap = Math.max(
      0, Math.min(this.staticRect.y + this.staticRect.height, otherRect.y + otherRect.height) - Math.max(this.staticRect.y, otherRect.y)
    );
    // Return the area of intersection
    return xOverlap * yOverlap;
  }


  beforeDOMChange() {
    // use "with transform" to get mid animation position
    this.liveRect = ItemRect.#absoluteRectWithTransformFrom(this.element);
  }

  afterDOMChange({duration = 300, easing = 'ease'} = {}) {
    // get new rect without any transforms
    const targetRect = ItemRect.#absoluteRectWithoutTransformFrom(this.element);
    // check if the rect changed
    if (this.staticRect.x === targetRect.x && this.staticRect.y === targetRect.y) {
      // do nothing if target rect equals last static rect
      return;
    }
    // calculate new translation
    const offsetX = this.liveRect.x - targetRect.x;
    const offsetY = this.liveRect.y - targetRect.y;
    // update static rect and reset live rect
    this.staticRect = targetRect;
    this.liveRect = null;
    // if any shift occurred then animate the shift
    if (offsetX !== 0 || offsetY !== 0) {
      // remove previous diff animations
      for (const animation of this.element.getAnimations()) {
        if (animation.id === ItemRect.animationId) {
          animation.cancel();
        }
      }
      // animate
      return this.element.animate(
        [
          { transform: `translate(${offsetX}px, ${offsetY}px)` },
          { /* to original position */ },
        ],
        {
          id: ItemRect.animationId,
          duration,
          easing,
        },
      );
    }
  }
}
