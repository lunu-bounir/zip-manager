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

const download = async (entry, saveAs = false) => {
  const ab = await entry.instance.extract(entry.Path);
  const {mime} = await entry.instance.info(entry.Path);

  const b = new Blob([ab], {
    type: mime
  });
  const url = URL.createObjectURL(b);

  return api.download({
    url,
    filename: entry.Path,
    saveAs
  }).catch(e => api.toolbar.log.add(e + ' -> ' + entry.filename)).finally(() => {
    URL.revokeObjectURL(url);
  });
};
const native = async (entries, event) => {
  try {
    if (document.getElementById('native').checked === false) {
      throw Error('per user request');
    }

    const directory = await window.showDirectoryPicker();
    for (let i = 0, j = entries.length; i < j; i += 1) {
      const entry = entries[i];

      let cd = directory;
      const path = entry.Path.split('/');
      const filename = path.pop();
      for (let i = 0; i < path.length; i += 1) {
        cd = await cd.getDirectoryHandle(path[i], {
          create: true
        });
      }
      const ab = await entry.instance.extract(entry.Path);

      const file = await cd.getFileHandle(filename, {
        create: true
      });
      document.title = 'Extracting ' + ((i + 1) / entries.length * 100).toFixed(0) + '% Please wait...';
      try {
        const writable = await file.createWritable();
        await writable.write(ab);
        // Close the file and write the contents to disk.
        await writable.close();
      }
      catch (e) {
        await download(entry, event.metaKey);
      }
    }
  }
  catch (e) {
    console.warn(e);
    try {
      for (let i = 0, j = entries.length; i < j; i += 1) {
        await download(entries[i], event.metaKey);
      }
    }
    catch (e) {
      api.toolbar.log.add(e);
    }
  }
  document.title = chrome.runtime.getManifest().name;
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
  else if (cmd === 'reload') {
    location.reload();
  }
});
