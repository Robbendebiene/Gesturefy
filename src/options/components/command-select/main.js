import { fetchJSONAsObject, fetchHTMLAsFragment } from "/core/commons.js";

let COMMAND_ITEMS,
    COMMAND_SETTING_TEMPLATES;

fetchJSONAsObject(browser.runtime.getURL("/resources/json/commands.json")).then(res => COMMAND_ITEMS = res);
fetchHTMLAsFragment(browser.runtime.getURL("/options/components/command-select/command-setting-templates.inc")).then(res => COMMAND_SETTING_TEMPLATES = res);

/**
 * Custom element - <command-select>
 * Accepts one special attribute (and property):
 * value : JSON Object - contains the command object
 * JSON Object format = { command: "command_name", settings: { setting_name: "setting_value" } }
 * Dispatches a "change" event on value changes
 **/
class CommandSelect extends HTMLElement {

  /**
   * Construcor
   * Set default variables
   * Create shadow root and load stylesheet by appending it to the shadow DOM
   * If available set command select text and title
   **/
  constructor() {
    super();
    // holds a reference of the current command item when switching to the settings panel
    this._selectedCommand = null;
    // holds the current scroll position when switching to the settings panel
    this._scrollPosition = 0;
    // gate variable
    this._isOpen = false;

    this.attachShadow({mode: 'open'}).innerHTML = `
      <link rel="stylesheet" href="/options/components/command-select/layout.css">
      <span id="content"></span>
    `;

    const content = this.shadowRoot.getElementById("content");
    if (this.value && this.value.command) {
      content.textContent = content.title = browser.i18n.getMessage(`commandLabel${this.value.command}`);
    }
    else {
      content.textContent = content.title= "";
    }
    
    this.addEventListener('click', this._handleHostElementClick.bind(this));
  }


  /**
   * Add attribute observer
   **/
  static get observedAttributes() {
    return ['value'];
  }


  /**
   * Attribute change handler
   * Change the text and title of the command select on "value" attribute change
   **/
  attributeChangedCallback (name, oldValue, newValue) {
    if (name === "value") {
      const content = this.shadowRoot.getElementById("content");
      if (this.value && this.value.command) {
        content.textContent = content.title = browser.i18n.getMessage(`commandLabel${this.value.command}`);
      }
      else {
        content.textContent = content.title= "";
      }
    }
  }


  /**
   * Getter for the "value" attribute
   **/
  get value () {
    return JSON.parse(this.getAttribute('value'));
  }


  /**
   * Setter for the "value" attribute
   **/
  set value (value) {
    this.setAttribute('value', JSON.stringify(value));
  }


  /**
   * Constructs the main command bar structure and overlay
   * Returns it as a document fragment
   **/
  _buildCommandBar () {
    const template = document.createElement('template');
    template.innerHTML = `
      <div id="overlay"></div>

      <div id="commandBar">
        <button id="commandBarCancelButton" type="button"></button>
        <div id="commandBarWrapper"></div>
      </div>
    `;

    // register event handlers
    const overlay = template.content.getElementById("overlay");
          overlay.addEventListener("click", this._closeCommandBar.bind(this), { once: true });
    const commandBarCancelButton = template.content.getElementById("commandBarCancelButton");
          commandBarCancelButton.addEventListener("click", this._closeCommandBar.bind(this), { once: true });

    return template.content;
  }


