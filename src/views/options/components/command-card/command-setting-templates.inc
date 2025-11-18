<template data-commands="SaveImage SaveLink">
  <locale-text key="commandSettingLabelSavePromptDialog" class="command-setting-name"></locale-text>
  <input name="promptDialog" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionSavePromptDialog" class="command-setting-description"></locale-text>
</template>

<template data-commands="MoveLeftTabsToNewWindow MoveRightTabsToNewWindow">
  <locale-text key="commandSettingLabelNewWindowFocus" class="command-setting-name"></locale-text>
  <input name="focus" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionNewWindowFocus" class="command-setting-description"></locale-text>
</template>

<template data-commands="MoveLeftTabsToNewWindow MoveRightTabsToNewWindow">
  <locale-text key="commandSettingLabelTabIncludeCurrent" class="command-setting-name"></locale-text>
  <input name="includeCurrent" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionTabIncludeCurrent" class="command-setting-description"></locale-text>
</template>

<template data-commands="MoveTabRight MoveTabLeft">
  <locale-text key="commandSettingLabelTabShift" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTabShift" class="command-setting-description"></locale-text>
  <input name="shift" class="input-field" pattern="^[1-9]\d*$" type="text">
</template>

<template data-commands="SearchTextSelection SearchClipboard SearchTextSelectionInNewTab SearchClipboardInNewTab">
  <locale-text key="commandSettingLabelSearchEngineURL" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionSearchEngineURL" class="command-setting-description"></locale-text>
  <input name="searchEngineURL" class="input-field" type="url">
</template>

<template data-commands="OpenCustomURL OpenCustomURLInNewTab OpenCustomURLInNewWindow OpenCustomURLInNewPrivateWindow">
  <locale-text key="commandSettingLabelCustomURL" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionCustomURL" class="command-setting-description"></locale-text>
  <input name="url" class="input-field" required="" type="url">
</template>

<template data-commands="InsertCustomText">
  <locale-text key="commandSettingLabelCustomText" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionCustomText" class="command-setting-description"></locale-text>
  <input name="text" class="input-field" required="" type="text">
</template>

<template data-commands="NewTab DuplicateTab OpenLinkInNewTab OpenImageInNewTab SearchTextSelectionInNewTab SearchClipboardInNewTab PopupSearchEngines OpenCustomURLInNewTab OpenURLFromClipboardInNewTab">
  <locale-text key="commandSettingLabelNewTabPosition" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionNewTabPosition" class="command-setting-description"></locale-text>
  <div class="select-wrapper">
    <select name="position">
      <option value="default" key="commandSettingLabelNewTabPositionDefault" is="locale-option"></option>
      <option value="after" key="commandSettingLabelNewTabPositionAfter" is="locale-option"></option>
      <option value="before" key="commandSettingLabelNewTabPositionBefore" is="locale-option"></option>
      <option value="end" key="commandSettingLabelNewTabPositionEnd" is="locale-option"></option>
      <option value="start" key="commandSettingLabelNewTabPositionStart" is="locale-option"></option>
    </select>
  </div>
</template>

<template data-commands="NewTab DuplicateTab OpenImageInNewTab OpenLinkInNewTab SearchTextSelectionInNewTab SearchClipboardInNewTab OpenCustomURLInNewTab OpenURLFromClipboardInNewTab">
  <locale-text key="commandSettingLabelNewTabFocus" class="command-setting-name"></locale-text>
  <input name="focus" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionNewTabFocus" class="command-setting-description"></locale-text>
</template>

<template data-commands="SearchTextSelection SearchClipboard SearchTextSelectionInNewTab SearchClipboardInNewTab">
  <locale-text key="commandSettingLabelOpenEmptySearch" class="command-setting-name"></locale-text>
  <input name="openEmptySearch" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionOpenEmptySearch" class="command-setting-description"></locale-text>
</template>

<template data-commands="CloseTab">
  <locale-text key="commandSettingLabelTabNextFocus" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTabNextFocus" class="command-setting-description"></locale-text>
  <div class="select-wrapper">
    <select name="nextFocus">>
      <option value="default" key="commandSettingLabelTabNextFocusDefault" is="locale-option"></option>
      <option value="previous" key="commandSettingLabelTabNextFocusPrevious" is="locale-option"></option>
      <option value="next" key="commandSettingLabelTabNextFocusNext" is="locale-option"></option>
      <option value="recent" key="commandSettingLabelTabNextFocusRecently" is="locale-option"></option>
    </select>
  </div>
