/* global api */
'use strict';

const prefs = {
  chunks: 4,
  method: 'native'
};

if ('showDirectoryPicker' in window) {
  document.getElementById('native').disabled = false;
}
else {
  if (prefs.method === 'native') {
    prefs.method = 'download';
  }
}

chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  document.getElementById('native').checked = prefs.method === 'native';
  document.getElementById('download').checked = prefs.method === 'download';
  document.getElementById('tab').checked = prefs.method === 'tab';
});
document.getElementById('method').onchange = e => chrome.storage.local.set({
  method: e.target.id
});

const entry2blob = async entry => {
  const ab = await entry.instance.extract(entry.Path);
  const {mime} = await entry.instance.info(entry.Path);

  return new Blob([ab], {
    type: mime
  });
};

const download = async (entry, saveAs = false) => {
  api.toolbar.notify('Downloading ' + entry.Path + '...');

  const b = await entry2blob(entry);
  const url = URL.createObjectURL(b);

  return api.download({
    url,
    filename: entry.Path,
    saveAs
  }).catch(e => api.toolbar.log.add(e + ' -> ' + entry.Path)).finally(() => {
    setTimeout(() => URL.revokeObjectURL(url), /Firefox/.test(navigator.userAgent) ? 30000 : 0);
  });
};

const decide = async (entries, event) => {
  if (document.getElementById('download').checked) {
    try {
      for (let i = 0, j = entries.length; i < j; i += 1) {
        await download(entries[i], event.metaKey);
      }
    }
    catch (e) {
      console.warn(e);
      api.toolbar.log.add(e);
    }
  }
  else if (document.getElementById('native').checked) {
    await native(entries, event);
  }
  else {
    if (entries.length > 5) {
      if (confirm(`Are you sure you want to open ${entries.length} new tabs?`) !== true) {
        throw Error('UserAbort');
      }
    }
    for (const entry of entries) {
      const b = await entry2blob(entry);
      const url = URL.createObjectURL(b);
      chrome.tabs.create({
        url
      });
    }
  }

  api.toolbar.notify('Done!', 3000);
};

const native = async (entries, event) => {
  try {
    const directory = await window.showDirectoryPicker({
      id: 'zip-manager',
      mode: 'readwrite'
    });
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
      api.toolbar.notify('Extracting ' + ((i + 1) / entries.length * 100).toFixed(0) + '% Please wait...');
      try {
        const writable = await file.createWritable();
        await writable.write(ab);
        // Close the file and write the contents to disk.
        await writable.close();
      }
      catch (e) {
        console.warn(e);
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
      console.warn(e);
      api.toolbar.log.add(e);
    }
  }
};

// dblclick
{
  const dblclick = ({target, metaKey}) => {
    const entry = target.parentNode.entry;
    if (entry) {
      decide([entry], {metaKey});
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

document.addEventListener('click', e => {
  const cmd = e.target.dataset.cmd;

  if (cmd === 'extract') {
    const entries = api.table.entries();
    decide(entries, e);
  }
  else if (cmd === 'open') {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
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
