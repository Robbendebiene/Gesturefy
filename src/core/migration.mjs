browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "update" && details.previousVersion) {
    if (isPreviousVersion(details.previousVersion, "4.0.0")) {
      const oldConfig = await browser.storage.local.get();
      const migratedConfig = structuredClone(oldConfig ?? {});
      // gestures are now shown in the UI in the order they are defined
      // so we need to reverse the order of the migrated gestures
      migratedConfig.Gestures = oldConfig.Gestures?.map(migrateGestureFromV3ToV4).reverse();

      if (migratedConfig?.Settings?.Rocker?.leftMouseClick) {
        migratedConfig.Settings.Rocker.leftMouseClick = migrateCommandFromV3ToV4(
          oldConfig.Settings.Rocker.leftMouseClick,
        );
      }
      if (migratedConfig?.Settings?.Rocker?.rightMouseClick) {
        migratedConfig.Settings.Rocker.rightMouseClick = migrateCommandFromV3ToV4(
          oldConfig.Settings.Rocker.rightMouseClick,
        );
      }
      if (migratedConfig?.Settings?.Wheel?.wheelUp) {
        migratedConfig.Settings.Wheel.wheelUp = migrateCommandFromV3ToV4(
          oldConfig.Settings.Wheel.wheelUp,
        );
      }
      if (migratedConfig?.Settings?.Wheel?.wheelDown) {
        migratedConfig.Settings.Wheel.wheelDown = migrateCommandFromV3ToV4(
          oldConfig.Settings.Wheel.wheelDown,
        );
      }

      await browser.storage.local.set(migratedConfig);
    }
  }
});

/**
 * Checks whether v1 is a previous version of v2
 * Requires a version in the format of x.x.x
 **/
export function isPreviousVersion (v1, v2) {
  // convert version strings to array
  v1 = v1.split(".").map(Number);
  v2 = v2.split(".").map(Number);

  for (let i = 0; i < v1.length; i++) {
    if (v1[i] < v2[i]) return true;
    if (v1[i] > v2[i]) return false;
  }
  return false;
}

function migrateGestureFromV3ToV4(gesture) {
  const newGesture = {
    "pattern": gesture.pattern,
    "commands": migrateCommandFromV3ToV4(gesture.command)
  };
  if (gesture.label) {
    switch (gesture.command.name) {
      case "ExecuteUserScript":
      case "PopupCustomCommandList":
      case "SendMessageToOtherAddon":
      case "ClearBrowsingData":
      case "InsertCustomText":
      case "OpenCustomURL":
      case "OpenCustomURLInNewTab":
      case "OpenCustomURLInNewWindow":
      case "OpenCustomURLInNewPrivateWindow":
        newGesture.commands[0].settings.alias = gesture.label;
        break;
    }
  }
  return newGesture;
}

