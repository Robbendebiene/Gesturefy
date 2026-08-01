import { getActiveTab } from "/core/helpers/commons.mjs";

import ExclusionManager from "/core/services/exclusion-manager.mjs";

import HostPermissionService from "/core/services/host-permission-service.mjs";

import SettingsManager from "/core/services/settings-manager.mjs";

const Settings = new SettingsManager();

const Exclusions = new ExclusionManager();

const HostPermissions = new HostPermissionService();

Promise.all([
  getActiveTab(),
  Settings.loaded,
  Exclusions.loaded,
]).then(main);

let activeTab;

function main(args) {
  [activeTab] = args;
  // register permission change handler and run it initially
  HostPermissions.addEventListener('change', onPermissionChange);
  Exclusions.addEventListener('change', onPermissionChange);
  onPermissionChange();
  // apply theme class
  const themeValue = Settings.get("General.theme");
  document.documentElement.classList.add(`${themeValue}-theme`);
  // register button event listeners
  const settingsButton = document.getElementById('settingsButton');
        settingsButton.addEventListener('click', openSettings);
  const permissionRequestButton = document.getElementById('permissionRequestButton');
        permissionRequestButton.title = browser.i18n.getMessage('popupMissingPermissionButtonTooltip');
        permissionRequestButton.addEventListener('click', HostPermissions.requestGlobalPermission);
  const domainActivationButton = document.getElementById('domainActivationButton');
        domainActivationButton.style.setProperty('--favicon-url', `url(${activeTab.favIconUrl})`);
  const domainActivationButtonText = document.getElementById('domainActivationButtonText');
        domainActivationButtonText.textContent = browser.i18n.getMessage(
          'popupExclusionsToggleButton', toShortURL(activeTab.url)
        );
  // use click instead of change to prevent default
  const domainActivationButtonToggle = document.getElementById('domainActivationButtonToggle');
        domainActivationButtonToggle.addEventListener('click', onDomainToggle);
}

// handlers \\

async function onPermissionChange() {
  const [
    hasGlobalPermission,
    hasTabPermission,
  ] = await Promise.all([
    HostPermissions.hasGlobalPermission(),
    HostPermissions.hasTabPermission(activeTab),
  ]);

  // warnings:
  let hasWarning = false;

  const permissionRequestButton = document.getElementById('permissionRequestButton');
        permissionRequestButton.hidden = hasGlobalPermission;
  hasWarning ||= !permissionRequestButton.hidden;

  const activeTabIsLocalFile = activeTab.url?.startsWith('file://') ?? false;
  const localFilePermissionWarning = document.getElementById('localFilePermissionWarning');
        localFilePermissionWarning.hidden = hasWarning || !activeTabIsLocalFile || hasTabPermission;
  hasWarning ||= !localFilePermissionWarning.hidden;

  const restrictedPageWarning = document.getElementById('restrictedPageWarning');
        restrictedPageWarning.hidden = hasWarning || hasTabPermission;
  hasWarning ||= !restrictedPageWarning.hidden;

  // exclusion toggle (only show when no warnings):
  const isActive = Exclusions.isEnabledFor(activeTab.url);
  const domainActivationButton = document.getElementById('domainActivationButton');
        domainActivationButton.hidden = hasWarning;
        domainActivationButton.title = browser.i18n.getMessage(
          isActive
            ? 'popupExclusionsToggleButtonOnTooltip'
            : 'popupExclusionsToggleButtonOffTooltip',
          toShortURL(activeTab.url)
        );
  const domainActivationButtonToggle = document.getElementById('domainActivationButtonToggle');
        domainActivationButtonToggle.checked = isActive;
}

function onDomainToggle(event) {
  if (Exclusions.isEnabledFor(activeTab.url)) {
    Exclusions.disableFor(activeTab.url);
  }
  else {
    Exclusions.enableFor(activeTab.url);
  }
  event.preventDefault();
}

// methods \\

function openSettings() {
  browser.runtime.openOptionsPage();
  window.close();
}

function toShortURL(url) {
  try {
    url = new URL(url);
  }
  catch(e) {
    return url;
  }
  if (url.protocol === 'about:') {
    return  url.protocol + url.pathname;
  }
  else if (url.protocol === 'moz-extension:') {
    return url.protocol;
  }
  else if (url.protocol === 'chrome:') {
    return url.origin;
  }
  else if (url.protocol === 'file:') {
    return url.pathname;
  }
  else {
    return url.hostname || url.origin;
  }
}
