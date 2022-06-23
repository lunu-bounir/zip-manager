chrome.storage.local.get({
  'rate': true,
  'crate': 0
}, prefs => {
  const b = prefs['rate'] === false || prefs.crate < 5 || Math.random() < 0.5;
  document.getElementById('rate').classList[b ? 'add' : 'remove']('hidden');
  if (!b) {
    document.body.classList.add('rating');
  }

  if (prefs.crate < 5) {
    prefs.crate += 1;
    chrome.storage.local.set({crate: prefs.crate});
  }
});

document.getElementById('rate').onclick = () => {
  let url = 'https://chrome.google.com/webstore/detail/zip-manager/eahldalhgbpahhllfcgaobhjnmcfmlbd/reviews/';
  if (/Edg/.test(navigator.userAgent)) {
    url = 'https://microsoftedge.microsoft.com/addons/detail/clfgjlepeflafkajhkgnkfecapkdpicn';
  }
  else if (/Firefox/.test(navigator.userAgent)) {
    url = 'https://addons.mozilla.org/firefox/addon/zip-manager/reviews/';
  }
  else if (/OPR/.test(navigator.userAgent)) {
    url = 'https://addons.opera.com/extensions/details/zip-manager/';
  }

  chrome.storage.local.set({
    'rate': false
  }, () => chrome.tabs.create({
    url
  }));
};
