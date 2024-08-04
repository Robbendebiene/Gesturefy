export default Object.freeze([
  {
    "command": "DuplicateTab",
    "settings": {
      "position": "default",
      "focus": true
    },
    "group": "tabs"
  },
  {
    "command": "NewTab",
    "settings": {
      "position": "default",
      "focus": true
    },
    "group": "tabs"
  },
  {
    "command": "ReloadTab",
    "settings": {
      "cache": false
    },
    "group": "load"
  },
  {
    "command": "ReloadFrame",
    "settings": {
      "cache": false
    },
    "group": "load"
  },
  {
    "command": "StopLoading",
    "group": "load"
  },
  {
    "command": "CloseTab",
    "settings": {
      "nextFocus": "default",
      "closePinned": true
    },
    "group": "tabs"
  },
  {
    "command": "CloseRightTabs",
    "group": "tabs"
  },
  {
    "command": "CloseLeftTabs",
    "group": "tabs"
  },
  {
    "command": "CloseOtherTabs",
    "group": "tabs"
  },
  {
    "command": "RestoreTab",
    "settings": {
      "currentWindowOnly": false
    },
    "permissions": ["sessions"],
    "group": "tabs"
  },
  {
    "command": "ZoomIn",
    "settings": {
      "step": ""
    },
    "group": "zoom"
  },
  {
    "command": "ZoomOut",
    "settings": {
      "step": ""
    },
    "group": "zoom"
  },
  {
    "command": "ZoomReset",
    "group": "zoom"
  },
  {
    "command": "PageBack",
    "group": "history"
  },
  {
    "command": "PageForth",
    "group": "history"
  },
  {
    "command": "TogglePin",
    "group": "toggle"
  },
  {
    "command": "ToggleMute",
    "group": "toggle"
  },
  {
    "command": "ToggleBookmark",
    "permissions": ["bookmarks"],
    "group": "toggle"
  },
  {
    "command": "ToggleReaderMode",
    "group": "toggle"
  },
  {
    "command": "ScrollTop",
    "settings": {
      "duration": 100
    },
    "group": "scroll"
  },
  {
    "command": "ScrollBottom",
    "settings": {
      "duration": 100
    },
    "group": "scroll"
  },
  {
    "command": "ScrollPageDown",
    "settings": {
      "duration": 100,
      "scrollProportion": 95
    },
    "group": "scroll"
  },
  {
    "command": "ScrollPageUp",
    "settings": {
      "duration": 100,
      "scrollProportion": 95
    },
    "group": "scroll"
  },
  {
    "command": "FocusRightTab",
    "settings": {
      "cycling": true,
      "excludeDiscarded": false
    },
    "group": "focus"
  },
  {
    "command": "FocusLeftTab",
    "settings": {
      "cycling": true,
      "excludeDiscarded": false
    },
    "group": "focus"
  },
  {
    "command": "FocusFirstTab",
    "settings": {
      "includePinned": false
    },
    "group": "focus"
  },
  {
    "command": "FocusLastTab",
    "group": "focus"
  },
  {
    "command": "FocusPreviousSelectedTab",
    "group": "focus"
  },
  {
    "command": "MaximizeWindow",
    "group": "window.controls"
  },
  {
    "command": "MinimizeWindow",
    "group": "window.controls"
  },
  {
    "command": "ToggleWindowSize",
    "group": "toggle"
  },
  {
    "command": "ToggleFullscreen",
    "group": "toggle"
  },
  {
    "command": "NewWindow",
    "group": "window"
  },
  {
    "command": "NewPrivateWindow",
    "group": "window"
  },
  {
    "command": "EnterFullscreen",
    "group": "window.controls"
  },
  {
    "command": "MoveTabToStart",
    "group": "move"
  },
  {
    "command": "MoveTabToEnd",
    "group": "move"
  },
  {
    "command": "MoveTabRight",
    "group": "move",
    "settings": {
      "shift": 1,
      "cycling": true
    }
  },
  {
    "command": "MoveTabLeft",
    "group": "move",
    "settings": {
      "shift": 1,  
      "cycling": true
    }
  },
  {
    "command": "MoveTabToNewWindow",
    "group": "move"
  },
  {
    "command": "MoveRightTabsToNewWindow",
    "settings": {
      "focus": true,
      "includeCurrent": false
    },
    "group": "move"
  },
  {
    "command": "MoveLeftTabsToNewWindow",
    "settings": {
      "focus": true,
      "includeCurrent": false
    },
    "group": "move"
  },
  {
    "command": "CloseWindow",
    "group": "window.controls"
  },
  {
    "command": "ReloadAllTabs",
    "settings": {
      "cache": false
    },
    "group": "load"
  },
  {
    "command": "ToRootURL",
    "group": "url"
  },
  {
    "command": "URLLevelUp",
    "group": "url"
  },
  {
    "command": "IncreaseURLNumber",
    "settings": {
      "regex": ""
    },
    "group": "url"
  },
  {
    "command": "DecreaseURLNumber",
    "settings": {
      "regex": ""
    },
    "group": "url"
  },
  {
    "command": "ViewImage",
    "group": "image"
  },
  {
    "command": "OpenImageInNewTab",
    "settings": {
      "position": "default",
      "focus": true
    },
    "group": "image"
  },
  {
    "command": "OpenLink",
    "group": "link"
  },
  {
    "command": "OpenLinkInNewTab",
    "settings": {
      "position": "default",
      "focus": false,
      "emptyTab": false
    },
    "group": "link"
  },
  {
    "command": "OpenLinkInNewWindow",
    "settings": {
      "emptyWindow": false
    },
    "group": "link"
  },
  {
    "command": "OpenLinkInNewPrivateWindow",
    "settings": {
      "emptyWindow": false
    },
    "group": "link"
  },
  {
    "command": "LinkToNewBookmark",
    "permissions": ["bookmarks"],
    "group": "link"
  },
  {
    "command": "SearchTextSelection",
    "settings": {
      "searchEngineURL": "",
      "openEmptySearch": true
    },
    "permissions": ["search"],
    "group": "selection"
  },
  {
    "command": "SearchTextSelectionInNewTab",
    "settings": {
      "position": "default",
      "focus": true,
      "searchEngineURL": "",
      "openEmptySearch": true
    },
    "permissions": ["search"],
    "group": "selection"
  },
  {
    "command": "SearchClipboard",
    "settings": {
      "searchEngineURL": "",
      "openEmptySearch": true
    },
    "permissions": ["search", "clipboardRead"],
    "group": "clipboard"
  },
  {
    "command": "SearchClipboardInNewTab",
    "settings": {
      "position": "default",
      "focus": true,
      "searchEngineURL": "",
      "openEmptySearch": true
    },
    "permissions": ["search", "clipboardRead"],
    "group": "clipboard"
  },
  {
    "command": "InsertCustomText",
    "settings": {
      "text": ""
    },
    "group": "input"
  },
  {
    "command": "OpenHomepage",
    "group": "open"
  },
  {
    "command": "OpenAddonSettings",
    "group": "open"
  },
  {
    "command": "OpenCustomURL",
    "settings": {
      "url": ""
    },
    "group": "open"
  },
  {
    "command": "OpenCustomURLInNewTab",
    "settings": {
      "url": "",
      "position": "default",
      "focus": true
    },
    "group": "open"
  },
  {
    "command": "OpenCustomURLInNewWindow",
    "settings": {
      "url": ""
    },
    "group": "open"
  },
  {
    "command": "OpenCustomURLInNewPrivateWindow",
    "settings": {
      "url": ""
    },
    "group": "open"
  },
  {
    "command": "SaveTabAsPDF",
    "group": "capture"
  },
  {
    "command": "SaveScreenshot",
    "permissions": ["downloads"],
    "group": "capture"
  },
  {
    "command": "PrintTab",
    "group": "capture"
  },
  {
    "command": "OpenPrintPreview",
    "group": "capture"
  },
  {
    "command": "CopyTabURL",
    "permissions": ["clipboardWrite"],
    "group": "url"
  },
  {
    "command": "CopyLinkURL",
    "permissions": ["clipboardWrite"],
    "group": "link"
  },
  {
    "command": "CopyImageURL",
    "permissions": ["clipboardWrite"],
    "group": "image"
  },
  {
    "command": "CopyTextSelection",
    "permissions": ["clipboardWrite"],
    "group": "selection"
  },
  {
    "command": "CopyImage",
    "permissions": ["clipboardWrite"],
    "group": "image"
  },
  {
    "command": "PasteClipboard",
    "permissions": ["clipboardRead"],
    "group": "clipboard"
  },
  {
    "command": "OpenURLFromClipboard",
    "group": "clipboard",
    "permissions": ["clipboardRead"]
  },
  {
    "command": "OpenURLFromClipboardInNewTab",
    "settings": {
      "position": "default",
      "focus": true
    },
    "group": "clipboard",
    "permissions": ["clipboardRead"]
  },
  {
    "command": "OpenURLFromClipboardInNewWindow",
    "settings": {
      "emptyWindow": false
    },
    "group": "clipboard",
    "permissions": ["clipboardRead"]
  },
  {
    "command": "OpenURLFromClipboardInNewPrivateWindow",
    "settings": {
      "emptyWindow": false
    },
    "group": "clipboard",
    "permissions": ["clipboardRead"]
  },
  {
    "command": "SaveImage",
    "settings": {
      "promptDialog": true
    },
    "permissions": ["downloads"],
    "group": "image"
  },
  {
    "command": "SaveLink",
    "settings": {
      "promptDialog": true
    },
    "permissions": ["downloads"],
    "group": "link"
  },
  {
    "command": "ViewPageSourceCode",
    "group": "open"
  },
  {
    "command": "PopupAllTabs",
    "settings": {
      "order": "none",
      "excludeDiscarded": false
    },
    "permissions": ["tabs"],
    "group": "popup"
  },
  {
    "command": "PopupRecentlyClosedTabs",
    "permissions": ["tabs", "sessions"],
    "group": "popup"
  },
  {
    "command": "PopupSearchEngines",
    "settings": {
      "position": "default"
    },
    "permissions": ["search"],
    "group": "popup"
  },
  {
    "command": "PopupCustomCommandList",
    "settings": {
      "commands": []
    },
    "group": "popup"
  },
  {
    "command": "RunMultiPurposeCommand",
    "settings": {
      "commands": []
    },
    "group": "advanced"
  },
  {
    "command": "SendMessageToOtherAddon",
    "settings": {
      "extensionId": "",
      "message": "",
      "parseJSON": false
    },
    "group": "advanced"
  },
  {
    "command": "ExecuteUserScript",
    "settings": {
      "userScript": "",
      "targetFrame": "sourceFrame"
    },
    "group": "advanced"
  },
  {
    "command": "ClearBrowsingData",
    "settings": {
      "cache": false,
      "cookies": false,
      "downloads": false,
      "formData": false,
      "history": false,
      "indexedDB": false,
      "localStorage": false,
      "passwords": false,
      "pluginData": false,
      "serviceWorkers": false
    },
    "permissions": ["browsingData"],
    "group": "advanced"
  }
]);
