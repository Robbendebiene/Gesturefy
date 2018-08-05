
function configMigrationHandler () {

  const ActionCommandMap = new Map ([
    [ "Duplicate",
      {
        "command": "DuplicateTab"
      }
    ],
    [ "NewTab",
      {
        "command": "NewTab",
        "settings": {
          "position": "default",
          "focus": true
        }
      }
    ],
    [ "Reload",
      {
        "command": "ReloadTab",
        "settings": {
          "cache": false
        }
      },
    ],
    [ "ReloadCache",
      {
        "command": "ReloadTab",
        "settings": {
          "cache": true
        }
      }
    ],
    [ "StopLoading",
      {
        "command": "StopLoading"
      }
    ],
    [ "Remove",
      {
        "command": "CloseTab",
        "settings": {
          "nextFocus": "default",
          "closePinned": true
        }
      }
    ],
    [ "RemoveRight",
      {
        "command": "CloseRightTabs"
      }
    ],
    [ "RemoveLeft",
      {
        "command": "CloseLeftTabs"
      }
    ],
    [ "RemoveOther",
      {
        "command": "CloseOtherTabs"
      }
    ],
    [ "Restore",
      {
        "command": "RestoreTab",
        "settings": {
          "currentWindow": false
        }
      }
    ],
    [ "ZoomIn",
      {
        "command": "ZoomIn",
        "settings": {
          "step": ""
        }
      }
    ],
    [ "ZoomOut",
      {
        "command": "ZoomOut",
        "settings": {
          "step": ""
        }
      }
    ],
    [ "ZoomReset",
      {
        "command": "ZoomOut"
      }
    ],
    [ "ScrollTop",
      {
        "command": "ScrollTop",
        "settings": {
          "duration": 100
        }
      }
    ],
    [ "ScrollBottom",
      {
        "command": "ScrollBottom",
        "settings": {
          "duration": 100
        }
      }
    ],
    [ "ScrollPageUp",
      {
        "command": "ScrollPageUp",
        "settings": {
          "duration": 100
        }
      }
    ],
    [ "ScrollPageDown",
      {
        "command": "ScrollPageDown",
        "settings": {
          "duration": 100
        }
      }
    ],
    [ "Back",
      {
        "command": "PageBack"
      }
    ],
    [ "Forth",
      {
        "command": "PageForth"
      }
    ],
    [ "Pin",
      {
        "command": "TogglePin"
      }
    ],
    [ "Mute",
      {
        "command": "ToggleMute"
      }
    ],
    [ "Bookmark",
      {
        "command": "ToggleBookmark"
      }
    ],
    [ "Next",
      {
        "command": "FocusRightTab"
      }
    ],
    [ "Previous",
      {
        "command": "FocusLeftTab"
      }
    ],
    [ "FirstTab",
      {
        "command": "FocusFirstTab",
        "settings": {
          "includePinned": false
        }
      }
    ],
    [ "LastTab",
      {
        "command": "FocusLastTab"
      }
    ],
    [ "PreviousSelectedTab",
      {
        "command": "FocusPreviousSelectedTab"
      }
    ],
    [ "Maximize",
      {
        "command": "MaximizeWindow"
      }
    ],
    [ "Minimize",
      {
        "command": "MinimizeWindow"
      }
    ],
    [ "ToggleWindowSize",
      {
        "command": "ToggleWindowSize"
      }
    ],
    [ "Fullscreen",
      {
        "command": "ToggleFullscreen"
      }
    ],
    [ "ReloadAll",
      {
        "command": "ReloadAllTabs",
        "settings": {
          "cache": false
        },
      }
    ],
    [ "ReloadAllCaches",
      {
        "command": "ReloadAllTabs",
        "settings": {
          "cache": true
        },
      }
    ],
    [ "URLLevelUp",
      {
        "command": "URLLevelUp"
      }
    ],
    [ "IncreaseURLNumber",
      {
        "command": "IncreaseURLNumber"
      }
    ],
    [ "DecreaseURLNumber",
      {
        "command": "DecreaseURLNumber"
      }
    ],
    [ "OpenHomepage",
      {
        "command": "OpenHomepage"
      }
    ],
    [ "OpenAddonSettings",
      {
        "command": "OpenAddonSettings"
      }
    ],
    [ "OpenLink",
      {
        "command": "OpenLink"
      }
    ],
    [ "SaveScreenshot",
      {
        "command": "SaveScreenshot"
      }
    ],
    [ "SaveImage",
      {
        "command": "SaveImage",
        "settings": {
          "promptDialog": true
        },
      }
    ],
    [ "ImageToTab",
      {
        "command": "OpenImageInNewTab",
        "settings": {
          "position": "default",
          "focus": true
        }
      }
    ],
    [ "LinkToForegroundTab",
      {
        "command": "OpenLinkInNewTab",
        "settings": {
          "focus": true,
          "emptyTab": false
        }
      }
    ],
    [ "LinkToBackgroundTab",
      {
        "command": "OpenLinkInNewTab",
        "settings": {
          "focus": false,
          "emptyTab": false
        }
      }
    ],
    [ "LinkToBookmark",
      {
        "command": "LinkToNewBookmark"
      }
    ],
    [ "LinkToWindow",
      {
        "command": "OpenLinkInNewWindow"
      }
    ],
    [ "NewWindow",
      {
        "command": "NewWindow"
      }
    ],
    [ "NewPrivateWindow",
      {
        "command": "NewPrivateWindow"
      }
    ],
    [ "LinkToPrivateWindow",
      {
        "command": "OpenLinkInNewPrivateWindow"
      }
    ],
    [ "SearchSelection",
      {
        "command": "SearchTextSelection",
        "settings": {
          "position": "default",
          "focus": true,
          "searchEngineURL": "https://www.google.com/search?q="
        }
      }
    ],
    [ "SaveAsPDF",
      {
        "command": "SaveTabAsPDF"
      }
    ],
    [ "Print",
      {
        "command": "PrintTab"
      }
    ],
    [ "PrintPreview",
      {
        "command": "OpenPrintPreview"
      }
    ],
    [ "TabToWindow",
      {
        "command": "TabToNewWindow"
      }
    ],
    [ "CloseWindow",
      {
        "command": "CloseWindow"
      }
    ],
    [ "OpenImage",
      {
        "command": "ViewImage"
      }
    ],
    [ "CopyTabURL",
      {
        "command": "CopyTabURL"
      }
    ],
    [ "CopyLinkURL",
      {
        "command": "CopyLinkURL"
      }
    ],
    [ "CopyTextSelection",
      {
        "command": "CopyTextSelection"
      }
    ],
    [ "CopyImage",
      {
        "command": "CopyImage"
      }
    ],
    [ "ViewPageSourceCode",
      {
        "command": "ViewPageSourceCode"
      }
    ],
    [ "PopupAllTabs",
      {
        "command": "PopupAllTabs"
      }
    ],
    [ "PopupRecentlyClosedTabs",
      {
        "command": "PopupRecentlyClosedTabs"
      }
    ]
  ]);

  const ActionCommandSettingsMap = new Map ([
    [ "searchEngineURL", {
        "name": "searchEngineURL",
        "commands": ["SearchTextSelection"]
      }
    ],
    [ "focusSearchResult", {
        "name": "focus",
        "commands": ["SearchTextSelection"]
      }
    ],
    [ "scrollDuration", {
        "name": "duration",
        "commands": ["ScrollTop", "ScrollBottom"]
      }
    ],
    [ "scrollPageDuration", {
        "name": "duration",
        "commands": ["ScrollPageDown", "ScrollPageUp"]
      }
    ],
    [ "newTabOnEmptyLink", {
        "name": "emptyTab",
        "commands": ["OpenLinkInNewTab"]
      }
    ],
    [ "focusImageToTab", {
        "name": "focus",
        "commands": ["OpenImageInNewTab"]
      }
    ],
    [ "newTabPosition", {
        "name": "position",
        "commands": ["NewTab"]
      }
    ],
    [ "removeTabFocus", {
        "name": "nextFocus",
        "commands": ["CloseTab"]
      }
    ],
    [ "firstTabIncludePinned", {
        "name": "includePinned",
        "commands": ["FocusFirstTab"]
      }
    ],
    [ "removePinnedTabs", {
        "name": "closePinned",
        "commands": ["CloseTab"]
      }
    ],
    [ "zoomStep", {
        "name": "step",
        "commands": ["ZoomIn", "ZoomOut"]
      }
    ],
    [ "promptSaveImageAs", {
        "name": "promptDialog",
        "commands": ["SaveImage"]
      }
    ]
  ]);

  const fetchOldConfig = browser.storage.local.get();
  const fetchCommands = getJsonFileAsObject(browser.runtime.getURL("res/json/commands.json"));
  const fetchDefaultConfig = getJsonFileAsObject(browser.runtime.getURL("res/json/defaults.json"));

  Promise.all([fetchOldConfig, fetchCommands, fetchDefaultConfig]).then((values) => {
    const oldConfig = values[0];
    const Commands = values[1];
    const defaultConfig = values[2];

    const gestureArray = [];
    const nonMigratableGestureArray = [];
    const additionalPermissions = [];

    // migrate actions to gestures
    for (let actionKey in oldConfig.Actions) {
      const gesture = oldConfig.Actions[actionKey];
      // if action is in use
      if (gesture) {
        // get new command item
        const commandItem = ActionCommandMap.get(actionKey);
        if (commandItem) {
          commandItem.gesture = gesture;
          // check if gesture requires additional permissions
          const command = Commands.find((element) => {
            return element.command === commandItem.command;
          });
          // if requires no permissions
          if (!command.permissions) {
            gestureArray.push(commandItem);
          }
          else {
            command.permissions.forEach((ele) => {
              if (!additionalPermissions.includes(ele)) additionalPermissions.push(ele);
            });
            nonMigratableGestureArray.push(commandItem);
          }
        }
      }
    }

    // migrate action options
    for (let actionSettingsKey in oldConfig.Settings.Actions) {
      const commandSettingMapping = ActionCommandSettingsMap.get(actionSettingsKey);
      // go through all gestures and apply setting if it matches
      if (commandSettingMapping) {
        gestureArray.forEach((gestureObject) => {
          if (commandSettingMapping.commands.includes(gestureObject.command)) {
            if (!gestureObject.settings) gestureObject.settings = {};
            // assign setting
            gestureObject.settings[commandSettingMapping.name] = oldConfig.Settings.Actions[actionSettingsKey];
          }
        });
        nonMigratableGestureArray.forEach((gestureObject) => {
          if (commandSettingMapping.commands.includes(gestureObject.command)) {
            if (!gestureObject.settings) gestureObject.settings = {};
            // assign setting
            gestureObject.settings[commandSettingMapping.name] = oldConfig.Settings.Actions[actionSettingsKey];
          }
        });
      }
    }
    // overwrite gestures
    defaultConfig.Gestures = gestureArray;

    // migrate addon settings
    defaultConfig.Settings.Gesture.mouseButton = oldConfig.Settings.Gesture.mouseButton;
    defaultConfig.Settings.Gesture.suppressionKey = oldConfig.Settings.Gesture.suppressionKey;
    defaultConfig.Settings.Gesture.distanceThreshold = oldConfig.Settings.Gesture.distanceThreshold;
    defaultConfig.Settings.Gesture.distanceSensitivity = oldConfig.Settings.Gesture.distanceSensitivity;

    defaultConfig.Settings.Gesture.Timeout.active = oldConfig.Settings.Gesture.Timeout.active;
    defaultConfig.Settings.Gesture.Timeout.duration = oldConfig.Settings.Gesture.Timeout.duration;

    defaultConfig.Settings.Gesture.Trace.display = oldConfig.Settings.Gesture.Trace.display;
    defaultConfig.Settings.Gesture.Trace.Style.opacity = oldConfig.Settings.Gesture.Trace.style.opacity;
    defaultConfig.Settings.Gesture.Trace.Style.strokeStyle = oldConfig.Settings.Gesture.Trace.style.strokeStyle;
    defaultConfig.Settings.Gesture.Trace.Style.lineWidth = oldConfig.Settings.Gesture.Trace.style.lineWidth;
    defaultConfig.Settings.Gesture.Trace.Style.lineGrowth = oldConfig.Settings.Gesture.Trace.style.lineGrowth < oldConfig.Settings.Gesture.Trace.style.lineWidth ? true : false;

    defaultConfig.Settings.Gesture.Directions.display = oldConfig.Settings.Gesture.Directions.display;
    defaultConfig.Settings.Gesture.Directions.Style.color = oldConfig.Settings.Gesture.Directions.style.color;
    defaultConfig.Settings.Gesture.Directions.Style.backgroundColor = oldConfig.Settings.Gesture.Directions.style.backgroundColor;
    defaultConfig.Settings.Gesture.Directions.Style.backgroundOpacity = oldConfig.Settings.Gesture.Directions.style.backgroundOpacity;
    defaultConfig.Settings.Gesture.Directions.Style.fontSize = oldConfig.Settings.Gesture.Directions.style.fontSize;
    defaultConfig.Settings.Gesture.Directions.Style.textAlign = oldConfig.Settings.Gesture.Directions.style.textAlign;

    defaultConfig.Settings.Gesture.Command.display = oldConfig.Settings.Gesture.Action.display;
    defaultConfig.Settings.Gesture.Command.Style.color = oldConfig.Settings.Gesture.Action.style.color;
    defaultConfig.Settings.Gesture.Command.Style.backgroundColor = oldConfig.Settings.Gesture.Action.style.backgroundColor;
    defaultConfig.Settings.Gesture.Command.Style.backgroundOpacity = oldConfig.Settings.Gesture.Action.style.backgroundOpacity;
    defaultConfig.Settings.Gesture.Command.Style.fontSize = oldConfig.Settings.Gesture.Action.style.fontSize;

    defaultConfig.Settings.Rocker.active = oldConfig.Settings.Rocker.active;

    defaultConfig.Settings.Wheel.active = oldConfig.Settings.Wheel.active;
    defaultConfig.Settings.Wheel.mouseButton = oldConfig.Settings.Wheel.mouseButton;

    defaultConfig.Settings.General.updateNotification = oldConfig.Settings.General.updateNotification;


    // store new config and non non migratable gestures
    Config = defaultConfig;
    browser.storage.local.clear().then(() => {
      browser.storage.sync.set(defaultConfig).then(() => {

        browser.storage.local.set({"requiredPermissions": additionalPermissions,"oldGestures": nonMigratableGestureArray}).then(() => {
          browser.tabs.create({
            url: browser.runtime.getURL('/core/temporary-upgrade.html'),
            active: true
          });
        });

      });
    });

  });
}
