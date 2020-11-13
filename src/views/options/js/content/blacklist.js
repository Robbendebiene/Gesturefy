import { ContentLoaded, Config } from "/views/options/js/index.js";

ContentLoaded.then(main);

/**
 * main function
 * run code that depends on async resources
 **/
function main () {
  const blacklistContainer = document.getElementById('blacklistContainer');
        blacklistContainer.dataset.noEntriesHint = browser.i18n.getMessage('blacklistHintNoEntries');
  const blacklistForm = document.getElementById('blacklistForm');
        blacklistForm.onsubmit = onFormSubmit;
        blacklistForm.elements.urlPattern.placeholder = browser.i18n.getMessage('blacklistPlaceholderURL');
        blacklistForm.elements.urlPattern.title = browser.i18n.getMessage('blacklistPlaceholderURL');
        blacklistForm.elements.urlPattern.onchange = onInputChange;
  // add existing blacklist entries
  for (const urlPattern of Config.get("Blocklist")) {
    const blacklistEntry = createBlocklistEntry(urlPattern);
    blacklistContainer.appendChild(blacklistEntry);
  }
}


/**
 * Creates a blacklist entry html element by a given url pattern and returns it
 **/
function createBlocklistEntry (urlPattern) {
  const blacklistEntry = document.createElement('li');
        blacklistEntry.classList.add('bl-entry');
        blacklistEntry.dataset.urlPattern = urlPattern;
        blacklistEntry.onclick = onEntryClick;
  const inputURLEntry = document.createElement('div');
        inputURLEntry.classList.add('bl-url-pattern');
        inputURLEntry.textContent = urlPattern;
  const deleteButton = document.createElement('button');
        deleteButton.type = "button";
        deleteButton.classList.add('bl-remove-button', 'icon-delete');
  blacklistEntry.append(inputURLEntry, deleteButton);
  return blacklistEntry;
}


/**
 * Adds a given blacklist entry element to the blacklist ui
 **/
function addBlocklistEntry (blacklistEntry) {
  const blacklistContainer = document.getElementById('blacklistContainer');
  // append entry, hide it and move it out of flow to calculate its dimensions
  blacklistContainer.prepend(blacklistEntry);
  blacklistEntry.style.setProperty('visibility', 'hidden');
  blacklistEntry.style.setProperty('position', 'absolute');
  // calculate total entry height
  const computedStyle = window.getComputedStyle(blacklistEntry);
  const outerHeight = parseInt(computedStyle.marginTop) + blacklistEntry.offsetHeight + parseInt(computedStyle.marginBottom);

  // move all entries up by one entry including the new one
  for (const node of blacklistContainer.children) {
    node.style.setProperty('transform', `translateY(-${outerHeight}px)`);
    // remove ongoing transitions if existing
    node.style.removeProperty('transition');
  }
  // show new entry and bring it back to flow, which pushes all elements down by the height of one entry
  blacklistEntry.style.removeProperty('visibility', 'hidden');
  blacklistEntry.style.removeProperty('position', 'absolute');

  // trigger reflow
  blacklistContainer.offsetHeight;

  blacklistEntry.addEventListener('animationend', (event) => {
    event.currentTarget.classList.remove('bl-entry-animate-add');
  }, {once: true });
  blacklistEntry.classList.add('bl-entry-animate-add');

  // move all entries down including the new one
  for (const node of blacklistContainer.children) {
    node.addEventListener('transitionend', (event) => event.currentTarget.style.removeProperty('transition'), {once: true });
    node.style.setProperty('transition', 'transform 0.3s');
    node.style.removeProperty('transform');
  }
}


/**
 * Removes a given blacklist entry element from the blacklist ui
 **/
function removeBlocklistEntry (blacklistEntry) {
  // calculate total entry height
  const computedStyle = window.getComputedStyle(blacklistEntry);
  const outerHeight = parseInt(computedStyle.marginTop) + blacklistEntry.offsetHeight + parseInt(computedStyle.marginBottom);

  let node = blacklistEntry.nextElementSibling;
  while (node) {
    node.addEventListener('transitionend', (event) => {
      event.currentTarget.style.removeProperty('transition');
      event.currentTarget.style.removeProperty('transform');
    }, {once: true });
    node.style.setProperty('transition', 'transform 0.3s');
    node.style.setProperty('transform', `translateY(-${outerHeight}px)`);
    node = node.nextElementSibling;
  }
  blacklistEntry.addEventListener('animationend', (event) => event.currentTarget.remove(), {once: true });
  blacklistEntry.classList.add('bl-entry-animate-remove');
}


/**
 * Handles the url pattern submit event
 * Adds the new url pattern to the config and calls the blacklist entry create function
 **/
function onFormSubmit (event) {
  event.preventDefault();
  // remove spaces and cancel the function if the value is empty
  const urlPattern = this.elements.urlPattern.value.trim();
  if (!urlPattern) return;
  // create and add entry to the blacklist
  const blacklistEntry = createBlocklistEntry(urlPattern);
  addBlocklistEntry(blacklistEntry);
  // add new url pattern to the beginning of the array
  const blacklistArray = Config.get("Blocklist");
        blacklistArray.unshift(urlPattern);
  Config.set("Blocklist", blacklistArray);
  // clear input field
  this.elements.urlPattern.value = '';
}


/**
 * Handles the url pattern input changes
 * Marks the field as invalide if the entry already exists
 **/
function onInputChange () {
  if (Config.get("Blocklist").indexOf(this.value.trim()) !== -1) {
    this.setCustomValidity(browser.i18n.getMessage('blacklistNotificationAlreadyExists'));
  }
  else if (this.validity.customError) this.setCustomValidity('');
}


/**
 * Handles the blacklist entry click
 * Calls the remove blacklist entry function on remove button click and removes it from the config
 **/
function onEntryClick (event) {
  // if delete button received the click
  if (event.target.classList.contains('bl-remove-button')) {
    removeBlocklistEntry(this);

    const blacklistForm = document.getElementById('blacklistForm');
    // remove input field invaldility if it was previously a duplicate
    if (this.dataset.urlPattern === blacklistForm.elements.urlPattern.value.trim()) {
      blacklistForm.elements.urlPattern.setCustomValidity('');
    }
    const blacklistArray = Config.get("Blocklist");
    // remove url pattern from array
    const index = blacklistArray.indexOf(this.dataset.urlPattern);
    if (index !== -1) {
      blacklistArray.splice(index, 1);
      Config.set("Blocklist", blacklistArray);
    }
  }
}
