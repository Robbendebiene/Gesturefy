<div class="content-header">
  <h2 data-i18n="navigationData"></h2>
</div>
<div class="option-list">
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="dataLabelFileBackup" class="ol-name"></p>
        <p data-i18n="dataDescriptionFileBackup" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <button id="fileBackupButton" data-i18n="dataBackup" class="button"></button>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="dataLabelFileRestore" class="ol-name"></p>
        <p data-i18n="dataDescriptionFileRestore" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <label class="button">
          <span data-i18n="dataRestore"></span>
          <input type="file" id="fileRestoreButton" name="files" accept=".json" hidden>
        </label>
      </div>
    </div>
  </section>
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="dataLabelCloudBackup" class="ol-name"></p>
        <p data-i18n="dataDescriptionCloudBackup" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <button id="cloudBackupButton" data-i18n="dataCloudUpload" class="button"></button>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="dataLabelCloudRestore" class="ol-name"></p>
        <p data-i18n="dataDescriptionCloudRestore" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <button id="cloudRestoreButton" data-i18n="dataCloudDownload" class="button"></button>
      </div>
    </div>
  </section>
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <p data-i18n="dataLabelResetConfig" class="ol-name"></p>
        <p data-i18n="dataDescriptionResetConfig" class="ol-description"></p>
      </div>
      <div class="ol-input">
        <button id="configResetButton" data-i18n="dataReset" class="button danger" type="button"></button>
      </div>
    </div>
  </section>
</div>

<popup-box id="restoreAlertNoConfigFile" type="alert">
  <span data-i18n="dataRestore" slot="title"></span>
  <span data-i18n="dataRestoreNotificationNoConfigFile" slot="content"></span>
</popup-box>

<popup-box id="restoreAlertWrongFile" type="alert">
  <span data-i18n="dataRestore" slot="title"></span>
  <span data-i18n="dataRestoreNotificationWrongFile" slot="content"></span>
</popup-box>

<popup-box id="restoreConfirm" type="confirm">
  <span data-i18n="dataRestore" slot="title"></span>
  <span data-i18n="dataRestoreNotificationConfirm" slot="content"></span>
</popup-box>

<popup-box id="restoreAlertSuccess" type="alert">
  <span data-i18n="dataRestore" slot="title"></span>
  <span data-i18n="dataRestoreNotificationSuccess" slot="content"></span>
</popup-box>

<popup-box id="uploadConfirm" type="confirm">
  <span data-i18n="dataCloudUpload" slot="title"></span>
  <span data-i18n="dataUploadNotificationConfirm" slot="content"></span>
</popup-box>

<popup-box id="uploadAlertSuccess" type="alert">
  <span data-i18n="dataCloudUpload" slot="title"></span>
  <span data-i18n="dataUploadNotificationSuccess" slot="content"></span>
</popup-box>

<popup-box id="downloadConfirm" type="confirm">
  <span data-i18n="dataCloudDownload" slot="title"></span>
  <span data-i18n="dataDownloadNotificationConfirm" slot="content"></span>
</popup-box>

<popup-box id="downloadAlertSuccess" type="alert">
  <span data-i18n="dataCloudDownload" slot="title"></span>
  <span data-i18n="dataDownloadNotificationSuccess" slot="content"></span>
</popup-box>

<popup-box id="resetConfirm" type="confirm">
  <span data-i18n="dataReset" slot="title"></span>
  <span data-i18n="dataResetNotificationConfirm" slot="content"></span>
</popup-box>

