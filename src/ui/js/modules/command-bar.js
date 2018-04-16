'use strict'

/**
 * CommandBar "singleton" class using the module pattern
 * the module needs to be initialized first
 * the required parameters are an array of commands
 * and a document fragment containing the command settings
 * provides an "onChoice" event, an event listener can be registered via onChoice(callback)
 * REQUIRES: command-bar.css
 **/
const CommandBar = (function() {

  const module = {};

  // private variables

  const document = window.top.document;

  const eventHandler = [];

  // create and save certain node references for later use

  const commandBar = document.createElement("div");
        commandBar.classList.add("command-bar");

  const commandsContainer = document.createElement("div");
        commandsContainer.classList.add("cb-container");

  const settingsContainer = document.createElement("div");
        settingsContainer.classList.add("cb-container");

  const settingsHeading = document.createElement("h1");
        settingsHeading.classList.add("cb-heading");

  const commandsMain = document.createElement("div");
        commandsMain.classList.add("cb-main");

  const settingsMain = document.createElement("div");
        settingsMain.classList.add("cb-main");

  // holds the initial data
  let commandData, settingTemplates;

  // holds the selected command for the settings page
  let selectedCommand = null;

  // holds the last scroll position
  let scrollPosition = 0;


// public methods

  /**
   * Add the message event listener
   **/
  module.init = function init (commands, settings) {
    commandData = commands;
    settingTemplates = settings;
    buildCommandBar();
  };


	/**
	 * Add the message event listener
	 **/
  module.open = function open () {
    if (!document.body.contains(commandBar)) {
      commandBar.classList.add("cb-hide");
      document.body.appendChild(commandBar);
      // trigger reflow
      commandBar.offsetHeight;
      commandBar.classList.replace("cb-hide", "cb-show");
    }
  };


  /**
   * Add the message event listener
   **/
  module.close = function close () {
    if (document.body.contains(commandBar)) {
      commandBar.addEventListener("transitionend", () => {
        commandBar.classList.remove("cb-hide");
        commandBar.remove();
      }, {once: true});
      commandBar.classList.replace("cb-show", "cb-hide");
      // clear event handler array
      eventHandler.length = 0;
    }

    // reset temporary variables
    selectedCommand = null;
    scrollPosition = 0;

    // remove settings and add command list if not already done
  };


  /**
   * Add the message event listener
   **/
  module.onChoice = function onChoice (handler) {
    eventHandler.push(handler);
  }



  /**
   * Add the message event listener
   **/
  function buildCommandBar () {
    // build command container structure
    const commandsHead = document.createElement("div");
          commandsHead.classList.add("cb-head");
    const commandsHeading = document.createElement("h1");
          commandsHeading.classList.add("cb-heading");
          commandsHeading.textContent = "Command bar";
    commandsHead.append(commandsHeading);

    const commandsScrollContainer = document.createElement("div");
          commandsScrollContainer.classList.add("cb-scroll-container");
    commandsMain.append(commandsScrollContainer);

    // build command list
    const groups = new Map();

    for (let command of commandData) {
      const item = document.createElement("li");
            item.classList.add("cb-command-item");
            item.dataset.command = command.command;
            item.onclick = selectCommand;

      const itemContainer = document.createElement("div");
            itemContainer.classList.add("cb-command-container");
      const label = document.createElement("span");
            label.classList.add("cb-command-name");
            label.textContent = browser.i18n.getMessage(`commandName${command.command}`);
      const infoButton = document.createElement("button");
            infoButton.classList.add("cb-command-info-button");
            infoButton.textContent = "ⓘ";
            infoButton.dataset.command = command.command;
            infoButton.onmouseover = toggleCommandDescription;
            infoButton.onmouseout = toggleCommandDescription;
      itemContainer.append(label, infoButton);

      const description = document.createElement("div");
            description.classList.add("cb-command-description");
            description.textContent = browser.i18n.getMessage(`commandDescription${command.command}`);
      item.append(itemContainer, description, );

      if (groups.has(command.group)) {
        const list = groups.get(command.group);
        list.appendChild(item);
      }
      else {
        const list = document.createElement("ul");
              list.classList.add("cb-command-group");
        groups.set(command.group, list);
        list.appendChild(item);
        commandsScrollContainer.appendChild(list);
      }
    }

    // append command container
    commandsContainer.append(commandsHead, commandsMain);
    commandBar.append(commandsContainer);


    // build settings container structure
    const settingsHead = document.createElement("div");
          settingsHead.classList.add("cb-head");
    const backButton = document.createElement("button");
          backButton.classList.add("cb-back-button");
          backButton.textContent = "<";
          backButton.onclick = showCommands;
    settingsHead.append(backButton, settingsHeading);
    const submitButton = document.createElement("button");
          submitButton.classList.add("cb-submit-button");
          submitButton.textContent = "Submit";
          submitButton.onclick = submitSettings;
    const settingsFooter = document.createElement("div");
          settingsFooter.classList.add("cb-footer");
    settingsFooter.appendChild(submitButton);

    settingsContainer.append(settingsHead, settingsMain, settingsFooter);
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

    settingsContainer.addEventListener("transitionend", () => {
      settingsContainer.remove();
    }, { once: true });
    commandsContainer.addEventListener("transitionend", () => {
      commandsContainer.classList.remove("cb-init-slide", "cb-slide-middle");
    }, { once: true });

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

    commandsContainer.addEventListener("transitionend", () => {
      commandsContainer.remove();
    }, { once: true });
    settingsContainer.addEventListener("transitionend", () => {
      settingsContainer.classList.remove("cb-init-slide", "cb-slide-middle");
    }, { once: true });

    commandsContainer.classList.replace("cb-slide-middle", "cb-slide-left");
    settingsContainer.classList.replace("cb-slide-right",  "cb-slide-middle");
  }


  /**
   *
   **/
  function setSettings (command) {
    // remove exisiting children
    while (settingsMain.firstChild) settingsMain.firstChild.remove();

    settingsHeading.textContent = browser.i18n.getMessage(`commandName${command.command}`);
    // get the corresponding settings templates
    const templates = settingTemplates.querySelectorAll(`[data-commands~="${command.command}"]`);

    for (let template of templates) {
      const settingsContainer = document.createElement("div");
            settingsContainer.classList.add("cb-setting");

      const setting = template.content.cloneNode(true);

      // insert text from language files
      const i18nTextElements = setting.querySelectorAll('[data-i18n]');
      for (let element of i18nTextElements) {
        element.textContent = browser.i18n.getMessage(element.dataset.i18n);
      }

      // insert default settings
      const inputs = setting.querySelectorAll("[name]");

      for (let input of inputs) {
        const value = command.settings[input.name];
        if (input.type === "checkbox") input.checked = value;
        else input.value = value;
      }

      // append the current settings
      settingsContainer.appendChild(setting);
      settingsMain.appendChild(settingsContainer);
    }
  }


  /**
   * Add the message event listener
   **/
  function selectCommand (event) {
    // get command item
    const command = commandData.find((element) => {
      return element.command === event.currentTarget.dataset.command;
    });
    // if the command requires permissions
    if (command.permissions) {
      const permissionRequest = browser.permissions.request({
        permissions: command.permissions,
      });
      permissionRequest.then((granted) => {
        if (granted) proceed();
      });
    }
    else proceed();

    // helper function to proceed the command selection
    function proceed () {
      // if the command offers any settings show them
      if (command.settings) {


// vlt. irgendwie wieder in buildSettings und buildCommands aufteilen
        setSettings(command);
        // store a copy of the selected command
        selectedCommand = command;
        // store current scroll position
        scrollPosition = commandsMain.scrollTop;

        showSettings();
      }
      else submit({"command": command.command});
    }
  }


  /**
   * Add the message event listener
   **/
  function submitSettings () {

// check if all inputs are valid


// place all settings in a sperate template

    const data = {
      "command": selectedCommand.command,
      "settings": {}
    }

    for (let setting in selectedCommand.settings) {
      const input = settingsMain.querySelector(`.cb-setting [name="${setting}"]`);

      // get true or false for checkboxes
      if (input.type === "checkbox") data.settings[setting] = input.checked;
      // get value either as string or number
      else data.settings[setting] = isNaN(input.valueAsNumber) ? input.value : input.valueAsNumber;
    }

    submit(data);
  }


  function toggleCommandDescription (event) {
    const command = event.currentTarget.dataset.command;
    const description = commandsContainer.querySelector(`.cb-command-item[data-command="${command}"] .cb-command-description`);

    if (description.style.height) {
      description.style.height = null;
    }
    else {
      description.style.height = description.scrollHeight + "px";
    }
  }



  /**
   * Add the message event listener
   **/
  function submit (command) {
    eventHandler.forEach((callback) => callback(command));
  }


  return module;
})();