function migrateCommandFromV3ToV4(command) {
  switch (command.name) {
    // removed setting "tab cycling" for FocusRightTab, FocusLeftTab, MoveTabRight, MoveTabLeft
    case "FocusRightTab": {
      renameCommandSettingsFromV3ToV4(command, {
        excludeDiscarded: "excludeDiscardedTabs",
      });
      if (command.settings?.cycling) {
        delete command.settings?.cycling;
        return [
          command,
          {
            "name": "FocusFirstTab",
            "includePinnedTabs": true
          }
        ];
      }
      break;
    }
    case "FocusLeftTab": {
      renameCommandSettingsFromV3ToV4(command, {
        excludeDiscarded: "excludeDiscardedTabs",
      });
      if (command.settings?.cycling) {
        delete command.settings?.cycling;
        return [
          command,
          {
            "name": "FocusLastTab",
          }
        ];
      }
      break;
    }
    case "MoveTabRight": {
      renameCommandSettingsFromV3ToV4(command, {
        shift: "tabShift",
      });
      if (command.settings?.cycling) {
        delete command.settings?.cycling;
        return [
          command,
          {
            "name": "MoveTabToStart",
          }
        ];
      }
      break;
    }
    case "MoveTabLeft": {
      renameCommandSettingsFromV3ToV4(command, {
        shift: "tabShift",
      });
      if (command.settings?.cycling) {
        delete command.settings?.cycling;
        return [
          command,
          {
            "name": "MoveTabToEnd",
          }
        ];
      }
      break;
    }

    // removed command "NewPrivateWindow" in favour of a new "incognito" setting
    case "NewPrivateWindow":
      return [
        {
          "name": "NewWindow",
          "settings": {
            "incognitoWindow": true,
          },
        }
      ];

    // Migrate old OpenLink to new OpenLink
    case "OpenLink":
      return [
        {
          "name": "OpenLink",
          "settings": {
            "openTarget": "currentTab",
          },
        }
      ];
    // removed setting "emptyTab" for OpenLinkInNewTab
    // removed command "OpenLinkInNewTab" in favour of a new "target" setting
    case "OpenLinkInNewTab": {
      const newSettings = {
        "tabPosition": command.settings?.position ?? "default",
        "focusTab": command.settings?.focus ?? true,
      };
      const newCommand = {
        "name": "OpenLink",
        "settings": {
          ...newSettings,
          "openTarget": "newTab",
        },
      }
      if (command.settings?.emptyTab) {
        return [
          newCommand,
          {
            "name": "NewTab",
            "settings": {
              ...newSettings,
            }
          }
        ];
      }
      return [ newCommand ];
    }
    // removed setting "emptyWindow" for OpenLinkInNewWindow
    // removed command "OpenLinkInNewWindow" in favour of a new "target" setting
    case "OpenLinkInNewWindow": {
      const newCommand = {
        "name": "OpenLink",
        "settings": {
          "openTarget": "newWindow",
          "incognitoWindow": false,
        },
      }
      if (command.settings?.emptyWindow) {
        return [
          newCommand,
          {
            "name": "NewWindow",
            "settings": {
              "incognitoWindow": false,
            },
          }
        ];
      }
      return [ newCommand ];
    }
    // removed setting "emptyWindow" for OpenLinkInNewPrivateWindow
    // removed command "OpenLinkInNewPrivateWindow" in favour of a new "incognito" setting
    case "OpenLinkInNewPrivateWindow": {
      const newCommand = {
        "name": "OpenLink",
        "settings": {
          "openTarget": "newWindow",
          "incognitoWindow": true,
        },
      }
      if (command.settings?.emptyWindow) {
        return [
          newCommand,
          {
            "name": "NewWindow",
            "settings": {
              "incognitoWindow": true,
            },
          }
        ];
      }
      return [ newCommand ];
    }

    // Migrate old ViewImage to new OpenImage
    case "ViewImage":
      return [
        {
          "name": "OpenImage",
          "settings": {
            ...command.settings,
            "openTarget": "currentTab",
          },
        }
      ];
    // removed command "OpenImageInNewTab" in favour of a new "target" setting
    case "OpenImageInNewTab":
      return [
        {
          "name": "OpenImage",
          "settings": {
            "tabPosition": command.settings?.position ?? "default",
            "focusTab": command.settings?.focus ?? true,
            "openTarget": "newTab",
          },
        }
      ];

    // Migrate old SearchTextSelection to new SearchTextSelection
    // removed setting "openEmptySearch" and "searchEngineURL" for SearchTextSelection
    case "SearchTextSelection": {
      const newCommand = {
        "name": "SearchTextSelection",
        "settings": {
          "searchEngine": '',
          "openTarget": "currentTab",
        },
      }
      if (command.settings?.openEmptySearch) {
        return [
          newCommand,
          {
            "name": "OpenSearch",
            "settings": {
              "searchEngine": '',
              "openTarget": "currentTab",
            },
          }
        ];
      }
      return [ newCommand ];
    }

    // removed command "SearchTextSelectionInNewTab" in favour of a new "target" setting
    // removed setting "openEmptySearch" and "searchEngineURL" for SearchTextSelectionInNewTab
    case "SearchTextSelectionInNewTab": {
      const newCommand = {
        "name": "SearchTextSelection",
        "settings": {
          "tabPosition": command.settings?.position ?? "default",
          "focusTab": command.settings?.focus ?? true,
          "searchEngine": '',
          "openTarget": "newTab",
        },
      }
      if (command.settings?.openEmptySearch) {
        return [
          newCommand,
          {
            "name": "OpenSearch",
            "settings": {
              "tabPosition": command.settings?.position ?? "default",
              "focusTab": command.settings?.focus ?? true,
              "searchEngine": '',
              "openTarget": "newTab",
            },
          }
        ];
      }
      return [ newCommand ];
    }

    // Migrate old SearchClipboard to new SearchClipboard
    // removed setting "openEmptySearch" and "searchEngineURL" for SearchClipboard
    case "SearchClipboard": {
      const newCommand = {
        "name": "SearchClipboard",
        "settings": {
          "searchEngine": '',
          "openTarget": "currentTab",
        },
      }
      if (command.settings?.openEmptySearch) {
        return [
          newCommand,
          {
            "name": "OpenSearch",
            "settings": {
              "searchEngine": '',
              "openTarget": "currentTab",
            },
          }
        ];
      }
      return [ newCommand ];
    }
    // removed command "SearchClipboardInNewTab" in favour of a new "target" setting
    // removed setting "openEmptySearch" and "searchEngineURL" for SearchClipboardInNewTab
    case "SearchClipboardInNewTab": {
      const newCommand = {
        "name": "SearchClipboard",
        "settings": {
          "tabPosition": command.settings?.position ?? "default",
          "focusTab": command.settings?.focus ?? true,
          "searchEngine": '',
          "openTarget": "newTab",
        },
      }
      if (command.settings?.openEmptySearch) {
        return [
          newCommand,
          {
            "name": "OpenSearch",
            "settings": {
              "tabPosition": command.settings?.position ?? "default",
              "focusTab": command.settings?.focus ?? true,
              "searchEngine": '',
              "openTarget": "newTab",
            },
          }
        ];
      }
      return [ newCommand ];
    }

    // Migrate old OpenURLFromClipboard to new OpenURLFromClipboard
    case "OpenURLFromClipboard":
      return [
        {
          "name": "OpenURLFromClipboard",
          "settings": {
            "openTarget": "currentTab",
          },
        }
      ];
    // removed command "OpenURLFromClipboardInNewTab" in favour of a new "target" setting
    case "OpenURLFromClipboardInNewTab":
      return [
        {
          "name": "OpenURLFromClipboard",
          "settings": {
            "tabPosition": command.settings?.position ?? "default",
            "focusTab": command.settings?.focus ?? true,
            "openTarget": "newTab",
          },
        }
      ];
    // removed command "OpenURLFromClipboardInNewWindow" in favour of a new "target" setting
    // removed setting "emptyWindow" for OpenURLFromClipboardInNewWindow
    case "OpenURLFromClipboardInNewWindow": {
      const newCommand = {
        "name": "OpenURLFromClipboard",
        "settings": {
          "openTarget": "newWindow",
          "incognitoWindow": false,
        },
      }
      if (command.settings?.emptyWindow) {
        return [
          newCommand,
          {
            "name": "NewWindow",
            "settings": {
              "incognitoWindow": false,
            },
          }
        ];
      }
      return [ newCommand ];
    }
    // removed command "OpenURLFromClipboardInNewPrivateWindow" in favour of a new "incognito" setting
    // removed setting "emptyWindow" for OpenURLFromClipboardInNewPrivateWindow
    case "OpenURLFromClipboardInNewPrivateWindow": {
      const newCommand = {
        "name": "OpenURLFromClipboard",
        "settings": {
          "openTarget": "newWindow",
          "incognitoWindow": true,
        },
      }
      if (command.settings?.emptyWindow) {
        return [
          newCommand,
          {
            "name": "NewWindow",
            "settings": {
              "incognitoWindow": true,
            },
          }
        ];
      }
      return [ newCommand ];
    }

    // Migrate old OpenCustomURL to new OpenCustomURL
    case "OpenCustomURL":
      return [
        {
          "name": "OpenCustomURL",
          "settings": {
            ...command.settings,
            "openTarget": "currentTab",
          },
        }
      ];
    // removed command "OpenCustomURLInNewTab" in favour of a new "target" setting
    case "OpenCustomURLInNewTab": {
      const { position, focus, ...settings } = command.settings;
      return [
        {
          "name": "OpenCustomURL",
          "settings": {
            ...settings,
            "tabPosition": position ?? "default",
            "focusTab": focus ?? true,
            "openTarget": "newTab",
          },
        }
      ];
    }
    // removed command "OpenCustomURLInNewWindow" in favour of a new "target" setting
    case "OpenCustomURLInNewWindow":
      return [
        {
          "name": "OpenCustomURL",
          "settings": {
            ...command.settings,
            "openTarget": "newWindow",
            "incognitoWindow": false,
          },
        }
      ];
    // removed command "OpenCustomURLInNewPrivateWindow" in favour of a new "target" setting
    // removed command "OpenCustomURLInNewPrivateWindow" in favour of a new "incognito" setting
    case "OpenCustomURLInNewPrivateWindow":
      return [
        {
          "name": "OpenCustomURLInNewWindow",
          "settings": {
            ...command.settings,
            "openTarget": "newWindow",
            "incognitoWindow": true,
          },
        }
      ];

    // split toggle commands into separate commands
    case "ToggleFullscreen":
      return [
        {
          "name": "EnterFullscreen",
        },
        {
          "name": "MaximizeWindow",
        }
      ];
    case "TogglePin":
      return [
        {
          "name": "PinTab",
        },
        {
          "name": "UnpinTab",
        }
      ];
    case "ToggleMute":
      return [
        {
          "name": "MuteTab",
        },
        {
          "name": "UnmuteTab",
        }
      ];
    case "ToggleBookmark":
      return [
        {
          "name": "AddPageBookmark",
        },
        {
          "name": "RemovePageBookmark",
        }
      ];
    case "ToggleReaderMode":
      return [
        {
          "name": "EnterReaderMode",
        }
      ];

    // Migrate old MultiPurposeCommand to command stack
    case "MultiPurposeCommand":
      return command.settings?.commands.flatMap(migrateCommandFromV3ToV4);

    // Commands that only need renamed settings
    case "SaveImage":
    case "SaveLink": {
      renameCommandSettingsFromV3ToV4(command, {
        promptDialog: "promptSaveAsDialog",
      });
      break;
    }
    case "MoveLeftTabsToNewWindow":
    case "MoveRightTabsToNewWindow": {
      renameCommandSettingsFromV3ToV4(command, {
        focus: "focusWindow",
        includeCurrent: "includeCurrentTab",
      });
      break;
    }
    case "NewTab":
    case "DuplicateTab": {
      renameCommandSettingsFromV3ToV4(command, {
        position: "tabPosition",
        focus: "focusTab",
      });
      break;
    }
    case "PopupSearchEngines": {
      renameCommandSettingsFromV3ToV4(command, {
        position: "tabPosition",
      });
      break;
    }
    case "NewWindow": {
      renameCommandSettingsFromV3ToV4(command, {
        incognito: "incognitoWindow",
      });
      break;
    }
    case "CloseTab": {
      renameCommandSettingsFromV3ToV4(command, {
        nextFocus: "tabSuccessor",
        closePinned: "closePinnedTabs",
      });
      break;
    }
    case "UnloadTab": {
      renameCommandSettingsFromV3ToV4(command, {
        nextFocus: "tabSuccessor",
      });
      break;
    }
    case "RestoreTab": {
      renameCommandSettingsFromV3ToV4(command, {
        currentWindowOnly: "onlyCurrentWindow",
      });
      break;
    }
    case "ReloadTab":
    case "ReloadFrame":
    case "ReloadAllTabs": {
      renameCommandSettingsFromV3ToV4(command, {
        cache: "reloadCache",
      });
      break;
    }
    case "ZoomIn":
    case "ZoomOut": {
      renameCommandSettingsFromV3ToV4(command, {
        step: "zoomStep",
      });
      break;
    }
    case "ScrollTop":
    case "ScrollBottom":
    case "ScrollPageDown":
    case "ScrollPageUp": {
      renameCommandSettingsFromV3ToV4(command, {
        duration: "scrollDuration",
      });
      break;
    }
    case "FocusFirstTab": {
      renameCommandSettingsFromV3ToV4(command, {
        includePinned: "includePinnedTabs",
      });
      break;
    }
    case "SendMessageToOtherAddon": {
      renameCommandSettingsFromV3ToV4(command, {
        message: "extensionMessage",
        parseJSON: "extensionMessageAsJSON",
      });
      break;
    }
    case "PopupAllTabs": {
      renameCommandSettingsFromV3ToV4(command, {
        order: "tabsOrder",
        excludeDiscarded: "excludeDiscardedTabs",
      });
      break;
    }
    case "ExecuteUserScript": {
      renameCommandSettingsFromV3ToV4(command, {
        targetFrame: "userScriptTarget",
      });
      break;
    }
    case "IncreaseURLNumber":
    case "DecreaseURLNumber": {
      renameCommandSettingsFromV3ToV4(command, {
        regex: "matchPattern",
      });
      break;
    }
    case "ClearBrowsingData": {
      renameCommandSettingsFromV3ToV4(command, {
        cache: "clearCache",
        cookies: "clearCookies",
        downloads: "clearDownloads",
        formData: "clearFormData",
        history: "clearHistory",
        indexedDB: "clearIndexedDB",
        localStorage: "clearLocalStorage",
        passwords: "clearPasswords",
        pluginData: "clearPluginData",
        serviceWorkers: "clearServiceWorkers",
      });
      break;
    }
    // migrate the nested commands with the same function
    case "PopupCustomCommandList":
      command.settings = {
        ...command.settings,
        "commands": command.settings?.commands.flatMap(migrateCommandFromV3ToV4) ?? []
      }
      break;
  }

  // turn all other commands to a single element command stack
  return [ command ];
}

/**
 * Renames the settings of a command in place.
 * Settings that are not listed in "renames" keep their name.
 */
function renameCommandSettingsFromV3ToV4(command, renames) {
  command.settings = Object.fromEntries(
    Object.entries(command.settings).map(([ key, value ]) => [ renames[key] ?? key, value ])
  );
}
