import z from './zip.mjs';
import table from './table.mjs';
import toolbar from './toolbar.mjs';
import drag from './drag.mjs';

const api = {};

api.humanFileSize = size => {
  if (size === 0) {
    return '0 B';
  }
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(1) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
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
});

export default api;