</template>

<template data-commands="CloseTab">
  <locale-text key="commandSettingLabelTabClosePinned" class="command-setting-name"></locale-text>
  <input name="closePinned" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionTabClosePinned" class="command-setting-description"></locale-text>
</template>

<template data-commands="RestoreTab">
  <locale-text key="commandSettingLabelRestoreCurrentWindow" class="command-setting-name"></locale-text>
  <input name="currentWindowOnly" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionRestoreCurrentWindow" class="command-setting-description"></locale-text>
</template>

<template data-commands="ReloadTab ReloadFrame ReloadAllTabs">
  <locale-text key="commandSettingLabelReloadCache" class="command-setting-name"></locale-text>
  <input name="cache" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionReloadCache" class="command-setting-description"></locale-text>
</template>

<template data-commands="ZoomIn ZoomOut">
  <locale-text key="commandSettingLabelZoomStep" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionZoomStep" class="command-setting-description"></locale-text>
  <input name="step" class="input-field" pattern="^\d+(\s*,\s*\d+)*$" type="text">
</template>

<template data-commands="ScrollTop ScrollBottom ScrollPageDown ScrollPageUp">
  <locale-text key="commandSettingLabelScrollDuration" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionScrollDuration" class="command-setting-description"></locale-text>
  <input name="duration" class="input-field" required="" step="1" max="5000" min="0" type="number">
</template>

<template data-commands="ScrollPageDown ScrollPageUp">
  <locale-text key="commandSettingLabelScrollProportion" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionScrollProportion" class="command-setting-description"></locale-text>
  <input name="scrollProportion" class="input-field" required="" step="0.1" max="100" min="0.1" type="number">
</template>

<template data-commands="FocusFirstTab">
  <locale-text key="commandSettingLabelFocusIncludePinned" class="command-setting-name"></locale-text>
  <input name="includePinned" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionFocusIncludePinned" class="command-setting-description"></locale-text>
</template>

<template data-commands="FocusRightTab FocusLeftTab MoveTabRight MoveTabLeft">
  <locale-text key="commandSettingLabelTabCycling" class="command-setting-name"></locale-text>
  <input name="cycling" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionTabCycling" class="command-setting-description"></locale-text>
</template>

<template data-commands="OpenLinkInNewTab">
  <locale-text key="commandSettingLabelOpenEmptyTab" class="command-setting-name"></locale-text>
  <input name="emptyTab" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionOpenEmptyTab" class="command-setting-description"></locale-text>
</template>

<template data-commands="OpenLinkInNewWindow OpenLinkInNewPrivateWindow OpenURLFromClipboardInNewWindow OpenURLFromClipboardInNewPrivateWindow">
  <locale-text key="commandSettingLabelOpenEmptyWindow" class="command-setting-name"></locale-text>
  <input name="emptyWindow" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionOpenEmptyWindow" class="command-setting-description"></locale-text>
</template>

<template data-commands="SendMessageToOtherAddon">
  <locale-text key="commandSettingLabelAddonId" class="command-setting-name"></locale-text>
  <p class="command-setting-description">
    <locale-text key="commandSettingDescriptionAddonId"></locale-text>
    <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon">
      <locale-text key="linkAdditionalInformation"></locale-text>
    </a>
  </p>
  <input name="extensionId" class="input-field" required="" type="text">
</template>

<template data-commands="SendMessageToOtherAddon">
  <locale-text key="commandSettingLabelAddonMessage" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionAddonMessage" class="command-setting-description"></locale-text>
  <textarea name="message" required=""></textarea>
</template>

<template data-commands="SendMessageToOtherAddon">
  <locale-text key="commandSettingLabelParseMessage" class="command-setting-name"></locale-text>
  <input name="parseJSON" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionParseMessage" class="command-setting-description"></locale-text>
</template>

