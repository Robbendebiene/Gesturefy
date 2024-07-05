import { getActiveTab } from "/core/utils/commons.mjs";

import ExclusionService from "/core/services/exclusion-service.mjs";

import HostPermissionService from "/core/services/host-permission-service.mjs";

import ConfigManager from "/core/services/config-manager.mjs";

import DefaultConfig from "/resources/configs/defaults.mjs";

const Config = new ConfigManager({
  defaults: DefaultConfig
});

const Exclusions = new ExclusionService();

const HostPermissions = new HostPermissionService();

Promise.all([
  getActiveTab(),
  Config.loaded,
  Exclusions.loaded,
]).then(main);

let activeTab;

function main(args) {
  [activeTab] = args;
  const shortUrl = toShortURL(activeTab.url);
  // insert text from language files
  for (let element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = browser.i18n.getMessage(element.dataset.i18n);
  }
  // register permission change handler and run it initially
  HostPermissions.addEventListener('change', onPermissionChange);
  Exclusions.addEventListener('change', onPermissionChange);
  onPermissionChange();
  // apply theme class
  const themeValue = Config.get("Settings.General.theme");
  document.documentElement.classList.add(`${themeValue}-theme`);
  // register button event listeners
  const settingsButton = document.getElementById('settingsButton');
        settingsButton.addEventListener('click', openSettings);
  const permissionRequestButton = document.getElementById('permissionRequestButton');
        permissionRequestButton.title = browser.i18n.getMessage('popupMissingPermissionButtonTooltip');
        permissionRequestButton.addEventListener('click', HostPermissions.requestGlobalPermission);
  const restrictedPageWarningText = document.getElementById('restrictedPageWarningText');
        restrictedPageWarningText.textContent = browser.i18n.getMessage('popupProhibitedPageWarning', shortUrl);
  const domainActivationButton = document.getElementById('domainActivationButton');
        domainActivationButton.style.setProperty('--favicon-url', `url(${activeTab.favIconUrl})`);
  const domainActivationButtonText = document.getElementById('domainActivationButtonText');
        domainActivationButtonText.textContent = browser.i18n.getMessage('popupExclusionsToggleButton', shortUrl);
  // use click instead of change to prevent default
  const domainActivationButtonToggle = document.getElementById('domainActivationButtonToggle');
        domainActivationButtonToggle.addEventListener('click', onDomainToggle);
}

// handlers \\

async function onPermissionChange() {
  const shortUrl = toShortURL(activeTab.url);

  const [
    _hasGlobalPermission,
    _hasTabPermission,
  ] = await Promise.all([
    HostPermissions.hasGlobalPermission(),
    HostPermissions.hasTabPermission(activeTab.id),
  ]);

  // warnings:
  let hasWarning = false;

  const permissionRequestButton = document.getElementById('permissionRequestButton');
        permissionRequestButton.hidden = _hasGlobalPermission;
  hasWarning ||= !permissionRequestButton.hidden;

  const restrictedPageWarning = document.getElementById('restrictedPageWarning');
        restrictedPageWarning.hidden = hasWarning || _hasTabPermission;
  hasWarning ||= !restrictedPageWarning.hidden;

  // exclusion toggle (only show when no warnings):
  const isActive = Exclusions.isEnabledFor(activeTab.url);
  const domainActivationButton = document.getElementById('domainActivationButton');
        domainActivationButton.hidden = hasWarning;
        domainActivationButton.title = isActive
          ? browser.i18n.getMessage('popupExclusionsToggleButtonOnTooltip', shortUrl)
          : browser.i18n.getMessage('popupExclusionsToggleButtonOffTooltip', shortUrl);
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
  url = new URL(url);
  if (url.protocol === 'about:') {
    return  url.protocol + url.pathname;
  }
  else if (url.protocol === 'moz-extension:') {
    return url.protocol;
  }
  else if (url.protocol === 'chrome:') {
    return url.origin;
  }
  else {
    return url.hostname || url.origin;
  }
}