  /**
   * Constructs the commands panel and adds all the required event handlers
   * Returns it as a document fragment
   **/
  _buildCommandsPanel () {
    const template = document.createElement('template');
    template.innerHTML = `
      <div id="commandsContainer" class="cb-container">
        <div class="cb-head">
          <div id="commandsHeading" class="cb-heading"></div>
          <button id="commandsSearchButton" type="button"></button>
          <input id="commandsSearchInput" class="input-field">
        </div>
        <div id="commandsMain" class="cb-main">
          <div id="commandsScrollContainer" class="cb-scroll-container"></div>
        </div>
      </div>
    `;

    const commandsHeading = template.content.getElementById("commandsHeading");
          commandsHeading.title = commandsHeading.textContent = browser.i18n.getMessage('commandBarTitle');

    const commandsSearchButton = template.content.getElementById("commandsSearchButton");
          commandsSearchButton.onclick = this._handleSearchButtonClick.bind(this);

    const commandsSearchInput = template.content.getElementById('commandsSearchInput');
          commandsSearchInput.onkeyup = this._handleSearchKeyUp.bind(this);
          commandsSearchInput.placeholder = browser.i18n.getMessage('commandBarSearch');

    const commandsScrollContainer = template.content.getElementById("commandsScrollContainer");

    // build command list
    const groups = new Map();

    for (let commandItem of COMMAND_ITEMS) {
      const item = document.createElement("li");
            item.classList.add("cb-command-item");
            item.dataset.command = commandItem.command;
            item.onclick = this._handleCommandItemClick.bind(this);
            item.onmouseleave = this._handleCommandItemMouseLeave.bind(this);
            item.onmouseover = this._handleCommandItemMouseOver.bind(this);

      const itemContainer = document.createElement("div");
            itemContainer.classList.add("cb-command-container");
      const label = document.createElement("span");
            label.classList.add("cb-command-name");
            label.textContent = browser.i18n.getMessage(`commandLabel${commandItem.command}`);
      const icon = document.createElement("span");
            icon.classList.add("cb-command-icon");
            icon.classList.add(commandItem.permissions ?
              "cb-command-permissions-icon" : "cb-command-info-icon"
            );
      itemContainer.append(label, icon);

      const description = document.createElement("div");
            description.classList.add("cb-command-description");
            description.textContent = browser.i18n.getMessage(`commandDescription${commandItem.command}`);

      // build permissions info string
      if (commandItem.permissions) {
        const permissionsNode = document.createElement("em");
              permissionsNode.classList.add("cb-command-permissions");
              permissionsNode.textContent = browser.i18n.getMessage('commandBarRequiredPermissionsText');
        commandItem.permissions.forEach((permission, index, array) => {
          permissionsNode.textContent += browser.i18n.getMessage(`permissionLabel${permission}`);
          if (index < array.length - 2) permissionsNode.textContent += ", ";
          else if (index === array.length - 2) permissionsNode.textContent += " & ";
        });
        description.appendChild(permissionsNode);
      }

      item.append(itemContainer, description);

      if (groups.has(commandItem.group)) {
        const list = groups.get(commandItem.group);
        list.appendChild(item);
      }
      else {
        const list = document.createElement("ul");
              list.classList.add("cb-command-group");
        groups.set(commandItem.group, list);
        list.appendChild(item);
        commandsScrollContainer.appendChild(list);
      }
    }

    // mark the currently active command item
    if (this.value && this.value.command) {
      const currentCommandItem = template.content.querySelector(`.cb-command-item[data-command=${this.value.command}]`);
      currentCommandItem.classList.add("cb-active");
    }

    return template.content;
  }


