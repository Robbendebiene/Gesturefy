'use strict'

let websites = ["google.com", "https://www.utf8icons.com/character/128515/smiling-face-with-open-mouth"];

const addButton = document.getElementById("blAddEntry");
      addButton.onclick = onAddEntry;
const blacklist = document.getElementById("blList");
const inputAddress = document.getElementById("blAddressInput");
      inputAddress.placeholder = browser.i18n.getMessage('blacklistNameWebsiteLabel');
      inputAddress.onkeypress = onKeyPageEntry;

function init() {
  for (let index of websites) {
    addEntry(index, "");
  }
}

function addEntry(value, animation) {
  let divEntry = document.createElement('div');
      divEntry.classList.add('bl-entry');
      divEntry.style.animationName = animation;
      if (animation !== "") divEntry.addEventListener('animationend', () => divEntry.style.animationName = "", {once: true });

  let inputPageEntry = document.createElement('input');
      inputPageEntry.classList.add('input-field', 'bl-pages');
      inputPageEntry.onchange = onChangePageEntry;
      inputPageEntry.ondblclick = onDoublePageEntry;
      inputPageEntry.value = value;
      inputPageEntry.readOnly = true;

  divEntry.appendChild(inputPageEntry);

  let editButton = document.createElement('button');
      editButton.classList.add('bl-entry-button', 'bl-edit');
      editButton.innerHTML = "&#128579;";
      editButton.onclick = onEditButton;
  divEntry.appendChild(editButton);

  let deleteButton = document.createElement('button');
      deleteButton.classList.add('bl-entry-button', 'bl-delete');
      deleteButton.innerHTML = "&#128551;";
      deleteButton.onclick = onDeleteButton;
  divEntry.appendChild(deleteButton);

  blacklist.insertBefore(divEntry, blacklist.firstChild);
}

function onAddEntry() {
  let inputValue = inputAddress.value;
  let value = inputValue.replace(/\s/g, '');
  if (websites.indexOf(value) === -1 && value !== '') {
    addEntry(value, "animateEntry");
    websites.push(value);
  }
  else if (value !== '') {
    removeDuplicate(value, this);
    addEntry(value, "animateEntry");
  }
  inputAddress.value = '';
}

function onChangePageEntry() {
  let oldValue = this.dataset.val;
  let newValue = this.value;
  let indexNew = websites.indexOf(newValue);
  let value = newValue.replace(/\s/g, '');
  if (websites.indexOf(oldValue) > -1 && value !== '' && indexNew === -1) {
    websites.splice(websites.indexOf(oldValue), 1);
    websites.push(value);
    this.value = value;
  }
  else if (indexNew > -1) {
    removeDuplicate(value, this);
    this.value = value;
  }
  else if (value === '') {
    this.value = oldValue;
  }
  this.readOnly = true;
  this.style.cursor = "default";
}

function onEditButton() {
  let inputField = this.parentNode.getElementsByTagName('input')[0];
      inputField.readOnly = false;
      inputField.select();
      inputField.dataset.val = inputField.value;
}

function onDeleteButton() {
  let parentNode = this.parentNode;
      parentNode.style.animationDirection = "reverse";
      parentNode.style.animationName = "animateEntry";
  let index = websites.indexOf(parentNode.getElementsByTagName('input')[0].value);
  if (index > -1) {
    websites.splice(index, 1);
    parentNode.addEventListener('animationend', () => parentNode.remove(), {once: true });
  }
}

function onKeyPageEntry(e) {
  if (e.keyCode === 13) onAddEntry();
}

function onDoublePageEntry() {
  this.readOnly = false;
  this.dataset.val = this.value;
  this.style.cursor = "text";
}

function removeDuplicate(value, element) {
  let allBlPages = [...document.querySelectorAll(".bl-pages")];
  let samePage = {};
  for (let index of allBlPages) {
    if (index.value === value && index !== element) {
      samePage = index;
    }
  }
  websites.splice(websites.indexOf(value), 1);
  let parentNode = samePage.parentNode;
  websites.push(value);
  parentNode.remove();
}

init();
