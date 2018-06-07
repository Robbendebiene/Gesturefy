'use strict'

/**
 * CommandBar "singleton" class using the module pattern
 * The module needs to be initialized once before using
 * required parameters are an array of commands and a document fragment containing the command settings
 * provides an "onSelect" and "onCancel" event, an event listener can be registered via onEvent(callback)
 * REQUIRES: command-bar.css
 **/
const CommandBar = (function() {

  const module = {};

// private variables

  const document = window.top.document;

  // holds custom event handlers
  const eventHandler = [];
  const commandSelectEventHandler = [];
  const commandCancelEventHandler = [];

  // hold certain node references for later use
  let commandBar,
      commandsContainer, commandsMain, commandsHeading,
      settingsContainer, settingsMain, settingsHeading;

  // holds the initial data
  let commandData, commandSettingTemplates;

  // holds the selected command for the settings page
  let selectedCommand = null;

  // holds the currently active command if existing
  let currentlyActiveCommandObject = null;

  // holds the last scroll position
  let scrollPosition = 0;

// public methods

  /**
   * Initializes the module
   * commands = array of json formatted commands
   * settings = document fragment containing a template per command setting
   **/
  module.init = function init (commands, settings) {
    commandData = commands;
    commandSettingTemplates = settings;
    // build the html structure
    build();
    // fill in all commands
    insertCommands();
  };


	/**
	 * Shows the command bar
	 **/
  module.open = function open (commandObject) {
    if (commandObject) {
      // store currently active command
      currentlyActiveCommandObject = commandObject;
      // mark the currently active command item
      const currentCommandItem = commandsMain.querySelector(`.cb-command-item[data-command=${commandObject.command}]`);
            currentCommandItem.classList.add("active");
    }

    if (!document.body.contains(commandBar)) {
      commandBar.classList.add("cb-hide");
      document.body.appendChild(commandBar);
      // trigger reflow
      commandBar.offsetHeight;
      commandBar.classList.replace("cb-hide", "cb-show");
    }
  };


  /**
   * Hides the command bar and resets its internals
   **/
  module.close = function close () {
    if (document.body.contains(commandBar)) {
      commandBar.addEventListener("transitionend", function removeCommandBar(event)  {
        // prevent the event from firing for child transitions
        if (event.currentTarget === event.target) {
          // remove exisiting settings
          while (settingsMain.firstChild) settingsMain.firstChild.remove();

          // switch back to the commands container
          if (settingsContainer.isConnected) {
            commandBar.replaceChild(commandsContainer, settingsContainer)
          }

          commandBar.classList.remove("cb-hide");
          commandBar.remove();
          commandBar.removeEventListener("transitionend", removeCommandBar);
        }
      });
      commandBar.classList.replace("cb-show", "cb-hide");
    }

    // clear event handler array
    commandSelectEventHandler.length = 0;

    // unmark the currently active command item
    if (currentlyActiveCommandObject) {
      const currentCommandItem = commandsMain.querySelector(".cb-command-item.active");
            currentCommandItem.classList.remove("active");
    }

    // reset temporary variables
    selectedCommand = null;
    currentlyActiveCommandObject = null;
    scrollPosition = 0;
  };


  /**
   * Add the onChoice event handler
   **/
  module.onSelect = function onSelect (handler) {
    commandSelectEventHandler.push(handler);
  }


  /**
   * Add the onChoice event handler
   **/
  module.onCancel = function onCancel (handler) {
    commandCancelEventHandler.push(handler);
  }


  /**
   * Creates the required HTML structure
   **/
  function build () {
    commandBar = document.createElement("div");
    commandBar.classList.add("command-bar");

    commandsContainer = document.createElement("div");
    commandsContainer.classList.add("cb-container");

    settingsContainer = document.createElement("div");
    settingsContainer.classList.add("cb-container");

    // build command container structure
    const commandsHead = document.createElement("div");
          commandsHead.classList.add("cb-head");
          commandsHeading = document.createElement("h1");
          commandsHeading.classList.add("cb-heading");
    const closeButton = document.createElement("button");
          closeButton.classList.add("cb-head-button", "cb-close-button");
          closeButton.onclick = cancelCommand;
    commandsHead.append(closeButton, commandsHeading);

    commandsMain = document.createElement("div");
    commandsMain.classList.add("cb-main");

    // append command container
    commandsContainer.append(commandsHead, commandsMain);
    commandBar.appendChild(commandsContainer);

    // build settings container structure
    const settingsHead = document.createElement("div");
          settingsHead.classList.add("cb-head");
          settingsHeading = document.createElement("h1");
          settingsHeading.classList.add("cb-heading");
    const backButton = document.createElement("button");
          backButton.classList.add("cb-head-button", "cb-back-button");
          backButton.onclick = showCommands;
    settingsHead.append(backButton, settingsHeading);

    settingsMain = document.createElement("div");
    settingsMain.classList.add("cb-main");

    const settingsFooter = document.createElement("div");
          settingsFooter.classList.add("cb-footer");
    const saveButton = document.createElement("button");
          saveButton.classList.add("cb-save-button");
          saveButton.textContent = browser.i18n.getMessage('commandBarSaveButton');
          saveButton.onclick = saveSettings;
    settingsFooter.appendChild(saveButton);

    settingsContainer.append(settingsHead, settingsMain, settingsFooter);
  }


  /**
   * Add all commands in the commands panel
   **/
  function insertCommands () {
    // set heading
    commandsHeading.textContent = browser.i18n.getMessage('commandBarTitle');

    const commandsScrollContainer = document.createElement("div");
          commandsScrollContainer.classList.add("cb-scroll-container");
    commandsMain.appendChild(commandsScrollContainer);

    // build command list
    const groups = new Map();

    for (let commandItem of commandData) {
      const item = document.createElement("li");
            item.classList.add("cb-command-item");
            item.dataset.command = commandItem.command;
            item.onclick = selectCommand;
            item.onmouseleave = hideCommandDescription;
            item.onmouseover = showCommandDescription;

      const itemContainer = document.createElement("div");
            itemContainer.classList.add("cb-command-container");
      const label = document.createElement("span");
            label.classList.add("cb-command-name");
            label.textContent = browser.i18n.getMessage(`commandName${commandItem.command}`);
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
              permissionsNode.textContent = browser.i18n.getMessage('requiredPermissionsText');
        commandItem.permissions.forEach((permission, index, array) => {
          permissionsNode.textContent += browser.i18n.getMessage(`permissionName${permission}`);
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
  }


  /**
   * Add all command related settings in the settings panel
   **/
  function insertSettings (commandItem) {
    // set heading
    settingsHeading.textContent = browser.i18n.getMessage(`commandName${commandItem.command}`);

    // remove exisiting children
    while (settingsMain.firstChild) settingsMain.firstChild.remove();

    // get the corresponding settings templates
    const templates = commandSettingTemplates.querySelectorAll(`[data-commands~="${commandItem.command}"]`);

    // contains the command setting values
    let commandSettings;
    // if the currently active command is selected get the last chosen command settings
    if (currentlyActiveCommandObject && commandItem.command === currentlyActiveCommandObject.command) {
      commandSettings = currentlyActiveCommandObject.settings;
    }
    // else use the default settings
    else {
      commandSettings = commandItem.settings;
    }

    for (let template of templates) {
      const settingsContainer = document.createElement("div");
            settingsContainer.classList.add("cb-setting");
      const setting = template.content.cloneNode(true);

      // insert text from language files
      const i18nTextElements = setting.querySelectorAll('[data-i18n]');
      for (let element of i18nTextElements) {
        element.textContent = browser.i18n.getMessage(element.dataset.i18n);
      }

      // insert command settings
      const inputs = setting.querySelectorAll("[name]");
      for (let input of inputs) {
        if (input.type === "checkbox") input.checked = commandSettings[input.name];
        else input.value = commandSettings[input.name];
      }

      // append the current settings
      settingsContainer.appendChild(setting);
      settingsMain.appendChild(settingsContainer);
    }
  }


  /**
   * Hides the settings panel and switches to the commands panel
   **/
  function showCommands () {
    settingsContainer.classList.add("cb-init-slide", "cb-slide-middle");
    commandsContainer.classList.add("cb-init-slide", "cb-slide-left");
    commandBar.appendChild(commandsContainer);
    // Set the last scroll position and trigger reflow
    commandsMain.scrollTop = scrollPosition;

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
  function showSettings () {
    commandsContainer.classList.add("cb-init-slide", "cb-slide-middle");
    settingsContainer.classList.add("cb-init-slide", "cb-slide-right");
    commandBar.appendChild(settingsContainer);
    // trigger reflow
    commandBar.offsetHeight;

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
   * Shows the description of the current command on info icon hover
   **/
  function showCommandDescription (event) {
    if (event.target.classList.contains("cb-command-icon")) {
      const command = event.currentTarget.dataset.command;
      const description = event.currentTarget.querySelector(".cb-command-description");

      if (!description.style.height) {
        description.style.height = description.scrollHeight + "px";
      }
    }
  }


  /**
   * Hides the describtion of the current command
   **/
  function hideCommandDescription (event) {
    const command = event.currentTarget.dataset.command;
    const description = event.currentTarget.querySelector(".cb-command-description");

    if (description.style.height) {
      description.style.height = null;
    }
  }


  /**
   * Handles the command selection procedure
   * Asks the user for extra permissions if required
   * Switches to the command settings if existing
   **/
  function selectCommand (event) {
    // get command item
    const commandItem = commandData.find((element) => {
      return element.command === event.currentTarget.dataset.command;
    });
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

    // helper function to proceed the command selection
    function proceed () {
      // if the command offers any settings show them
      if (commandItem.settings) {
        insertSettings(commandItem);
        // store a copy of the selected command
        selectedCommand = commandItem;
        // store current scroll position
        scrollPosition = commandsMain.scrollTop;

        showSettings();
      }
      else submitCommand({"command": commandItem.command});
    }
  }


  /**
   * Gathers the specified settings data from the all input elements and submits the command
   **/
  function saveSettings () {
    const data = {
      "command": selectedCommand.command,
      "settings": {}
    }

    for (let setting in selectedCommand.settings) {
      const input = settingsMain.querySelector(`.cb-setting [name="${setting}"]`);

      // skip function if at least one input field is not valid
      if (!input.validity.valid) return;

      // get true or false for checkboxes
      if (input.type === "checkbox") data.settings[setting] = input.checked;
      // get value either as string or number
      else data.settings[setting] = isNaN(input.valueAsNumber) ? input.value : input.valueAsNumber;
    }

    submitCommand(data);
  }


  /**
   * Propagates the passed command to all event listeners
   **/
  function submitCommand (command) {
    commandSelectEventHandler.forEach((callback) => callback(command));
  }


  /**
   * Dispatches all cancel event listeners
   **/
  function cancelCommand () {
    commandCancelEventHandler.forEach((callback) => callback());
  }

  return module;
})();
