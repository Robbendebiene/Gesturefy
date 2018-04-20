'use strict'

const Config = window.top.Config;
let urlSet = new Set(Config.Blacklist);

const addButton = document.getElementById("blAddEntry");
      addButton.onclick = onAddEntry;
const blacklist = document.getElementById("blacklist");
const inputAddress = document.getElementById("blAddressInput");
      inputAddress.placeholder = browser.i18n.getMessage('blacklistNameWebsiteLabel');
      inputAddress.title = browser.i18n.getMessage('blacklistNameAddress');
      inputAddress.onkeypress = onKeyURLEntry;

function init() {
  for (const index of urlSet) {
    addEntry(index, "");
  }
}

function addEntry(value, animation) {
  const divEntry = document.createElement('li');
        divEntry.classList.add('bl-entry');
        divEntry.style.animationName = animation;
        if (animation !== "") divEntry.addEventListener('animationend', () => divEntry.style.animationName = "", {once: true });

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
  else if (!urlSet.has(value)) {
    addEntry(value, "animateEntry");
    urlSet.add(value);
    saveBlacklistData();
  }
  else {
    removeDuplicate(value, this);
    addEntry(value, "animateEntry");
    urlSet.add(value);
    saveBlacklistData();
  }
  inputAddress.value = '';
}

function onEditButton() {
  const inputField = this.parentNode.getElementsByTagName('input')[0];
        inputField.readOnly = false;
        inputField.dataset.val = inputField.value;
        inputField.select();
}

function onDeleteButton() {
  const parentNode = this.parentNode;
        parentNode.style.animationDirection = "reverse";
        parentNode.style.animationName = "animateEntry";
        parentNode.addEventListener('animationend', () => parentNode.remove(), {once: true });
  urlSet.delete(parentNode.getElementsByTagName('input')[0].value);
  saveBlacklistData();
}

function onChangeURLEntry() {
  const oldValue = this.dataset.val;
  const newValue = this.value.trim();
  if (newValue === '') this.value = oldValue;
  else if (!urlSet.has(newValue)) {
    this.value = newValue;
    urlSet.delete(oldValue);
    urlSet.add(newValue);
    saveBlacklistData();
  }
  else if (urlSet.has(newValue)) {
    this.value = newValue;
    removeDuplicate(newValue, this);
    urlSet.add(newValue);
    saveBlacklistData();
  }
}

function onDoubleURLEntry() {
  this.readOnly = false;
  this.dataset.val = this.value;
  this.style.cursor = "text";
}

function removeDuplicate(value, element) {
  const allURLs = [...document.querySelectorAll(".bl-URLs")];
  let sameURL = {};
  for (const index of allURLs) {
    if (index.value === value && index !== element) sameURL = index;
  }
  urlSet.delete(value);
  sameURL.parentNode.remove();
}

function onKeyURLEntry(e) {
  if (e.keyCode === 13) onAddEntry();
}

function onFocusURLEntry() {
  if (this.readOnly) this.blur();
}

function onBlurURLEntry() {
  this.readOnly = true;
  this.style.cursor = "default";
}

function saveBlacklistData() {
  Config.Blacklist = [...urlSet];
}

init();
