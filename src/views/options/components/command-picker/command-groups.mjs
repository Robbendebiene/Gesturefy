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
    new Command.PinTab(),
    new Command.UnpinTab(),
    new Command.MuteTab(),
    new Command.UnmuteTab(),
  ],
  [
    new Command.AddPageBookmark(),
    new Command.RemovePageBookmark(),
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
    new Command.NewWindow(),
    new Command.CloseWindow(),
    new Command.MaximizeWindow(),
    new Command.MinimizeWindow(),
    new Command.RestoreWindowSize(),
    new Command.EnterFullscreen(),
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
    new Command.OpenImage(),
    new Command.CopyImage(),
    new Command.CopyImageURL(),
    new Command.SaveImage()
  ],
  [
    new Command.OpenLink(),
    new Command.LinkToNewBookmark(),
    new Command.CopyLinkURL(),
    new Command.SaveLink()
  ],
  [
    new Command.SearchTextSelection(),
    new Command.CopyTextSelection()
  ],
  [
    new Command.SearchClipboard(),
    new Command.PasteClipboard(),
    new Command.OpenURLFromClipboard(),
  ],
  [
    new Command.InsertCustomText()
  ],
  [
    new Command.OpenHomepage(),
    new Command.OpenAddonSettings(),
    new Command.OpenSearch(),
    new Command.OpenCustomURL(),
    new Command.ViewPageSourceCode(),
    new Command.EnterReaderMode(),
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