  /**
   * Constructs the settings panel of the currently selected command and adds all the required event handlers
   * Returns it as a document fragment
   **/
  _buildSettingsPanel () {
    const template = document.createElement('template');
    template.innerHTML = `
      <div id="settingsContainer" class="cb-container">
        <div class="cb-head">
          <button id="settingsBackButton" type="button"></button>
          <div id="settingsHeading" class="cb-heading"></div>
        </div>
        <div id="settingsMain" class="cb-main">
          <div id="settingsScrollContainer" class="cb-scroll-container"></div>
        </div>
      </div>
    `;

    // register event handlers
    const settingsBackButton = template.content.getElementById("settingsBackButton");
          settingsBackButton.onclick = this._handleBackButtonClick.bind(this);

    const settingsScrollContainer = template.content.getElementById("settingsScrollContainer");
    const settingsHeading = template.content.getElementById("settingsHeading");

    // set heading
    settingsHeading.title = settingsHeading.textContent = browser.i18n.getMessage(`commandLabel${this._selectedCommand.command}`);
    // create form
    const settingsForm = document.createElement("form");
          settingsForm.id = "settingsForm";
          settingsForm.onsubmit = this._handleFormSubmit.bind(this);
    // create and apend save button
    const saveButton = document.createElement("button");
          saveButton.id = "settingsSaveButton";
          saveButton.type = "submit";
          saveButton.textContent = browser.i18n.getMessage('commandBarSaveButton');
          settingsForm.appendChild(saveButton);

    // get the corresponding setting templates
    const templates = COMMAND_SETTING_TEMPLATES.querySelectorAll(`[data-commands~="${this._selectedCommand.command}"]`);

    // contains the command setting values
    let commandSettings;

    // if the currently active command is selected get the last chosen command settings
    if (this.value && this.value.command === this._selectedCommand.command) {
      // assign to empty object, because otherwise the stored command item settings would be changed to
      commandSettings = Object.assign({}, this._selectedCommand.settings, this.value.settings);
    }
    // else use the default settings
    else {
      commandSettings = this._selectedCommand.settings;
    }

    // build and insert settings
    for (let template of templates) {
      const settingContainer = document.createElement("div");
            settingContainer.classList.add("cb-setting");
      const setting = template.content.cloneNode(true);
      // append the current settings
      settingContainer.appendChild(setting);
      settingsForm.insertBefore(settingContainer, saveButton);
    }

    // insert text from language files
    for (let element of settingsForm.querySelectorAll('[data-i18n]')) {
      element.textContent = browser.i18n.getMessage(element.dataset.i18n);
    }

    // insert command settings
    for (let input of settingsForm.querySelectorAll("[name]")) {
      if (input.type === "checkbox") input.checked = commandSettings[input.name];
      else input.value = commandSettings[input.name];
    }

    // append form
    settingsScrollContainer.appendChild(settingsForm);

    return template.content;
  }


  /**
   * Opens the command bar and shows the commands panel
   **/
  _openCommandBar () {
    const commandBarFragment = this._buildCommandBar();

    const commandBarWrapper = commandBarFragment.getElementById("commandBarWrapper");
    // add commands panel
    commandBarWrapper.appendChild( this._buildCommandsPanel() );
    
    const overlay = commandBarFragment.getElementById("overlay");
    const commandBar = commandBarFragment.getElementById("commandBar");

    overlay.classList.add("o-hide");
    commandBar.classList.add("cb-hide");

    // append to shadow dom
    this.shadowRoot.appendChild( commandBarFragment );

    commandBar.offsetHeight;

    overlay.classList.replace("o-hide", "o-show");
    commandBar.classList.replace("cb-hide", "cb-show");
  }


  /**
   * Closes the command bar and resets the internal variables
   **/
  _closeCommandBar () {
    const overlay = this.shadowRoot.getElementById("overlay");
    const commandBar = this.shadowRoot.getElementById("commandBar");

    const self = this;

    overlay.addEventListener("transitionend",function removeOverlay(event) {
      // prevent the event from firing for child transitions
      if (event.currentTarget === event.target) {
        overlay.removeEventListener("transitionend", removeOverlay);
        overlay.remove();
        self._isOpen = false;
      }
    });
    commandBar.addEventListener("transitionend", function removeCommandBar(event) {
      // prevent the event from firing for child transitions
      if (event.currentTarget === event.target) {
        commandBar.removeEventListener("transitionend", removeCommandBar);
        commandBar.remove();
        self._isOpen = false;
      }
    });

    overlay.classList.replace("o-show", "o-hide");
    commandBar.classList.replace("cb-show", "cb-hide");

    // reset variables
    this._selectedCommand = null;
    this._scrollPosition = 0;
  }


