import z from './zip.js';
import table from './table.js';
import toolbar from './toolbar.js';
import drag from './drag.js';

const api = {};

api.humanFileSize = size => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};

api.zip = z;
api.table = table;
api.toolbar = toolbar;
api.drag = drag;

export default api;
