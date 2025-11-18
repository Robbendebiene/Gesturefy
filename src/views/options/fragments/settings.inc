<div class="content-header">
  <h2>
    <locale-text key="navigationSettings"></locale-text>
  </h2>
</div>
<div class="option-list">
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="settingLabelMouseButton" class="ol-name"></locale-text>
        <locale-text key="settingDescriptionMouseButton" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <div class="select-wrapper">
          <select data-config="Settings.Gesture.mouseButton" class="select-field">
            <option value="1" key="settingLabelMouseButtonLeft" is="locale-option"></option>
            <option value="2" key="settingLabelMouseButtonRight" is="locale-option"></option>
            <option value="4" key="settingLabelMouseButtonMiddle" is="locale-option"></option>
          </select>
        </div>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="settingLabelSuppressionKey" class="ol-name"></locale-text>
        <locale-text key="settingDescriptionSuppressionKey" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <div class="select-wrapper">
          <select data-config="Settings.Gesture.suppressionKey" class="select-field">
            <option value="" key="settingLabelNoneKey" is="locale-option"></option>
            <option value="altKey" key="settingLabelAltKey" is="locale-option"></option>
            <option value="ctrlKey" key="settingLabelCtrlKey" is="locale-option"></option>
            <option value="shiftKey" key="settingLabelShiftKey" is="locale-option"></option>
          </select>
        </div>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="settingLabelTimeoutActive" class="ol-name"></locale-text>
        <locale-text key="settingDescriptionTimeoutActive" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <input data-collapse="#timeoutSettings" data-config="Settings.Gesture.Timeout.active" class="toggle-button" type="checkbox">
      </div>
    </div>
    <div id="timeoutSettings" class="ol-collapsible">
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelTimeoutDuration" class="ol-name"></locale-text>
          <locale-text key="settingDescriptionTimeoutDuration" class="ol-description"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Timeout.duration" class="input-field" type="number" step="0.001" min="0.001" max="10" required>
        </div>
      </div>
    </div>
    <div class="ol-item">
      <input id="collapseAdvancedMouseGestureSettings" class="collapseButton" data-collapse="#advancedMouseGestureSettings" type="checkbox">
      <label for="collapseAdvancedMouseGestureSettings">
        <locale-text key="settingLabelAdvancedSettings"></locale-text>
      </label>
    </div>
    <div id="advancedMouseGestureSettings" class="ol-collapsible hide">
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelDistanceThreshold" class="ol-name"></locale-text>
          <locale-text key="settingDescriptionDistanceThreshold" class="ol-description"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.distanceThreshold" class="input-field" type="number" required step="1" max="999" min="0">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelMatchingAlgorithm" class="ol-name"></locale-text>
          <p class="ol-description">
            <locale-text key="settingDescriptionMatchingAlgorithm"></locale-text>
            <a target="_blank" href="https://github.com/Robbendebiene/Gesturefy/wiki/Matching-Algorithm">
              <locale-text key="settingDescriptionMatchingAlgorithmLink"></locale-text>
            </a>
          </p>
        </div>
        <div class="ol-input">
          <div class="select-wrapper">
            <select data-config="Settings.Gesture.matchingAlgorithm" class="select-field">
              <option value="combined" key="settingLabelMatchingAlgorithmCombined" is="locale-option"></option>
              <option value="strict" key="settingLabelMatchingAlgorithmStrict" is="locale-option"></option>
              <option value="shape-independent" key="settingLabelMatchingAlgorithmShapeIndependent" is="locale-option"></option>
            </select>
          </div>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelDeviationTolerance" class="ol-name"></locale-text>
          <locale-text key="settingDescriptionDeviationTolerance" class="ol-description"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.deviationTolerance" class="input-field" type="number" required step="0.01" max="1" min="0">
        </div>
      </div>
    </div>
  </section>

  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="settingLabelDisplayTrace" class="ol-name"></locale-text>
        <locale-text key="settingDescriptionDisplayTrace" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <input data-collapse="#traceSettings" data-config="Settings.Gesture.Trace.display" class="toggle-button" type="checkbox">
      </div>
    </div>
    <div id="traceSettings" class="ol-collapsible">
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelTraceColor" class="ol-name"></locale-text>
        </div>
        <div class="ol-input">
          <color-picker data-config="Settings.Gesture.Trace.Style.strokeStyle" class="color-select-field"></color-picker>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelTraceGrowth" class="ol-name"></locale-text>
          <locale-text key="settingDescriptionTraceGrowth" class="ol-description"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Trace.Style.lineGrowth" class="toggle-button" type="checkbox">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelTraceWidth" class="ol-name"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Trace.Style.lineWidth" class="input-field" type="number" required step="1" max="999" min="1">
        </div>
      </div>
    </div>
  </section>

  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="settingLabelDisplayCommand" class="ol-name"></locale-text>
        <locale-text key="settingDescriptionDisplayCommand" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <input data-collapse="#commandSettings" data-config="Settings.Gesture.Command.display" class="toggle-button" type="checkbox">
      </div>
    </div>
    <div id="commandSettings" class="ol-collapsible">
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelCommandFontColor" class="ol-name"></locale-text>
        </div>
        <div class="ol-input">
          <color-picker data-config="Settings.Gesture.Command.Style.fontColor" class="color-select-field"></color-picker>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelCommandBackgroundColor" class="ol-name"></locale-text>
        </div>
        <div class="ol-input">
          <color-picker data-config="Settings.Gesture.Command.Style.backgroundColor" class="color-select-field"></color-picker>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelCommandFontSize" class="ol-name"></locale-text>
          <locale-text key="settingDescriptionCommandFontSize" class="ol-description"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Command.Style.fontSize" class="input-field" type="input" required pattern="^(0|[1-9][0-9]*)(\.[0-9]+)?(px|em|rem|ex|%|in|cm|mm|pt|pc|vh|vw|vmin|vmax)$">
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelCommandHorizontalPosition" class="ol-name"></locale-text>
          <locale-text key="settingDescriptionCommandHorizontalPosition" class="ol-description"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Command.Style.horizontalPosition" class="input-field" type="number" min="0" max="100" required>
        </div>
      </div>
      <div class="ol-item">
        <div class="ol-label">
          <locale-text key="settingLabelCommandVerticalPosition" class="ol-name"></locale-text>
          <locale-text key="settingDescriptionCommandVerticalPosition" class="ol-description"></locale-text>
        </div>
        <div class="ol-input">
          <input data-config="Settings.Gesture.Command.Style.verticalPosition" class="input-field" type="number" min="0" max="100" required>
        </div>
      </div>
    </div>
  </section>

  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="settingLabelUpdateNotification" class="ol-name"></locale-text>
        <locale-text key="settingDescriptionUpdateNotification" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <input data-config="Settings.General.updateNotification" class="toggle-button" type="checkbox">
      </div>
    </div>
  </section>
</div>