  /**
   * Hides the settings panel and switches to the commands panel
   **/
  _showCommandsPanel () {
    const commandBarWrapper = this.shadowRoot.getElementById("commandBarWrapper");
    const commandsContainer = this.shadowRoot.getElementById("commandsContainer");
    const commandsMain = this.shadowRoot.getElementById("commandsMain");
    const settingsContainer = this.shadowRoot.getElementById("settingsContainer");

    settingsContainer.classList.add("cb-init-slide", "cb-slide-middle");
    commandsContainer.classList.add("cb-init-slide", "cb-slide-left");
    commandBarWrapper.appendChild(commandsContainer);
    // set the last scroll position and trigger reflow
    commandsMain.scrollTop = this._scrollPosition;

    settingsContainer.addEventListener("transitionend", function removeSettingsContainer(event) {
      // prevent event bubbeling
      if (event.currentTarget === event.target) {
        settingsContainer.remove();
        settingsContainer.classList.remove("cb-init-slide", "cb-slide-right");
        settingsContainer.removeEventListener("transitionend", removeSettingsContainer);
      }
    });
    commandsContainer.addEventListener("transitionend", function slideCommandsContainer(event) {
      // prevent event bubbeling
      if (event.currentTarget === event.target) {
        commandsContainer.classList.remove("cb-init-slide", "cb-slide-middle");
        commandsContainer.removeEventListener("transitionend", slideCommandsContainer);
      }
    });

    settingsContainer.classList.replace("cb-slide-middle", "cb-slide-right");
    commandsContainer.classList.replace("cb-slide-left",  "cb-slide-middle");
  }


  /**
   * Hides the commands panel and switches to the settings panel
   **/
  _showSettingsPanel () {
    const commandBarWrapper = this.shadowRoot.getElementById("commandBarWrapper");
    const commandsContainer = this.shadowRoot.getElementById("commandsContainer");
    const settingsContainer = this.shadowRoot.getElementById("settingsContainer");

    commandsContainer.classList.add("cb-init-slide", "cb-slide-middle");
    settingsContainer.classList.add("cb-init-slide", "cb-slide-right");
    commandBarWrapper.appendChild(settingsContainer);
    // trigger reflow
    commandBarWrapper.offsetHeight;

    commandsContainer.addEventListener("transitionend", function removeCommandsContainer(event) {
      // prevent event bubbeling
      if (event.currentTarget === event.target) {
        commandsContainer.remove();
        commandsContainer.classList.remove("cb-init-slide", "cb-slide-left");
        commandsContainer.removeEventListener("transitionend", removeCommandsContainer);
      }
    });
    settingsContainer.addEventListener("transitionend", function slideSettingsContainer(event) {
      // prevent event bubbeling
      if (event.currentTarget === event.target) {
        settingsContainer.classList.remove("cb-init-slide", "cb-slide-middle");
        settingsContainer.removeEventListener("transitionend", slideSettingsContainer);
      }
    });

    commandsContainer.classList.replace("cb-slide-middle", "cb-slide-left");
    settingsContainer.classList.replace("cb-slide-right",  "cb-slide-middle");
  }


  /**
   * Opens the command bar if it isn't already open and the necessary data is available
   **/
  _handleHostElementClick (event) {
    // cancel if the ressources aren't loaded yet
    if (!COMMAND_ITEMS || !COMMAND_SETTING_TEMPLATES) return;
    // ignore click events when command bar is open
    if (!this._isOpen) {
      this._openCommandBar();
      this._isOpen = true;
    }
  }


  /**
   * Shows the description of the current command if the info icon is hovered
   **/
  _handleCommandItemMouseOver (event) {
    if (event.target.classList.contains("cb-command-icon")) {
      const commandItemDescription = event.currentTarget.querySelector(".cb-command-description");
      if (!commandItemDescription.style.getPropertyValue("height")) {
        commandItemDescription.style.setProperty("height", commandItemDescription.scrollHeight + "px");
      }
    }
  }


  /**
   * Hides the describtion of the current command
   **/
  _handleCommandItemMouseLeave (event) {
    const commandItemDescription = event.currentTarget.querySelector(".cb-command-description");
    if (commandItemDescription.style.getPropertyValue("height")) {
      commandItemDescription.style.removeProperty("height");
    }
  }


