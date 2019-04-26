<h2 data-i18n="navigationSettings"></h2>
<div class="option-list">
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="settingLabelMouseButton" class="ol-name"></p>
        <p data-i18n="settingDescriptionMouseButton" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <div class="select-wrapper">
          <select data-config="Settings.Gesture.mouseButton" class="select-field">
            <option value="1" data-i18n="settingLabelMouseButtonLeft"></option>
            <option value="2" data-i18n="settingLabelMouseButtonRight"></option>
            <option value="4" data-i18n="settingLabelMouseButtonMiddle"></option>
          </select>
        </div>
      </div>
    </div>
    <div class="ol-item">
      <input id="collapseAdvancedSettings" class="collapseButton" data-collapse="#advancedSettings" type="checkbox">
      <label data-i18n="settingLabelAdvancedSettings" for="collapseAdvancedSettings"></label>
    </div>
    <div id="advancedSettings" class="ol-collapsible hide">
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelDistanceThreshold" class="ol-name"></p>
          <p data-i18n="settingDescriptionDistanceThreshold" class="ol-description"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.distanceThreshold" class="input-field" type="number" required step="1" max="999" min="0">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelDistanceSensitivity" class="ol-name"></p>
          <p data-i18n="settingDescriptionDistanceSensitivity" class="ol-description"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.distanceSensitivity" class="input-field" type="number" required step="1" max="999" min="0">
        </div>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="settingLabelSuppressionKey" class="ol-name"></p>
        <p data-i18n="settingDescriptionSuppressionKey" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <div class="select-wrapper">
          <select data-config="Settings.Gesture.suppressionKey" class="select-field">
            <option value="" data-i18n="settingLabelNoneKey"></option>
            <option value="altKey" data-i18n="settingLabelAltKey"></option>
            <option value="ctrlKey" data-i18n="settingLabelCtrlKey"></option>
            <option value="shiftKey" data-i18n="settingLabelShiftKey"></option>
          </select>
        </div>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="settingLabelTimeoutActive" class="ol-name"></p>
        <p data-i18n="settingDescriptionTimeoutActive" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <input data-collapse="#timeoutSettings" data-config="Settings.Gesture.Timeout.active" id="settingTimeout" class="toggle-button" type="checkbox">
        <label for="settingTimeout"></label>
      </div>
    </div>
    <div id="timeoutSettings" class="ol-collapsible">
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelTimeoutDuration" class="ol-name"></p>
          <p data-i18n="settingDescriptionTimeoutDuration" class="ol-description"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Timeout.duration" class="input-field" type="number" step="0.1" min="0.1" max="10" required>
        </div>
      </div>
    </div>
  </section>

  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="settingLabelDisplayTrace" class="ol-name"></p>
        <p data-i18n="settingDescriptionDisplayTrace" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <input data-collapse="#traceSettings" data-config="Settings.Gesture.Trace.display" id="settingDisplayTrace" class="toggle-button" type="checkbox">
        <label for="settingDisplayTrace"></label>
      </div>
    </div>
    <div id="traceSettings" class="ol-collapsible">
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelTraceColor" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Trace.Style.strokeStyle" class="color-select-field" type="color" required>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelTraceOpacity" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Trace.Style.opacity" class="input-field" type="number" required step="0.01" max="1" min="0">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelTraceWidth" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Trace.Style.lineWidth" class="input-field" type="number" required step="1" max="999" min="1">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelTraceGrowth" class="ol-name"></p>
          <p data-i18n="settingDescriptionTraceGrowth" class="ol-description"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Trace.Style.lineGrowth" id="settingLineGrowth" class="toggle-button" type="checkbox">
          <label for="settingLineGrowth"></label>
        </div>
      </div>
    </div>
  </section>

  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="settingLabelDisplayCommand" class="ol-name"></p>
        <p data-i18n="settingDescriptionDisplayCommand" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <input data-collapse="#actionSettings" data-config="Settings.Gesture.Command.display" id="settingDisplayCommand" class="toggle-button" type="checkbox">
        <label for="settingDisplayCommand"></label>
      </div>
    </div>
    <div id="actionSettings" class="ol-collapsible">
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelCommandColor" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Command.Style.color" class="color-select-field" type="color" required>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelCommandBackgroundColor" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Command.Style.backgroundColor" class="color-select-field" type="color" required>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelCommandBackgroundOpacity" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Command.Style.backgroundOpacity" class="input-field" type="number" required step="0.01" max="1" min="0">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelCommandFontSize" class="ol-name"></p>
          <p data-i18n="settingDescriptionCommandFontSize" class="ol-description"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Command.Style.fontSize" class="input-field" type="input" required pattern="[1-9][0-9]*(px|em|ex|%|in|cm|mm|pt|pc|vh|vw|vmin|vmax)">
        </div>
      </div>
    </div>
  </section>

  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="settingLabelDisplayDirections" class="ol-name"></p>
        <p data-i18n="settingDescriptionDisplayDirections" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <input data-collapse="#directionsSettings" data-config="Settings.Gesture.Directions.display" id="settingDisplayDirections" class="toggle-button" type="checkbox">
        <label for="settingDisplayDirections"></label>
      </div>
    </div>
    <div id="directionsSettings" class="ol-collapsible">
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelDirectionsColor" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Directions.Style.color" class="color-select-field" type="color" required>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelDirectionsBackgroundColor" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Directions.Style.backgroundColor" class="color-select-field" type="color" required>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelDirectionsBackgroundOpacity" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Directions.Style.backgroundOpacity" class="input-field" type="number" required step="0.01" max="1" min="0">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelDirectionsFontSize" class="ol-name"></p>
          <p data-i18n="settingDescriptionDirectionsFontSize" class="ol-description"></p>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Directions.Style.fontSize" class="input-field" type="input" required pattern="[1-9][0-9]*(px|em|ex|%|in|cm|mm|pt|pc|vh|vw|vmin|vmax)">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <p data-i18n="settingLabelDirectionsTextAlign" class="ol-name"></p>
        </div>
        <div class="ol-input">
          <div class="select-wrapper">
            <select data-config="Settings.Gesture.Directions.Style.textAlign" class="select-field">
              <option value="left" data-i18n="settingLabelDirectionsTextAlignLeft"></option>
              <option value="right" data-i18n="settingLabelDirectionsTextAlignRight"></option>
              <option value="center" data-i18n="settingLabelDirectionsTextAlignCenter"></option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="settingLabelUpdateNotification" class="ol-name"></p>
        <p data-i18n="settingDescriptionUpdateNotification" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <input data-config="Settings.General.updateNotification" id="settingUpdateNotification" class="toggle-button" type="checkbox">
        <label for="settingUpdateNotification"></label>
      </div>
    </div>
  </section>
</div>
