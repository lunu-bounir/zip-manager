/* globals api */
'use strict';

const prefs = {
  chunks: 4,
  native: 'showDirectoryPicker' in window
};

chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  document.getElementById('native').checked = prefs.native;
});
document.getElementById('native').onchange = e => chrome.storage.local.set({
  native: e.target.checked
});

const download = (entry, saveAs = false) => new Promise(resolve => chrome.runtime.sendMessage({
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
const native = async (entries, event) => {
  try {
    if (document.getElementById('native').checked === false) {
      throw Error('per user request');
    }

    const directory = await window.showDirectoryPicker();
    for (let i = 0, j = entries.length; i < j; i += prefs.chunks) {
      await Promise.all(entries.slice(i, i + prefs.chunks).map(async entry => {
        let cd = directory;
        const path = entry.filename.split('/');
        const filename = path.pop();
        for (let i = 0; i < path.length; i += 1) {
          cd = await cd.getDirectoryHandle(path[i], {
            create: true
          });
        }
        const response = await fetch(entry.url);
        const file = await cd.getFileHandle(filename, {
          create: true
        });
        try {
          const writable = await file.createWritable();
          await response.body.pipeTo(writable);
        }
        catch (e) {
          await download(entry, event.metaKey);
        }
      }));
    }
  }
  catch (e) {
    console.warn(e);
    for (let i = 0, j = entries.length; i < j; i += prefs.chunks) {
      await Promise.all(entries.slice(i, i + prefs.chunks).map(entry => download(entry, event.metaKey)));
    }
  }
};

// dblclick
{
  const dblclick = ({target, metaKey}) => {
    const entry = target.parentNode.entry;
    if (entry) {
      native([entry], {metaKey});
    }
  };
  const root = document.querySelector('table tbody');
  root.addEventListener('dblclick', dblclick);
  let tap;
  root.addEventListener('touchstart', e => {
    const now = Date.now();
    const timesince = now - tap;
    if ((timesince < 600) && (timesince > 0)) {
      dblclick(e);
    }
    tap = Date.now();
  });
}

document.addEventListener('click', async e => {
  const cmd = e.target.dataset.cmd;

  if (cmd === 'extract') {
    const entries = api.table.entries();
    native(entries, e);
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
