/* globals zip */

const z = {};
const isFirefox = /Firefox/.test(navigator.userAgent) || typeof InstallTrigger !== 'undefined';

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
  await require('./vendor/zip.js/zip-fs-full.js');
  // await require('./vendor/zip.js/zip-fs.js');
  // await require('./vendor/zip.js/mime-types.js');
  // const z = './vendor/zip.js/z-worker.js';
  // zip.workerScripts = {
  //   deflater: [z, './vendor/zip.js/deflate.js'],
  //   inflater: [z, './vendor/zip.js/inflate.js']
  // };
  zip.configure({
    useWebWorkers: isFirefox ? false : true
  });
};
z.get = entry => {
  const optns = {};
  if (z.password) {
    optns.password = z.password;
  }

  return entry.getData(new zip.BlobWriter(entry.mime), optns).then(b => {
    return URL.createObjectURL(b);
  })
};

class Instance {
  constructor() {}
  open(source) {
    return new Promise((resolve, reject) => {
      document.body.dataset.mode = 'parse';
      const input = new zip[typeof source === 'string' ? 'HttpReader' : 'BlobReader'](source);
      this.reader = input;

      (new zip.ZipReader(input)).getEntries({}).then(entries => {
        document.body.dataset.mode = 'ready';
        resolve(entries.map(entry => Object.assign(entry, {
          mime: zip.getMimeType(entry.filename),
          href() {
            return z.get(entry);
          }
        })));
      }).catch(reject);
    });
  }
  close() {
    return Promise.resolve();
  }
}

z.Instance = Instance;

export default z;
