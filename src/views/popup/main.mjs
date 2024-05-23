import ConfigManager from "/core/helpers/config-manager.mjs";

import DefaultConfig from "/resources/configs/defaults.mjs";

const Config = new ConfigManager({
  defaults: DefaultConfig
});

Promise.all([
  getActiveTab(),
  Config.loaded,
]).then(main);

let activeTab;

function main(args) {
  [activeTab] = args;
  const tabUrl = new URL(activeTab.url);
  const shortUrl = toShortURL(tabUrl);
  // insert text from language files
  for (let element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = browser.i18n.getMessage(element.dataset.i18n);
  }
  // register permission change handler and run it initially
  browser.permissions.onRemoved.addListener(onPermissionChange);
  browser.permissions.onAdded.addListener(onPermissionChange);
  onPermissionChange();
  // apply theme class
  const themeValue = Config.get("Settings.General.theme");
  document.documentElement.classList.add(`${themeValue}-theme`);
  // register button event listeners
  const settingsButton = document.getElementById('settingsButton');
        settingsButton.addEventListener('click', openSettings);
  const permissionRequestButton = document.getElementById('permissionRequestButton');
        permissionRequestButton.title = browser.i18n.getMessage('popupMissingPermissionButtonTooltip');
        permissionRequestButton.addEventListener('click', requestGlobalPermissions);
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
  const tabUrl = new URL(activeTab.url);
  const shortUrl = toShortURL(tabUrl);

  const [
    _hasGlobalPermission,
    _isRestrictedPage,
  ] = await Promise.all([
    hasGlobalPermission(),
    isRestrictedPage(activeTab),
  ]);

  // warnings:
  let hasWarning = false;

  const permissionRequestButton = document.getElementById('permissionRequestButton');
        permissionRequestButton.hidden = _hasGlobalPermission;
  hasWarning ||= !permissionRequestButton.hidden;

  const restrictedPageWarning = document.getElementById('restrictedPageWarning');
        restrictedPageWarning.hidden = hasWarning || !_isRestrictedPage;
  hasWarning ||= !restrictedPageWarning.hidden;

  // exclusion toggle (only show when no warnings):
  const isActive = isActivatedOn(activeTab);
  const domainActivationButton = document.getElementById('domainActivationButton');
        domainActivationButton.hidden = hasWarning;
        domainActivationButton.title = isActive
          ? browser.i18n.getMessage('popupExclusionsToggleButtonOnTooltip', shortUrl)
          : browser.i18n.getMessage('popupExclusionsToggleButtonOffTooltip', shortUrl);
  const domainActivationButtonToggle = document.getElementById('domainActivationButtonToggle');
        domainActivationButtonToggle.checked = isActive;
}

function onDomainToggle(event) {
  const tabUrl = new URL(activeTab.url);
  if (isActivatedOn(activeTab)) {
    deactivate(tabUrl.origin);
  }
  else {
    activate(tabUrl.origin);
  }
  event.preventDefault();
  onPermissionChange();
}

// methods \\

function openSettings() {
  browser.runtime.openOptionsPage();
  window.close();
}

async function getActiveTab() {
  return (await browser.tabs.query({
    active: true,
    currentWindow: true,
  }))[0];
}

function toShortURL(url) {
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

function isActivatedOn(tab) {
  return !Config.get('Exclusions').some(
    (pattern) => new RegExp(pattern).test(tab.url)
  );
}

function activate(domain) {
  const exclusions = Config.get('Exclusions');
  const index = exclusions.findIndex(
    (pattern) => new RegExp(pattern).test(domain)
  );
  if (index > -1) {
    exclusions.splice(index, 1);
    Config.set('Exclusions', exclusions);
  }
}

function deactivate(domain) {
  // escape special regex characters
  const escapedDomain = domain.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, match => '\\'+match);
  // ^ matches beginning of input and $ matches ending of input
  const pattern = '^'+escapedDomain+'.*'+'$';

  const exclusions = Config.get('Exclusions');
        exclusions.push(pattern);
  Config.set('Exclusions', exclusions);
}

function hasGlobalPermission() {
  return browser.permissions.contains({
    origins: ['<all_urls>']
  });
}

function requestGlobalPermissions() {
  return browser.permissions.request({
    origins: ['<all_urls>']
  });
}

async function isRestrictedPage(tab) {
  // workaround to find out if the page is restricted
  try {
    await browser.tabs.sendMessage(tab.id, true);
    return false;
  }
  catch(e) {
    return true;
  }
}
