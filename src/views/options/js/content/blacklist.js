import { ContentLoaded, Config } from "/views/options/js/index.js";

ContentLoaded.then(main);

/**
 * main function
 * run code that depends on async resources
 **/
function main () {
  const blocklistContainer = document.getElementById('blocklistContainer');
        blocklistContainer.dataset.noEntriesHint = browser.i18n.getMessage('blocklistHintNoEntries');
  const blocklistForm = document.getElementById('blocklistForm');
        blocklistForm.onsubmit = onFormSubmit;
        blocklistForm.elements.urlPattern.placeholder = browser.i18n.getMessage('blocklistPlaceholderURL');
        blocklistForm.elements.urlPattern.title = browser.i18n.getMessage('blocklistPlaceholderURL');
        blocklistForm.elements.urlPattern.onchange = onInputChange;
  // add existing blocklist entries
  for (const urlPattern of Config.get("Blocklist")) {
    const blocklistEntry = createBlocklistEntry(urlPattern);
    blocklistContainer.appendChild(blocklistEntry);
  }
}


/**
 * Creates a blocklist entry html element by a given url pattern and returns it
 **/
function createBlocklistEntry (urlPattern) {
  const blocklistEntry = document.createElement('li');
        blocklistEntry.classList.add('bl-entry');
        blocklistEntry.dataset.urlPattern = urlPattern;
        blocklistEntry.onclick = onEntryClick;
  const inputURLEntry = document.createElement('div');
        inputURLEntry.classList.add('bl-url-pattern');
        inputURLEntry.textContent = urlPattern;
  const deleteButton = document.createElement('button');
        deleteButton.type = "button";
        deleteButton.classList.add('bl-remove-button', 'icon-delete');
  blocklistEntry.append(inputURLEntry, deleteButton);
  return blocklistEntry;
}


/**
 * Adds a given blocklist entry element to the blocklist ui
 **/
function addBlocklistEntry (blocklistEntry) {
  const blocklistContainer = document.getElementById('blocklistContainer');
  // append entry, hide it and move it out of flow to calculate its dimensions
  blocklistContainer.prepend(blocklistEntry);
  blocklistEntry.style.setProperty('visibility', 'hidden');
  blocklistEntry.style.setProperty('position', 'absolute');
  // calculate total entry height
  const computedStyle = window.getComputedStyle(blocklistEntry);
  const outerHeight = parseInt(computedStyle.marginTop) + blocklistEntry.offsetHeight + parseInt(computedStyle.marginBottom);

  // move all entries up by one entry including the new one
  for (const node of blocklistContainer.children) {
    node.style.setProperty('transform', `translateY(-${outerHeight}px)`);
    // remove ongoing transitions if existing
    node.style.removeProperty('transition');
  }
  // show new entry and bring it back to flow, which pushes all elements down by the height of one entry
  blocklistEntry.style.removeProperty('visibility', 'hidden');
  blocklistEntry.style.removeProperty('position', 'absolute');

  // trigger reflow
  blocklistContainer.offsetHeight;

  blocklistEntry.addEventListener('animationend', (event) => {
    event.currentTarget.classList.remove('bl-entry-animate-add');
  }, {once: true });
  blocklistEntry.classList.add('bl-entry-animate-add');

  // move all entries down including the new one
  for (const node of blocklistContainer.children) {
    node.addEventListener('transitionend', (event) => event.currentTarget.style.removeProperty('transition'), {once: true });
    node.style.setProperty('transition', 'transform 0.3s');
    node.style.removeProperty('transform');
  }
}


/**
 * Removes a given blocklist entry element from the blocklist ui
 **/
function removeBlocklistEntry (blocklistEntry) {
  // calculate total entry height
  const computedStyle = window.getComputedStyle(blocklistEntry);
  const outerHeight = parseInt(computedStyle.marginTop) + blocklistEntry.offsetHeight + parseInt(computedStyle.marginBottom);

  let node = blocklistEntry.nextElementSibling;
  while (node) {
    node.addEventListener('transitionend', (event) => {
      event.currentTarget.style.removeProperty('transition');
      event.currentTarget.style.removeProperty('transform');
    }, {once: true });
    node.style.setProperty('transition', 'transform 0.3s');
    node.style.setProperty('transform', `translateY(-${outerHeight}px)`);
    node = node.nextElementSibling;
  }
  blocklistEntry.addEventListener('animationend', (event) => event.currentTarget.remove(), {once: true });
  blocklistEntry.classList.add('bl-entry-animate-remove');
}


/**
 * Handles the url pattern submit event
 * Adds the new url pattern to the config and calls the blocklist entry create function
 **/
function onFormSubmit (event) {
  event.preventDefault();
  // remove spaces and cancel the function if the value is empty
  const urlPattern = this.elements.urlPattern.value.trim();
  if (!urlPattern) return;
  // create and add entry to the blocklist
  const blocklistEntry = createBlocklistEntry(urlPattern);
  addBlocklistEntry(blocklistEntry);
  // add new url pattern to the beginning of the array
  const blocklistArray = Config.get("Blocklist");
        blocklistArray.unshift(urlPattern);
  Config.set("Blocklist", blocklistArray);
  // clear input field
  this.elements.urlPattern.value = '';
}


/**
 * Handles the url pattern input changes
 * Marks the field as invalide if the entry already exists
 **/
function onInputChange () {
  if (Config.get("Blocklist").indexOf(this.value.trim()) !== -1) {
    this.setCustomValidity(browser.i18n.getMessage('blocklistNotificationAlreadyExists'));
  }
  else if (this.validity.customError) this.setCustomValidity('');
}


/**
 * Handles the blocklist entry click
 * Calls the remove blocklist entry function on remove button click and removes it from the config
 **/
function onEntryClick (event) {
  // if delete button received the click
  if (event.target.classList.contains('bl-remove-button')) {
    removeBlocklistEntry(this);

    const blocklistForm = document.getElementById('blocklistForm');
    // remove input field invaldility if it was previously a duplicate
    if (this.dataset.urlPattern === blocklistForm.elements.urlPattern.value.trim()) {
      blocklistForm.elements.urlPattern.setCustomValidity('');
    }
    const blocklistArray = Config.get("Blocklist");
    // remove url pattern from array
    const index = blocklistArray.indexOf(this.dataset.urlPattern);
    if (index !== -1) {
      blocklistArray.splice(index, 1);
      Config.set("Blocklist", blocklistArray);
    }
  }
}