<template data-commands="PopupAllTabs">
  <locale-text key="commandSettingLabelTabOrder" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTabOrder" class="command-setting-description"></locale-text>
  <div class="select-wrapper">
    <select name="order">
      <option value="none" key="commandSettingLabelTabOrderNone" is="locale-option"></option>
      <option value="lastAccessedAsc" key="commandSettingLabelTabOrderLastAccessedAsc" is="locale-option"></option>
      <option value="lastAccessedDesc" key="commandSettingLabelTabOrderLastAccessedDesc" is="locale-option"></option>
      <option value="alphabeticalAsc" key="commandSettingLabelTabOrderAlphabeticallyAsc" is="locale-option"></option>
      <option value="alphabeticalDesc" key="commandSettingLabelTabOrderAlphabeticallyDesc" is="locale-option"></option>
    </select>
  </div>
</template>

<template data-commands="FocusRightTab FocusLeftTab PopupAllTabs">
  <locale-text key="commandSettingLabelExcludeDiscarded" class="command-setting-name"></locale-text>
  <input name="excludeDiscarded" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionExcludeDiscarded" class="command-setting-description"></p>
</template>

<template data-commands="ExecuteUserScript">
  <locale-text key="commandSettingLabelUserScriptWarning" class="command-setting-name warning-text"></locale-text>
  <p class="command-setting-description warning-text">
    <locale-text key="commandSettingDescriptionUserScriptWarning"></locale-text>
    <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Execute-user-script" class="warning-text">
      <locale-text key="linkAdditionalInformation"></locale-text>
    </a>
  </p>
</template>

<template data-commands="ExecuteUserScript">
  <locale-text key="commandSettingLabelUserScriptCode" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionUserScriptCode" class="command-setting-description"></locale-text>
  <textarea name="userScript" required=""></textarea>
</template>

<template data-commands="ExecuteUserScript">
  <locale-text key="commandSettingLabelTargetFrame" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTargetFrame" class="command-setting-description"></locale-text>
  <div class="select-wrapper">
    <select name="targetFrame">
      <option value="sourceFrame" key="commandSettingLabelTargetFrameSourceFrame" is="locale-option"></option>
      <option value="allFrames" key="commandSettingLabelTargetFrameAllFrames" is="locale-option"></option>
      <option value="topFrame" key="commandSettingLabelTargetFrameTopFrame" is="locale-option"></option>
    </select>
  </div>
</template>

<template data-commands="IncreaseURLNumber DecreaseURLNumber">
  <locale-text key="commandSettingLabelCustomMatchPattern" class="command-setting-name"></locale-text>
  <p class="command-setting-description">
    <locale-text key="commandSettingDescriptionCustomMatchPattern"></locale-text>
    <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Regular-Expressions">
      <locale-text key="linkAdditionalInformation"></locale-text>
    </a>
  </p>
  <input name="regex" class="input-field" type="text">
</template>

<template data-commands="RunMultiPurposeCommand">
  <locale-text key="commandSettingLabelCommandSelection" class="command-setting-name"></locale-text>
  <p class="command-setting-description">
    <locale-text key="commandSettingDescriptionCommandSelection"></locale-text>
    <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Multi-purpose-command">
      <locale-text key="linkAdditionalInformation"></locale-text>
    </a>
  </p>
  <command-multi-select name="commands" class="multi-select-field"></command-multi-select>
</template>

<template data-commands="PopupCustomCommandList">
  <locale-text key="commandSettingLabelCommandSelection" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionCommandSelection" class="command-setting-description"></locale-text>
  <command-multi-select name="commands" class="multi-select-field"></command-multi-select>
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataCache" class="command-setting-name"></locale-text>
  <input name="cache" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataCookies" class="command-setting-name"></locale-text>
  <input name="cookies" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataDownloads" class="command-setting-name"></locale-text>
  <input name="downloads" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataFormData" class="command-setting-name"></locale-text>
  <input name="formData" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataHistory" class="command-setting-name"></locale-text>
  <input name="history" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataIndexedDB" class="command-setting-name"></locale-text>
  <input name="indexedDB" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataLocalStorage" class="command-setting-name"></locale-text>
  <input name="localStorage" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataPasswords" class="command-setting-name"></locale-text>
  <input name="passwords" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataPluginData" class="command-setting-name"></locale-text>
  <input name="pluginData" class="toggle-button" type="checkbox">
</template>

<template data-commands="ClearBrowsingData">
  <locale-text key="commandSettingLabelBrowsingDataServiceWorkers" class="command-setting-name"></locale-text>
  <input name="serviceWorkers" class="toggle-button" type="checkbox">
</template>