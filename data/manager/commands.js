/* globals api */
'use strict';

var download = (entry, saveAs = false) => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'download',
  url: entry.url,
  filename: entry.filename,
  saveAs
}, e => {
  if (e) {
    api.toolbar.log.add(e + ' -> ' + entry.filename);
  }
  resolve();
}));

document.querySelector('table tbody').addEventListener('dblclick', ({target}) => {
  const entry = target.parentNode.entry;
  if (entry) {
    download(entry);
  }
});

document.addEventListener('click', async e => {
  const cmd = e.target.dataset.cmd;

  if (cmd === 'extract') {
    const entries = api.table.entries();

    const chunk = 4;
    for (let i = 0, j = entries.length; i < j; i += chunk) {
      await Promise.all(entries.slice(i, i + chunk).map(entry => download(entry, e.metaKey)));
    }
  }
  else if (cmd === 'open') {
    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', e => api.drag.emit('drop', [...e.target.files]));
    input.click();
  }
  else if (cmd === 'hide.log') {
    document.getElementById('log').dataset.visible = false;
  }
});
