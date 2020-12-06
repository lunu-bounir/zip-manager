/* globals zip */

const z = {};

const require = src => new Promise(resolve => {
  const s = document.createElement('script');
  s.src = src;
  s.onload = () => {
    resolve();
    document.documentElement.removeChild(s);
  };
  s.onerror = () => {
    alert(`cannot resolve "${src}"`);
  };
  document.documentElement.appendChild(s);
});

z.init = async () => {
  await require('/data/manager/vendor/zip.js/WebContent/zip.js');
  await require('/data/manager/vendor/zip.js/WebContent/zip-ext.js');
  await require('/data/manager/vendor/zip.js/WebContent/mime-types.js');
  const z = '/data/manager/vendor/zip.js/WebContent/z-worker.js';
  zip.workerScripts = {
    deflater: [z, '/data/manager/vendor/zip.js/WebContent/deflate.js'],
    inflater: [z, '/data/manager/vendor/zip.js/WebContent/inflate.js']
  };
};

z.get = entry => {
  return new Promise(resolve => entry.getData(new zip.BlobWriter(entry.mime), resolve));
};

class Instance {
  constructor() {}
  open(source) {
    return new Promise((resolve, reject) => {
      document.body.dataset.mode = 'parse';
      const input = new zip[typeof source === 'string' ? 'HttpReader' : 'BlobReader'](source);
      zip.createReader(input, reader => {
        this.reader = reader;
        reader.getEntries(entries => {
          document.body.dataset.mode = 'ready';
          resolve(entries.map(entry => Object.assign(entry, {
            mime: zip.getMimeType(entry.filename)
          })));
        });
      }, e => reject(e));
    });
  }
  close() {
    return new Promise(resolve => {
      this.reader.close(resolve);
    });
  }
}

z.Instance = Instance;

export default z;
