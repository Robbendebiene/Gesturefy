<div class="content-header">
  <h2>
    <locale-text key="navigationGestures"></locale-text>
  </h2>
  <form id="gestureSearchForm" class="gl-search">
    <input id="gestureSearchInput" class="gl-search-input">
    <button id="gestureSearchToggleButton" class="gl-search-input-toggle" type="button"></button>
  </form>
</div>
<ul id="gestureContainer" class="gesture-list">
  <li>
    <button id="gestureAddButton" class="gl-add-button" type="button">
      <locale-text key="gestureCreateNewButton"></locale-text>
    </button>
  </li>
</ul>

<popup-box id="gesturePopup">
  <locale-text key="gesturePopupTitleNewGesture" id="gesturePopupHeading" slot="title"></locale-text>
  <form id="gesturePopupForm" slot="content">
    <div class="gp-pattern-area">
      <locale-text key="gesturePopupLabelMouseMovement" class="gp-field-name"></locale-text>
      <div id="gesturePopupRecordingArea">
        <canvas id="gesturePopupCanvas"></canvas>
        <div id="gesturePopupPatternContainer"></div>
      </div>
    </div>

    <div class="gp-command-area">
      <locale-text key="gesturePopupLabelCommands" class="gp-field-name"></locale-text>
      <command-picker id="gesturePopupCommandPicker" name="commands" class="multi-select-field"></command-picker>
    </div>

    <label class="gp-label-area">
      <locale-text key="gesturePopupLabelOptionalLabel" class="gp-field-name"></locale-text>
      <input id="gesturePopupLabelInput" class="input-field" maxlength="100">
    </label>

    <button id="gesturePopupSaveButton" type="button">
      <locale-text key="buttonSave"></locale-text>
    </button>
  </form>
</popup-box>
