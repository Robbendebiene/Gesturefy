<div class="content-header">
  <h2>
    <locale-text key="navigationData"></locale-text>
  </h2>
</div>
<div class="option-list">
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="dataLabelFileBackup" class="ol-name"></locale-text>
        <locale-text key="dataDescriptionFileBackup" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <button id="fileBackupButton" class="button">
          <locale-text key="dataBackup"></locale-text>
        </button>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="dataLabelFileRestore" class="ol-name"></locale-text>
        <locale-text key="dataDescriptionFileRestore" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <label class="button">
          <locale-text key="dataRestore"></locale-text>
          <input type="file" id="fileRestoreButton" name="files" accept=".json" hidden>
        </label>
      </div>
    </div>
  </section>
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="dataLabelCloudBackup" class="ol-name"></locale-text>
        <locale-text key="dataDescriptionCloudBackup" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <button id="cloudBackupButton" class="button">
          <locale-text key="dataCloudUpload"></locale-text>
        </button>
      </div>
    </div>
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="dataLabelCloudRestore" class="ol-name"></locale-text>
        <locale-text key="dataDescriptionCloudRestore" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <button id="cloudRestoreButton" class="button">
          <locale-text key="dataCloudDownload"></locale-text>
        </button>
      </div>
    </div>
  </section>
  <section class="ol-section">
    <div class="ol-item">
      <div class="ol-label">
        <locale-text key="dataLabelResetConfig" class="ol-name"></locale-text>
        <locale-text key="dataDescriptionResetConfig" class="ol-description"></locale-text>
      </div>
      <div class="ol-input">
        <button id="configResetButton" class="button danger" type="button">
          <locale-text key="dataReset"></locale-text>
        </button>
      </div>
    </div>
  </section>
</div>

<popup-box id="restoreAlertNoConfigFile" type="alert">
  <locale-text key="dataRestore" slot="title"></locale-text>
  <locale-text key="dataRestoreNotificationNoConfigFile" slot="content"></locale-text>
</popup-box>

<popup-box id="restoreAlertWrongFile" type="alert">
  <locale-text key="dataRestore" slot="title"></locale-text>
  <locale-text key="dataRestoreNotificationWrongFile" slot="content"></locale-text>
</popup-box>

<popup-box id="restoreConfirm" type="confirm">
  <locale-text key="dataRestore" slot="title"></locale-text>
  <locale-text key="dataRestoreNotificationConfirm" slot="content"></locale-text>
</popup-box>

<popup-box id="restoreAlertSuccess" type="alert">
  <locale-text key="dataRestore" slot="title"></locale-text>
  <locale-text key="dataRestoreNotificationSuccess" slot="content"></locale-text>
</popup-box>

<popup-box id="uploadConfirm" type="confirm">
  <locale-text key="dataCloudUpload" slot="title"></locale-text>
  <locale-text key="dataUploadNotificationConfirm" slot="content"></locale-text>
</popup-box>

<popup-box id="uploadAlertSuccess" type="alert">
  <locale-text key="dataCloudUpload" slot="title"></locale-text>
  <locale-text key="dataUploadNotificationSuccess" slot="content"></locale-text>
</popup-box>

<popup-box id="downloadConfirm" type="confirm">
  <locale-text key="dataCloudDownload" slot="title"></locale-text>
  <locale-text key="dataDownloadNotificationConfirm" slot="content"></locale-text>
</popup-box>

<popup-box id="downloadAlertSuccess" type="alert">
  <locale-text key="dataCloudDownload" slot="title"></locale-text>
  <locale-text key="dataDownloadNotificationSuccess" slot="content"></locale-text>
</popup-box>

<popup-box id="resetConfirm" type="confirm">
  <locale-text key="dataReset" slot="title"></locale-text>
  <locale-text key="dataResetNotificationConfirm" slot="content"></locale-text>
</popup-box>
