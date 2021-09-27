'use strict';

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'download') {
    const d = (filename, c) => chrome.downloads.download({
      url: request.url,
      filename,
      saveAs: request.saveAs
    }, () => {
      const lastError = chrome.runtime.lastError;
      c(lastError);
    });

    d(request.filename, lastError => {
      if (lastError) {
        d(request.filename.replace(/[`~!@#$%^&*()_|+=?;:'",<>{}[\]\\]/gi, '_'), lastError => {
          if (lastError) {
            d('unknown', () => {
              response(lastError.message);
            });
          }
          else {
            response('');
          }
        });
      }
      else {
        response('');
      }
    });

    return true;
  }
  else if (request.method === 'resize') {
    delete request.method;
    chrome.storage.local.set(request);
  }
});

const onCommand = (url = '') => {
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

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
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
