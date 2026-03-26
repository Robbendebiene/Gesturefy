<div class="content-header">
  <h2>
    <locale-text key="navigationExtras"></locale-text>
  </h2>
</div>
<div class="option-list">
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="extraLabelRockerActive" class="ol-name"></locale-text>
        <locale-text key="extraDescriptionRockerActive" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <input data-collapse="#rockerGestureSettings" data-config="Settings.Rocker.active" class="toggle-button" type="checkbox">
      </div>
    </div>
    <collapsible-item id="rockerGestureSettings">
      <div class="ol-section">
        <div class="ol-side-by-side">
          <div class="ol-item">
            <div class="ol-label">
              <locale-text key="extraLabelRockerLeftMouseClick" class="ol-name"></locale-text>
            </div>
            <command-stacker data-config="Settings.Rocker.leftMouseClick" tabindex="0"</command-stacker>
          </div>
          <div class="ol-item">
            <div class="ol-label">
              <locale-text key="extraLabelRockerRightMouseClick" class="ol-name"></locale-text>
            </div>
            <command-stacker data-config="Settings.Rocker.rightMouseClick" tabindex="0"></command-stacker>
          </div>
        </div>
      </div>
    </collapsible-item>
  </section>
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="extraLabelWheelActive" class="ol-name"></locale-text>
        <locale-text key="extraDescriptionWheelActive" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <input data-collapse="#wheelGestureSettings" data-config="Settings.Wheel.active" class="toggle-button" type="checkbox">
      </div>
    </div>
    <collapsible-item id="wheelGestureSettings">
      <div class="ol-section">
        <div class="ol-item">
          <div class="ol-label">
            <locale-text key="extraLabelWheelMouseButton" class="ol-name"></locale-text>
            <locale-text key="extraDescriptionWheelMouseButton" class="ol-description"></locale-text>
          </div>
          <div class="ol-input">
            <div class="select-wrapper">
              <select data-config="Settings.Wheel.mouseButton" class="select-field">
                <option value="1" key="settingLabelMouseButtonLeft" is="locale-option"></option>
                <option value="2" key="settingLabelMouseButtonRight" is="locale-option"></option>
                <option value="4" key="settingLabelMouseButtonMiddle" is="locale-option"></option>
              </select>
            </div>
          </div>
        </div>
        <div class="ol-item">
          <div class="ol-label">
            <locale-text key="extraLabelWheelSensitivity" class="ol-name"></locale-text>
            <locale-text key="extraDescriptionWheelSensitivity" class="ol-description"></locale-text>
          </div>
          <div class="ol-input">
            <input data-config="Settings.Wheel.wheelSensitivity" class="input-field" type="number" required step="1" max="200" min="0">
          </div>
        </div>
        <div class="ol-side-by-side">
          <div class="ol-item">
            <div class="ol-label">
              <locale-text key="extraLabelWheelUp" class="ol-name"></locale-text>
            </div>
            <command-stacker data-config="Settings.Wheel.wheelUp" tabindex="0"></command-stacker>
          </div>
          <div class="ol-item">
            <div class="ol-label">
              <locale-text key="extraLabelWheelDown" class="ol-name"></locale-text>
            </div>
            <command-stacker data-config="Settings.Wheel.wheelDown" tabindex="0"></command-stacker>
          </div>
        </div>
      </div>
    </collapsible-item>
  </section>
</div>
