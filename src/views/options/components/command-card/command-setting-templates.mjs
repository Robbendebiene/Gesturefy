// required because it must be loaded synchronously in the component
export default document.createRange().createContextualFragment(`

<template id="alias">
  <locale-text key="commandSettingLabelDisplayName" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionDisplayName" class="command-setting-description"></locale-text>
  <input name="alias" class="input-field" type="text">
</template>

<template id="promptSaveAsDialog">
  <locale-text key="commandSettingLabelSavePromptDialog" class="command-setting-name"></locale-text>
  <input name="promptSaveAsDialog" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionSavePromptDialog" class="command-setting-description"></locale-text>
</template>

<template id="focusWindow">
  <locale-text key="commandSettingLabelNewWindowFocus" class="command-setting-name"></locale-text>
  <input name="focusWindow" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionNewWindowFocus" class="command-setting-description"></locale-text>
</template>

<template id="includeCurrentTab">
  <locale-text key="commandSettingLabelTabIncludeCurrent" class="command-setting-name"></locale-text>
  <input name="includeCurrentTab" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionTabIncludeCurrent" class="command-setting-description"></locale-text>
</template>

<template id="tabShift">
  <locale-text key="commandSettingLabelTabShift" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTabShift" class="command-setting-description"></locale-text>
  <input name="tabShift" class="input-field" pattern="^[1-9]\d*$" type="text">
</template>

<template id="searchEngine">
  <locale-text key="commandSettingLabelSearchEngine" class="command-setting-name"></locale-text>
  <p class="command-setting-description">
    <locale-text key="commandSettingDescriptionSearchEngine"></locale-text>
    <a target="_blank" href="https://support.mozilla.org/kb/add-custom-search-engine-firefox">
      <locale-text key="commandSettingDescriptionSearchEngineMoreInfoLink"></locale-text>
    </a>
  </p>
  <search-engine-select name="searchEngine"></search-engine-select>
</template>

<template id="url">
  <locale-text key="commandSettingLabelCustomURL" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionCustomURL" class="command-setting-description"></locale-text>
  <input name="url" class="input-field" required="" type="url">
</template>

<template id="text">
  <locale-text key="commandSettingLabelCustomText" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionCustomText" class="command-setting-description"></locale-text>
  <input name="text" class="input-field" required="" type="text">
</template>

<template id="openTarget">
  <locale-text key="commandSettingLabelNavigationTarget" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionNavigationTarget" class="command-setting-description"></locale-text>
  <select name="openTarget" class="select-field">
    <option
      value="currentTab"
      key="commandSettingLabelNavigationTargetCurrentTab"
      is="locale-option">
    </option>
    <option
      value="newTab"
      key="commandSettingLabelNavigationTargetNewTab"
      toggle=".newTabSettings"
      is="toggle-option">
    </option>
    <option
      value="newWindow"
      key="commandSettingLabelNavigationTargetNewWindow"
      toggle=".newWindowSettings"
      is="toggle-option">
    </option>
  </select>
</template>

<template id="tabPosition" class="newTabSettings">
  <locale-text key="commandSettingLabelNewTabPosition" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionNewTabPosition" class="command-setting-description"></locale-text>
  <select name="tabPosition" class="select-field">
    <option value="default" key="commandSettingLabelNewTabPositionDefault" is="locale-option"></option>
    <option value="after" key="commandSettingLabelNewTabPositionAfter" is="locale-option"></option>
    <option value="before" key="commandSettingLabelNewTabPositionBefore" is="locale-option"></option>
    <option value="end" key="commandSettingLabelNewTabPositionEnd" is="locale-option"></option>
    <option value="start" key="commandSettingLabelNewTabPositionStart" is="locale-option"></option>
  </select>
</template>

<template id="focusTab" class="newTabSettings">
  <locale-text key="commandSettingLabelNewTabFocus" class="command-setting-name"></locale-text>
  <input name="focusTab" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionNewTabFocus" class="command-setting-description"></locale-text>
</template>

<template id="incognitoWindow" class="newWindowSettings">
  <locale-text key="commandSettingLabelIncognitoMode" class="command-setting-name"></locale-text>
  <input name="incognitoWindow" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionIncognitoMode" class="command-setting-description"></locale-text>
</template>

<template id="tabSuccessor">
  <locale-text key="commandSettingLabelTabNextFocus" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTabNextFocus" class="command-setting-description"></locale-text>
  <select name="tabSuccessor" class="select-field">
    <option value="default" key="commandSettingLabelTabNextFocusDefault" is="locale-option"></option>
    <option value="previous" key="commandSettingLabelTabNextFocusPrevious" is="locale-option"></option>
    <option value="next" key="commandSettingLabelTabNextFocusNext" is="locale-option"></option>
    <option value="recent" key="commandSettingLabelTabNextFocusRecently" is="locale-option"></option>
  </select>
</template>

<template id="closePinnedTabs">
  <locale-text key="commandSettingLabelTabClosePinned" class="command-setting-name"></locale-text>
  <input name="closePinnedTabs" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionTabClosePinned" class="command-setting-description"></locale-text>
</template>

<template id="onlyCurrentWindow">
  <locale-text key="commandSettingLabelRestoreCurrentWindow" class="command-setting-name"></locale-text>
  <input name="onlyCurrentWindow" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionRestoreCurrentWindow" class="command-setting-description"></locale-text>
</template>

<template id="reloadCache">
  <locale-text key="commandSettingLabelReloadCache" class="command-setting-name"></locale-text>
  <input name="reloadCache" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionReloadCache" class="command-setting-description"></locale-text>
</template>

<template id="zoomStep">
  <locale-text key="commandSettingLabelZoomStep" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionZoomStep" class="command-setting-description"></locale-text>
  <input name="zoomStep" class="input-field" pattern="^\d+(\s*,\s*\d+)*$" type="text">
</template>

<template id="scrollDuration">
  <locale-text key="commandSettingLabelScrollDuration" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionScrollDuration" class="command-setting-description"></locale-text>
  <input name="scrollDuration" class="input-field" required="" step="1" max="5000" min="0" type="number">
</template>

<template id="scrollProportion">
  <locale-text key="commandSettingLabelScrollProportion" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionScrollProportion" class="command-setting-description"></locale-text>
  <input name="scrollProportion" class="input-field" required="" step="0.1" max="100" min="0.1" type="number">
</template>

<template id="includePinnedTabs">
  <locale-text key="commandSettingLabelFocusIncludePinned" class="command-setting-name"></locale-text>
  <input name="includePinnedTabs" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionFocusIncludePinned" class="command-setting-description"></locale-text>
</template>

<template id="extensionId">
  <locale-text key="commandSettingLabelAddonId" class="command-setting-name"></locale-text>
  <p class="command-setting-description">
    <locale-text key="commandSettingDescriptionAddonId"></locale-text>
    <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon">
      <locale-text key="linkAdditionalInformation"></locale-text>
    </a>
  </p>
  <input name="extensionId" class="input-field" required="" type="text">
</template>

<template id="extensionMessage">
  <locale-text key="commandSettingLabelAddonMessage" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionAddonMessage" class="command-setting-description"></locale-text>
  <textarea name="extensionMessage" required=""></textarea>
</template>

<template id="extensionMessageAsJSON">
  <locale-text key="commandSettingLabelParseMessage" class="command-setting-name"></locale-text>
  <input name="extensionMessageAsJSON" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionParseMessage" class="command-setting-description"></locale-text>
</template>

<template id="tabsOrder">
  <locale-text key="commandSettingLabelTabOrder" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTabOrder" class="command-setting-description"></locale-text>
  <select name="tabsOrder" class="select-field">
    <option value="none" key="commandSettingLabelTabOrderNone" is="locale-option"></option>
    <option value="lastAccessedAsc" key="commandSettingLabelTabOrderLastAccessedAsc" is="locale-option"></option>
    <option value="lastAccessedDesc" key="commandSettingLabelTabOrderLastAccessedDesc" is="locale-option"></option>
    <option value="alphabeticalAsc" key="commandSettingLabelTabOrderAlphabeticallyAsc" is="locale-option"></option>
    <option value="alphabeticalDesc" key="commandSettingLabelTabOrderAlphabeticallyDesc" is="locale-option"></option>
  </select>
</template>

<template id="excludeDiscardedTabs">
  <locale-text key="commandSettingLabelExcludeDiscarded" class="command-setting-name"></locale-text>
  <input name="excludeDiscardedTabs" class="toggle-button" type="checkbox">
  <locale-text key="commandSettingDescriptionExcludeDiscarded" class="command-setting-description"></locale-text>
</template>

<template id="userScript">
  <locale-text key="commandSettingLabelUserScriptCode" class="command-setting-name"></locale-text>
  <p class="command-setting-description">
    <locale-text key="commandSettingDescriptionUserScriptCode"></locale-text>
    <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Execute-user-script" class="warning-text">
      <locale-text key="linkAdditionalInformation"></locale-text>
    </a>
  </p>
  <textarea name="userScript" required=""></textarea>
</template>

<template id="userScriptTarget">
  <locale-text key="commandSettingLabelTargetFrame" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionTargetFrame" class="command-setting-description"></locale-text>
  <select name="userScriptTarget" class="select-field">
    <option value="sourceFrame" key="commandSettingLabelTargetFrameSourceFrame" is="locale-option"></option>
    <option value="allFrames" key="commandSettingLabelTargetFrameAllFrames" is="locale-option"></option>
    <option value="topFrame" key="commandSettingLabelTargetFrameTopFrame" is="locale-option"></option>
  </select>
</template>

<template id="matchPattern">
  <locale-text key="commandSettingLabelCustomMatchPattern" class="command-setting-name"></locale-text>
  <p class="command-setting-description">
    <locale-text key="commandSettingDescriptionCustomMatchPattern"></locale-text>
    <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Regular-Expressions">
      <locale-text key="linkAdditionalInformation"></locale-text>
    </a>
  </p>
  <input name="matchPattern" class="input-field" type="text">
</template>

<template id="commands">
  <locale-text key="commandSettingLabelCommandSelection" class="command-setting-name"></locale-text>
  <locale-text key="commandSettingDescriptionCommandSelection" class="command-setting-description"></locale-text>
  <command-stacker name="commands"></command-stacker>
</template>

<template id="clearCache">
  <locale-text key="commandSettingLabelBrowsingDataCache" class="command-setting-name"></locale-text>
  <input name="clearCache" class="toggle-button" type="checkbox">
</template>

<template id="clearCookies">
  <locale-text key="commandSettingLabelBrowsingDataCookies" class="command-setting-name"></locale-text>
  <input name="clearCookies" class="toggle-button" type="checkbox">
</template>

<template id="clearDownloads">
  <locale-text key="commandSettingLabelBrowsingDataDownloads" class="command-setting-name"></locale-text>
  <input name="clearDownloads" class="toggle-button" type="checkbox">
</template>

<template id="clearFormData">
  <locale-text key="commandSettingLabelBrowsingDataFormData" class="command-setting-name"></locale-text>
  <input name="clearFormData" class="toggle-button" type="checkbox">
</template>

<template id="clearHistory">
  <locale-text key="commandSettingLabelBrowsingDataHistory" class="command-setting-name"></locale-text>
  <input name="clearHistory" class="toggle-button" type="checkbox">
</template>

<template id="clearIndexedDB">
  <locale-text key="commandSettingLabelBrowsingDataIndexedDB" class="command-setting-name"></locale-text>
  <input name="clearIndexedDB" class="toggle-button" type="checkbox">
</template>

<template id="clearLocalStorage">
  <locale-text key="commandSettingLabelBrowsingDataLocalStorage" class="command-setting-name"></locale-text>
  <input name="clearLocalStorage" class="toggle-button" type="checkbox">
</template>

<template id="clearPasswords">
  <locale-text key="commandSettingLabelBrowsingDataPasswords" class="command-setting-name"></locale-text>
  <input name="clearPasswords" class="toggle-button" type="checkbox">
</template>

<template id="clearPluginData">
  <locale-text key="commandSettingLabelBrowsingDataPluginData" class="command-setting-name"></locale-text>
  <input name="clearPluginData" class="toggle-button" type="checkbox">
</template>

<template id="clearServiceWorkers">
  <locale-text key="commandSettingLabelBrowsingDataServiceWorkers" class="command-setting-name"></locale-text>
  <input name="clearServiceWorkers" class="toggle-button" type="checkbox">
</template>

`);
