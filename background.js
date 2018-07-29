'use strict';

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'download') {
    console.log(request.filename);
    chrome.downloads.download({
      url: request.url,
      filename: request.filename
        .replace(/[`~!@#$%^&*()_|+=?;:'",<>{}[\]\\/]/gi, '_'),
      saveAs: request.saveAs
    }, () => {
      const lastError = chrome.runtime.lastError;
      response(lastError ? lastError.message : '');
    });
    return true;
  }
  else if (request.method === 'resize') {
    delete request.method;
    chrome.storage.local.set(request);
  }
});

var onCommand = (url = '') => {
  chrome.storage.local.get({
    mode: 'window',
    width: 700,
    height: 500,
    left: screen.availLeft + Math.round((screen.availWidth - 700) / 2),
    top: screen.availTop + Math.round((screen.availHeight - 500) / 2)
  }, prefs => {
    if (prefs.mode === 'window') {
      chrome.windows.create({
        url: chrome.extension.getURL('data/manager/index.html?mode=window&url=' + encodeURIComponent(url)),
        width: prefs.width,
        height: prefs.height,
        left: prefs.left,
        top: prefs.top,
        type: 'popup'
      });
    }
    else {
      chrome.tabs.create({
        url: 'data/manager/index.html?mode=tab&url=' + encodeURIComponent(url)
      });
    }
  });
};

chrome.browserAction.onClicked.addListener(() => onCommand());

{
  const onStartup = () => {
    chrome.storage.local.get({
      mode: 'window'
    }, prefs => {
      chrome.contextMenus.create({
        type: 'radio',
        id: 'mode.window',
        title: 'Window Mode',
        checked: prefs.mode === 'window',
        contexts: ['browser_action']
      });
      chrome.contextMenus.create({
        type: 'radio',
        id: 'mode.tab',
        title: 'Tab Mode',
        checked: prefs.mode !== 'window',
        contexts: ['browser_action']
      });
      chrome.contextMenus.create({
        type: 'normal',
        id: 'link.zip',
        title: 'Open with ZIP Manager',
        contexts: ['link'],
        targetUrlPatterns: ['*://*/*.zip*', '*://*/*.ZIP*']
      });
    });
  };
  chrome.runtime.onInstalled.addListener(onStartup);
  chrome.runtime.onStartup.addListener(onStartup);
}
chrome.contextMenus.onClicked.addListener(({menuItemId, linkUrl}) => {
  if (menuItemId.startsWith('mode.')) {
    chrome.storage.local.set({
      mode: menuItemId.replace('mode.', '')
    });
  }
  else if (menuItemId === 'link.zip') {
    onCommand(linkUrl);
  }
});

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': true,
  'last-update': 0
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 30 days ago.
      if (doUpdate) {
        const p = Boolean(prefs.version);
        window.setTimeout(() => chrome.tabs.create({
          url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
            '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
          active: p === false
        }), 3000);
      }
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL(
    chrome.runtime.getManifest().homepage_url + '?rd=feedback&name=' + name + '&version=' + version
  );
}
