import z from './zip.js';
import table from './table.js';
import toolbar from './toolbar.js';
import drag from './drag.js';

const api = {};

api.humanFileSize = size => {
  if (size === 0) {
    return '0 B';
  }
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};

api.zip = z;
api.table = table;
api.toolbar = toolbar;
api.drag = drag;

api.download = request => new Promise((resolve, reject) => {
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
            reject(lastError.message);
          });
        }
        else {
          resolve();
        }
      });
    }
    else {
      resolve();
    }
  });
})

export default api;

