import api from './components/api.mjs';

window.api = api;
const instances = [];

window.args = new URLSearchParams(location.search);

window.open = async sources => {
  const {Instance} = api.zip;
  const {add, clear} = api.table;

  if (instances.length) {
    instances.forEach(instance => instance.close());
    instances.length = 0;
  }
  clear();
  for (const source of sources) {
    try {
      const instance = new Instance();
      instances.push(instance);
      api.toolbar.notify(`Opening "${source.name || source}"...`);
      document.body.dataset.mode = 'fetch';
      await instance.open(source);
      document.body.dataset.mode = 'parse';
      const entries = await instance.entries();
      entries.forEach(entry => add(entry, source.name || source));
      document.body.dataset.mode = '';

      const encrypted = entries.some(e => e.encrypted);

      if (encrypted) {
        api.zip.password = prompt('This archive is encrypted. Please enter the password', '');
      }
    }
    catch (e) {
      document.body.dataset.mode = '';
      console.warn(e);
      api.toolbar.log.add(e);
    }
  }

  api.toolbar.notify.entry = sources.at(-1);
  api.toolbar.notify();

  api.toolbar.update();
};

api.drag.add(document.body);
api.drag.on('drop', files => window.open(files));

if (window.args.get('url')) {
  window.open([window.args.get('url')]);
}

api.toolbar.update();

// resize
addEventListener('resize', () => chrome.storage.local.set({
  left: window.screenX,
  top: window.screenY,
  width: Math.max(window.outerWidth, 300),
  height: Math.max(window.outerHeight, 300)
}));

// links
for (const a of [...document.querySelectorAll('[data-href]')]) {
  if (a.hasAttribute('href') === false) {
    a.href = chrome.runtime.getManifest().homepage_url + '#' + a.dataset.href;
  }
}
