'use strict'

const urlSet = new Set(Config.Blacklist);

const addButton = document.getElementById("blAddEntry");
      addButton.onclick = onAddEntry;
const blacklist = document.getElementById("blacklist");
const inputAddress = document.getElementById("blAddressInput");
      inputAddress.placeholder = browser.i18n.getMessage('blacklistNameWebsiteLabel');
      inputAddress.title = browser.i18n.getMessage('blacklistNameAddress');
      inputAddress.onkeypress = onKeyURLEntry;

for (const url of urlSet) {
  addEntry(url, false);
}

function addEntry(value, animation) {
  const divEntry = document.createElement('li');
        divEntry.classList.add('bl-entry');
        if (animation) {
          divEntry.classList.toggle('bl-entry-animate');
          divEntry.addEventListener('animationend', () => divEntry.classList.toggle('bl-entry-animate'), {once: true });
        }

  const inputURLEntry = document.createElement('input');
        inputURLEntry.classList.add('input-field', 'bl-URLs');
        inputURLEntry.value = value;
        inputURLEntry.readOnly = true;
        inputURLEntry.onchange = onChangeURLEntry;
        inputURLEntry.ondblclick = onDoubleURLEntry;
        inputURLEntry.onfocus= onFocusURLEntry;
        inputURLEntry.onblur = onBlurURLEntry;

  divEntry.appendChild(inputURLEntry);

  const editButton = document.createElement('button');
        editButton.classList.add('bl-entry-button');
        editButton.innerHTML = "&#128579;";
        editButton.onclick = onEditButton;
  divEntry.appendChild(editButton);

  const deleteButton = document.createElement('button');
        deleteButton.classList.add('bl-entry-button');
        deleteButton.innerHTML = "&#128551;";
        deleteButton.onclick = onDeleteButton;
  divEntry.appendChild(deleteButton);

  blacklist.insertBefore(divEntry, blacklist.firstChild);
}

function onAddEntry() {
  const value = inputAddress.value.trim();
  if (value === '') return;
  else if (urlSet.has(value)) removeDuplicate(value, this);
  addEntry(value, true);
  urlSet.add(value);
  saveBlacklistData();
  inputAddress.value = '';
}

function onEditButton() {
  const inputField = this.parentNode.querySelector(".bl-URLs");
        inputField.readOnly = false;
        inputField.dataset.url = inputField.value;
        inputField.select();
}

function onDeleteButton() {
  const parentNode = this.parentNode;
        parentNode.classList.toggle('bl-entry-animate--reverse');
        parentNode.addEventListener('animationend', () => parentNode.remove(), {once: true });
  urlSet.delete(parentNode.querySelector(".bl-URLs").value);
  saveBlacklistData();
}

function onChangeURLEntry() {
  const oldValue = this.dataset.url;
  const newValue = this.value.trim();
  if (newValue === '') this.value = oldValue;
  else if (!urlSet.has(newValue)) {
    this.value = newValue;
    urlSet.delete(oldValue);
    urlSet.add(newValue);
    saveBlacklistData();
  }
  else {
    this.value = newValue;
    removeDuplicate(newValue, this);
    urlSet.add(newValue);
    saveBlacklistData();
  }
}

function onDoubleURLEntry() {
  this.readOnly = false;
  this.dataset.url = this.value;
}

function removeDuplicate(value, element) {
  const urlInputs = document.querySelectorAll(".bl-URLs");
  for (const input of urlInputs) {
    if (input.value === value && input !== element) {
      urlSet.delete(value);
      input.parentNode.remove();
    }
  }
}

function onKeyURLEntry(e) {
  if (e.keyCode === 13) onAddEntry();
}

function onFocusURLEntry() {
  if (this.readOnly) this.blur();
}

function onBlurURLEntry() {
  this.readOnly = true;
}

function saveBlacklistData() {
  Config.Blacklist = new window.top.Array(...urlSet);
}
