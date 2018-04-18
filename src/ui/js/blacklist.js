'use strict'

/**
 * TODO:
 * - ✓ add
 * - ✓ pattern der webseite regex
 * - ✓ delete
 * - ✓ edit - incl pattern
 * - ✓ animation? jo,ploppen
 * - ✓ array von den webseiten - dublizieren erlaubt?
 * - disablen?
 * - ✓ enter drücken im input
 * aussehen diskutieren
 */
let websites = ["google.com", "https://www.utf8icons.com/character/128515/smiling-face-with-open-mouth"];

const addButton = document.getElementById("bl-add");
      addButton.onclick = onAddButton;
const blacklist = document.getElementById("bl-list");
const inputAddress = document.getElementById("bl-input");
      inputAddress.title = browser.i18n.getMessage('blacklistPattern');
      inputAddress.onkeypress = function(e) {onKeyPage(e)};

function init() {
  for (let index of websites) {
    addEntry(index, "");
  }
}

function addEntry(value, animation) {
  let divEntry = document.createElement('div');
      divEntry.classList.add('bl-entry');
      divEntry.style.animationName = animation;
      if (animation !== "") {
        divEntry.addEventListener('animationend', () => divEntry.style.animationName = "", {once: true });
      }

  let inputPage = document.createElement('input');
      inputPage.classList.add('input-field', 'bl-pages');
      inputPage.pattern = `[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\\.[a-zA-Z-0-9]{2,256}\\b([-a-zA-Z0-9@:%_+.~#?&//=*]*)`;
      inputPage.onfocus = onFocusPage;
      inputPage.onchange = onChangePage;
      inputPage.value = value;

  divEntry.appendChild(inputPage);

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

  blacklist.insertBefore(divEntry, blacklist.childNodes[0]);

  errorMessage("");
}

function onAddButton() {
  let regex = new RegExp(inputAddress.pattern);
  let inputValue = inputAddress.value;

  if (regex.test(inputValue)) {
    if (websites.indexOf(inputValue) === -1) {
      addEntry(inputValue, "animateEntry");
      websites.push(inputValue);
    }
    else {
      errorMessage(browser.i18n.getMessage('blacklistDuplicate'));
    }
  }
  else {
    errorMessage(browser.i18n.getMessage('blacklistPattern'));
  }
}

function onFocusPage() {
  this.dataset.val = this.value;
}

function onChangePage() {
  let oldValue = this.dataset.val;
  let newValue = this.value;
  let index = websites.indexOf(oldValue);
  let regex = new RegExp(this.pattern);
  if (index > -1 && regex.test(newValue)) {
    websites.splice(index, 1);
    websites.push(newValue);
    errorMessage("");
  }
  else {
   this.value = oldValue;
   errorMessage(browser.i18n.getMessage('blacklistPattern'));
  }
}

function onEditButton() {
  let parentNode = this.parentNode;
  let inputField = parentNode.getElementsByTagName('input')[0];
      inputField.select();
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

function onKeyPage(event) {
  if (event.keyCode === 13) onAddButton();
}

function errorMessage(message){
  let error = document.getElementById('bl-error');
      error.innerHTML = message;
}
init();
