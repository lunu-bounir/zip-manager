'use strict';

const onCommand = async (url = '') => {
  const win = await chrome.windows.getCurrent();

  const prefs = await chrome.storage.local.get({
    mode: 'window',
    width: 700,
    height: 500,
    left: win.left + Math.round((win.width - 700) / 2),
    top: win.top + Math.round((win.height - 500) / 2)
  });

  if (prefs.mode === 'window') {
    chrome.windows.create({
      url: '/data/manager/index.html?mode=window&url=' + encodeURIComponent(url),
      width: prefs.width,
      height: prefs.height,
      left: prefs.left,
      top: prefs.top,
      type: 'popup'
    });
  }
  else {
    chrome.tabs.create({
      url: '/data/manager/index.html?mode=tab&url=' + encodeURIComponent(url)
    });
  }
};

chrome.action.onClicked.addListener(() => onCommand());

{
  const onStartup = async () => {
    if (onStartup.done) {
      return;
    }
    onStartup.done = true;

    const prefs = await chrome.storage.local.get({
      mode: 'window'
    });

    chrome.contextMenus.create({
      type: 'radio',
      id: 'mode.window',
      title: 'Window Mode',
      checked: prefs.mode === 'window',
      contexts: ['action']
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      type: 'radio',
      id: 'mode.tab',
      title: 'Tab Mode',
      checked: prefs.mode !== 'window',
      contexts: ['action']
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: 's1',
      contexts: ['action'],
      type: 'separator'
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: 'sample',
      title: 'Test ZIP Manager',
      contexts: ['action']
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      type: 'normal',
      id: 'link.zip',
      title: 'Open with ZIP Manager',
      contexts: ['link'],
      targetUrlPatterns: ['7z', 'apk', 'dmg', 'iso', 'pkg', 'rar', 'tar', 'zip', 'gz'].map(a => `*://*/*.${a}*`),
      documentUrlPatterns: ['*://*/*']
    }, () => chrome.runtime.lastError);
  };
  chrome.runtime.onInstalled.addListener(onStartup);
  chrome.runtime.onStartup.addListener(onStartup);
}
chrome.contextMenus.onClicked.addListener(({menuItemId, linkUrl}, tab) => {
  if (menuItemId.startsWith('mode.')) {
    chrome.storage.local.set({
      mode: menuItemId.replace('mode.', '')
    });
  }
  else if (menuItemId === 'link.zip') {
    onCommand(linkUrl);
  }
  else if (menuItemId === 'sample') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/test-download-with/',
      index: tab.index + 1
    });
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
