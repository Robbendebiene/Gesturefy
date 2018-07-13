'use strict'

const blacklist = document.getElementById('Blacklist');
const blacklistForm = document.getElementById('BlacklistForm');
      blacklistForm.onsubmit = onFormSubmit;
      blacklistForm.elements.urlPattern.placeholder = browser.i18n.getMessage('blacklistPlaceholderURL');
      blacklistForm.elements.urlPattern.title = browser.i18n.getMessage('blacklistPlaceholderURL');
      blacklistForm.elements.urlPattern.onchange = onInputChange;
// add existing blacklist entries
for (const urlPattern of Config.Blacklist) {
  const blacklistEntry = createBlacklistEntry(urlPattern);
  blacklist.appendChild(blacklistEntry);
}


/**
 *
 **/
function createBlacklistEntry (urlPattern) {
  const blacklistEntry = document.createElement('li');
        blacklistEntry.classList.add('bl-entry');
        blacklistEntry.dataset.urlPattern = urlPattern;
        blacklistEntry.onclick = onEntryClick;
  const inputURLEntry = document.createElement('div');
        inputURLEntry.classList.add('bl-url-pattern');
        inputURLEntry.textContent = urlPattern;
  const deleteButton = document.createElement('button');
        deleteButton.classList.add('bl-remove-button', 'icon-delete');
  blacklistEntry.append(inputURLEntry, deleteButton);
  return blacklistEntry;
}


/**
 *
 **/
function addBlacklistEntry (blacklistEntry) {
  for (const item of blacklist.children) {
    item.classList.add('bl-entry-animateItems');
    item.addEventListener('animationend', () => item.classList.remove('bl-entry-animateItems'), {once: true });
  }
  blacklistEntry.classList.add('bl-entry-animate');
  blacklistEntry.addEventListener('animationend', () => blacklistEntry.classList.remove('bl-entry-animate'), {once: true });
  blacklist.prepend(blacklistEntry);
}


/**
 *
 **/
function removeBlacklistEntry (blacklistEntry) {
  blacklistEntry.classList.add('bl-entry-animate--reverse');
  blacklistEntry.addEventListener('animationend', () => blacklistEntry.remove(), {once: true });
}


/**
 *
 **/
function onFormSubmit (event) {
  event.preventDefault();
  // remove spaces and cancel the function if the value is empty
  const urlPattern = this.elements.urlPattern.value.trim();
  if (!urlPattern) return;
  // create and add entry to the blacklist
  const blacklistEntry = createBlacklistEntry(urlPattern);
  addBlacklistEntry(blacklistEntry);
  // add new url pattern to the beginning of the array
  Config.Blacklist.unshift(urlPattern);
  // clear input field
  this.elements.urlPattern.value = '';
}


/**
 *
 **/
function onInputChange (event) {
  if (Config.Blacklist.indexOf(this.value.trim()) !== -1) {
    this.setCustomValidity('URL pattern already exists.');
  }
  else if (this.validity.customError) this.setCustomValidity('');
}


/**
 *
 **/
function onEntryClick (event) {
  // if delete button received the click
  if (event.target.classList.contains('bl-remove-button')) {
    removeBlacklistEntry(this);
    // remove url pattern from array
    const index = Config.Blacklist.indexOf(this.dataset.urlPattern);
    if (index !== -1) Config.Blacklist.splice(index, 1);
  }
}
