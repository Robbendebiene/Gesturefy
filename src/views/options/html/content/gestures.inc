<h2 data-i18n="navigationGestures"></h2>
<button id="gestureAddButton" class="gl-add-button icon-add" type="button"></button>
<ul id="gestureContainer" class="gesture-list">
</ul>

<popup-box id="gesturePopup">
  <span data-i18n="gesturePopupTitleNewGesture" id="gesturePopupHeading" slot="title"></span>
  <div class="gp-wrapper" slot="content">
    <form id="gesturePopupForm">
      <div class="gp-field">
        <span data-i18n="gesturePopupLabelCommand" class="gp-field-name"></span>
        <p data-i18n="gesturePopupDescriptionCommand" class="gp-field-description"></p>
        <command-select id="gesturePopupCommandSelect" class="command-select-field"></command-select>
      </div>
      <label class="gp-field">
        <span data-i18n="gesturePopupLabelGestureDirections" class="gp-field-name"></span>
        <p data-i18n="gesturePopupDescriptionGestureDirections" class="gp-field-description"></p>
        <input id="gesturePopupDirectionsInput" class="input-field" pattern="(\b(?:([UDRL])(?!\2{1}))+\b)" required>
      </label>
      <label class="gp-field">
        <span data-i18n="gesturePopupLabelOptionalLabel" class="gp-field-name"></span>
        <p data-i18n="gesturePopupDescriptionOptionalLabel" class="gp-field-description"></p>
        <input id="gesturePopupLabelInput" class="input-field" maxlength="100">
      </label>
      <button id="gesturePopupSaveButton" data-i18n="buttonSave" type="submit"></button>
    </form>
    <div id="gesturePopupRecordingArea">
      <canvas id="gesturePopupCanvas"></canvas>
    </div>
  </div>
</popup-box>
