<div class="content-header">
  <h2>
    <locale-text key="navigationGestures"></locale-text>
  </h2>
  <form id="gestureSearchForm" class="gl-search">
    <input id="gestureSearchInput" class="gl-search-input">
    <button id="gestureSearchToggleButton" class="gl-search-input-toggle" type="button"></button>
  </form>
</div>
<orderable-collection id="gestureContainer" exclude="#gestureAddButton" class="gesture-list">
  <button id="gestureAddButton" type="button" class="gl-add-button" >
    <locale-text key="gestureCreateNewButton"></locale-text>
  </button>
</orderable-collection>

<dialog id="gesturePopup" closedby="any" class="popup">
  <form id="gesturePopupForm" method="dialog">
    <div class="popup-head">
      <div id="gesturePopupHeading"></div>
      <button type="button" command="request-close" commandfor="gesturePopup" class="popup-close-button"></button>
    </div>
    <!-- tabindex= 0 are required to make form validation messages work -->
    <div id="gesturePopupContent" class="popup-content">
      <div class="gp-pattern-area">
        <locale-text key="gesturePopupLabelMouseMovement" class="gp-field-name"></locale-text>
        <pattern-recorder name="pattern" tabindex="0" id="gesturePopupRecordingArea"></pattern-recorder>
      </div>
      <div class="gp-command-area">
        <locale-text key="gesturePopupLabelCommands" class="gp-field-name"></locale-text>
        <command-stacker name="commandStack" tabindex="0" id="gesturePopupCommandPicker"></command-stacker>
        <button id="gesturePopupSaveButton" class="button">
          <locale-text key="buttonSave"></locale-text>
        </button>
      </div>
    </div>
  </form>
</dialog>