  /**
   * Handles the command selection procedure
   * Asks the user for extra permissions if required
   * Switches to the command settings if existing
   **/
  _handleCommandItemClick (event) {
    // hide command description
    const commandDescription = event.currentTarget.querySelector('.cb-command-description');
          commandDescription.style.removeProperty("height");

    // get command item
    const commandItem = COMMAND_ITEMS.find((element) => {
      return element.command === event.currentTarget.dataset.command;
    });

    // helper function to proceed the command selection
    const proceed = () => {
      // if the command offers any settings show them
      if (commandItem.settings) {
        const commandsMain = this.shadowRoot.getElementById("commandsMain");
        // store current scroll position
        this._scrollPosition = commandsMain.scrollTop;
        // store a reference to the selected command
        this._selectedCommand = commandItem;

        const commandBarWrapper = this.shadowRoot.getElementById("commandBarWrapper");
        // add settings panel
        commandBarWrapper.appendChild( this._buildSettingsPanel() );
        this._showSettingsPanel();
      }
      else {
        this.value = { "command": commandItem.command };
        this.dispatchEvent( new InputEvent('change') );
        this._closeCommandBar();
      }
    }

    // if the command requires permissions
    if (commandItem.permissions) {
      const permissionRequest = browser.permissions.request({
        permissions: commandItem.permissions,
      });
      permissionRequest.then((granted) => {
        if (granted) proceed();
      });
    }
    else proceed();
  }


  /**
   * Toggles the search input
   **/
  _handleSearchButtonClick () {
    const commandsContainer = this.shadowRoot.getElementById('commandsContainer');
    commandsContainer.classList.toggle('search-visible');    
    const input = this.shadowRoot.getElementById('commandsSearchInput');

    // after hiding the searchbar, the search is cleared and the bar is reset.
    if (!commandsContainer.classList.contains('search-visible')) {
      input.value = "";
      this._handleSearchKeyUp(); 
    }
    else {
      input.focus();
    }
  }


  /**
   * Show or hide the searched results in the command bar.
   **/
  _handleSearchKeyUp () {
    const commandsContainer = this.shadowRoot.getElementById('commandsContainer');
    const searchQuery = this.shadowRoot.getElementById('commandsSearchInput').value.toLowerCase().trim();
    const searchQueryKeywords = searchQuery.split(" ");

    if (searchQuery !== "") {
      // hide all groups to remove padding and lines of the border
      commandsContainer.classList.add('search-runs');
    }
    else {
      commandsContainer.classList.remove('search-runs');
    }

    const commandNameElements = this.shadowRoot.querySelectorAll('.cb-command-name');
    for (let commandNameElement of commandNameElements) {
      const commandName = commandNameElement.textContent.toLowerCase().trim();

      for (let keyword of searchQueryKeywords) {
        // check if the keyword is included in the command name
        if (commandName.indexOf(keyword) > -1) {
          commandNameElement.closest('.cb-command-item').hidden = false;
        }
        else {
          // if one keyword does not match the command name, the command item will be hidden
          commandNameElement.closest('.cb-command-item').hidden = true;
          break;
        }
      }
    }
  }


  /**
   * Hides the settings panel and shows the command panel
   **/
  _handleBackButtonClick (event) {
    const commandBarWrapper = this.shadowRoot.getElementById("commandBarWrapper");
    // add commands panel
    commandBarWrapper.appendChild( this._buildCommandsPanel() );
    this._showCommandsPanel();
  }


  /**
   * Gathers and saves the specified settings data from the all input elements and closes the command bar
   **/
  _handleFormSubmit (event) {
    // prevent page reload
    event.preventDefault();

    const commandObject = {
      "command": this._selectedCommand.command,
      "settings": {}
    };

    const settingsForm = this.shadowRoot.getElementById("settingsForm");
    for (let setting in this._selectedCommand.settings) {
      const input = settingsForm.elements[setting];
      // get true or false for checkboxes
      if (input.type === "checkbox") commandObject.settings[setting] = input.checked;
      // get value either as string or number
      else commandObject.settings[setting] = isNaN(input.valueAsNumber) ? input.value : input.valueAsNumber;
    }

    this.value = commandObject;
    this.dispatchEvent( new InputEvent('change') );
    this._closeCommandBar();
  }
}

// define custom element <command-select></command-select>
window.customElements.define('command-select', CommandSelect);