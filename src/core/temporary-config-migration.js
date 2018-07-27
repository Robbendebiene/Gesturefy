// Config zugriffe möglicherwiese bevor der storage sie geladen hat

// openimageinnewtab; SearchTextSelection; default muss after sein (nicht default)

// changed .style to .Style in settings !!!!!

// what happens when ich change the addon id?
// what happens when i remove permissions on update?
function configMigrationHandler () {
  const fetchOldConfig = browser.storage.local.get(null);
  const fetchCommands = getJsonFileAsObject(browser.runtime.getURL("res/json/commands.json"));

  Promise.all([fetchOldConfig, fetchCommands]).then((values) => {
    const oldConfig = {"Actions": {
    "Bookmark": "",
    "Duplicate": "",
    "NewTab": "DU",
    "Reload": "LDR",
    "ReloadCache": "RDL",
    "StopLoading": "",
    "Remove": "RL",
    "RemoveRight": "",
    "RemoveLeft": "",
    "RemoveOther": "",
    "Restore": "LR",
    "ZoomIn": "",
    "ZoomOut": "",
    "ZoomReset": "",
    "Back": "L",
    "Forth": "R",
    "Pin": "",
    "Mute": "",
    "ScrollTop": "U",
    "ScrollBottom": "D",
    "ScrollPageUp": "",
    "ScrollPageDown": "",
    "Next": "DR",
    "Previous": "DL",
    "FirstTab": "",
    "LastTab": "",
    "PreviousSelectedTab": "",
    "Maximize": "",
    "Minimize": "",
    "ToggleWindowSize": "",
    "Fullscreen": "",
    "NewWindow": "",
    "NewPrivateWindow": "",
    "TabToWindow": "",
    "CloseWindow": "",
    "ReloadAll": "",
    "ReloadAllCaches": "",
    "URLLevelUp": "",
    "IncreaseURLNumber": "",
    "DecreaseURLNumber": "",
    "ImageToTab": "",
    "LinkToForegroundTab": "",
    "LinkToBackgroundTab": "",
    "LinkToBookmark": "",
    "LinkToWindow": "",
    "LinkToPrivateWindow": "",
    "SearchSelection": "",
    "OpenHomepage": "",
    "OpenAddonSettings": "",
    "OpenLink": "",
    "OpenImage": "",
    "SaveAsPDF": "",
    "Print": "",
    "PrintPreview": "",
    "SaveScreenshot": "",
    "SaveImage": "",
    "CopyTabURL": "",
    "CopyLinkURL": "",
    "CopyTextSelection": "",
    "CopyImage": "",
    "ViewPageSourceCode": "",
    "PopupAllTabs": "",
    "PopupRecentlyClosedTabs": ""
}};
    const commands = values[1];

    const ActionCommandMap = new Map ([
      [ "Duplicate",
        {
          "command": "DuplicateTab"
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
      [ "ImageToTab",
        {
          "command": "ImageToNewTab",
          "settings": {
            "focus": true
          }
        }
      ],
      [ "LinkToForegroundTab",
        {
          "command": "LinkToNewTab",
          "settings": {
            "focus": true,
            "emptyTab": false
          }
        }
      ],
      [ "LinkToBackgroundTab",
        {
          "command": "LinkToNewTab",
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
          "command": "LinkToNewWindow"
        }
      ],
      [ "LinkToPrivateWindow",
        {
          "command": "LinkToNewPrivateWindow"
        }
      ],
      [ "SearchSelection",
        {
          "command": "SearchTextSelection",
          "settings": {
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
      [ "OpenImage",
        {
          "command": "ViewImage"
        }
      ]
    ]);


    const ActionCommandSettingsMap = new Map ([
      [ "searchEngineURL", "searchEngineURL" ],
      [ "focusSearchResult", "focus" ],
      [ "scrollDuration", "duration" ],
      [ "scrollPageDuration", "duration" ],
      [ "newTabOnEmptyLink", "emptyTab" ],
      [ "focusImageToTab", "focus" ],
      [ "newTabPosition", "position" ],
      [ "removeTabFocus", "nextFocus" ],
      [ "firstTabIncludePinned", "includePinned" ],
      [ "removePinnedTabs", "closePinned" ],
      [ "zoomStep", "step" ],
      [ "promptSaveImageAs", "promptDialog" ]
    ]);

    const gestureArray = [];

    // migrate actions
    for (let actionKey in oldConfig.Actions) {
      const gesture = oldConfig.Actions[actionKey];
      // if action was in use
      if (gesture) {
        // get new command item if the action got renamed or removed
        let commandItem = ActionCommandMap.get(actionKey);
        // if action got renamed
        if (commandItem) {
          commandItem.gesture = gesture;
          gestureArray.push(commandItem);
        }
        else {
          // create gesture object with default settings and add it to the gesture list
          const commandItem = commands.find((element) => {
            return element.command === actionKey;
          });
          if (commandItem) gestureArray.push({
            "gesture": gesture,
            "command": commandItem.command,
            "settings": commandItem.settings
          });
        }
      }
    }

    // migrate action options
    for (let actionSettingsKey in oldConfig.Settings.Actions) {

      // find all elments of array

      const commandItem = gestureArray.find((element) => {
        return element.command === actionKey;
      });
    }

    // line grwoth nicht vergessen!
    //
    // some gesture/command names have changed again!
    //
    //
    // close tab values wurden geändert
  });
}




configMigrationHandler ();
