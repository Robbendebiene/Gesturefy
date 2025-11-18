import * as Command from "/core/models/commands.mjs"

export default [
  [
    new Command.DuplicateTab(),
    new Command.NewTab(),
    new Command.CloseTab(),
    new Command.CloseRightTabs(),
    new Command.CloseLeftTabs(),
    new Command.CloseOtherTabs(),
    new Command.RestoreTab()
  ],
  [
    new Command.ReloadTab(),
    new Command.ReloadFrame(),
    new Command.StopLoading(),
    new Command.ReloadAllTabs()
  ],
  [
    new Command.ZoomIn(),
    new Command.ZoomOut(),
    new Command.ZoomReset()
  ],
  [
    new Command.PageBack(),
    new Command.PageForth()
  ],
  [
    new Command.TogglePin(),
    new Command.ToggleMute(),
    new Command.ToggleBookmark(),
    new Command.ToggleReaderMode(),
    new Command.ToggleWindowSize(),
    new Command.ToggleFullscreen()
  ],
  [
    new Command.ScrollTop(),
    new Command.ScrollBottom(),
    new Command.ScrollPageDown(),
    new Command.ScrollPageUp()
  ],
  [
    new Command.FocusRightTab(),
    new Command.FocusLeftTab(),
    new Command.FocusFirstTab(),
    new Command.FocusLastTab(),
    new Command.FocusPreviousSelectedTab()
  ],
  [
    new Command.MaximizeWindow(),
    new Command.MinimizeWindow(),
    new Command.EnterFullscreen(),
    new Command.CloseWindow()
  ],
  [
    new Command.NewWindow(),
    new Command.NewPrivateWindow()
  ],
  [
    new Command.MoveTabToStart(),
    new Command.MoveTabToEnd(),
    new Command.MoveTabRight(),
    new Command.MoveTabLeft(),
    new Command.MoveTabToNewWindow(),
    new Command.MoveRightTabsToNewWindow(),
    new Command.MoveLeftTabsToNewWindow()
  ],
  [
    new Command.ToRootURL(),
    new Command.URLLevelUp(),
    new Command.IncreaseURLNumber(),
    new Command.DecreaseURLNumber(),
    new Command.CopyTabURL()
  ],
  [
    new Command.ViewImage(),
    new Command.OpenImageInNewTab(),
    new Command.CopyImageURL(),
    new Command.CopyImage(),
    new Command.SaveImage()
  ],
  [
    new Command.OpenLink(),
    new Command.OpenLinkInNewTab(),
    new Command.OpenLinkInNewWindow(),
    new Command.OpenLinkInNewPrivateWindow(),
    new Command.LinkToNewBookmark(),
    new Command.CopyLinkURL(),
    new Command.SaveLink()
  ],
  [
    new Command.SearchTextSelection(),
    new Command.SearchTextSelectionInNewTab(),
    new Command.CopyTextSelection()
  ],
  [
    new Command.SearchClipboard(),
    new Command.SearchClipboardInNewTab(),
    new Command.PasteClipboard(),
    new Command.OpenURLFromClipboard(),
    new Command.OpenURLFromClipboardInNewTab(),
    new Command.OpenURLFromClipboardInNewWindow(),
    new Command.OpenURLFromClipboardInNewPrivateWindow()
  ],
  [
    new Command.InsertCustomText()
  ],
  [
    new Command.OpenHomepage(),
    new Command.OpenAddonSettings(),
    new Command.OpenCustomURL(),
    new Command.OpenCustomURLInNewTab(),
    new Command.OpenCustomURLInNewWindow(),
    new Command.OpenCustomURLInNewPrivateWindow(),
    new Command.ViewPageSourceCode()
  ],
  [
    new Command.SaveTabAsPDF(),
    new Command.SaveScreenshot(),
    new Command.PrintTab(),
    new Command.OpenPrintPreview()
  ],
  [
    new Command.PopupAllTabs(),
    new Command.PopupRecentlyClosedTabs(),
    new Command.PopupSearchEngines(),
    new Command.PopupCustomCommandList()
  ],
  [
    new Command.SendMessageToOtherAddon(),
    new Command.ExecuteUserScript(),
    new Command.ClearBrowsingData()
  ]
];
