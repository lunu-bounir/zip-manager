/* global api */

const z = {};

const MIME_TYPES = {
  'image/jpeg': 'jpg',
  'application/x-javascript': 'js',
  'application/atom+xml': 'atom',
  'application/rss+xml': 'rss',
  'text/plain': 'txt',
  'text/javascript': 'js',
  'image/x-icon': 'ico',
  'image/x-ms-bmp': 'bmp',
  'image/svg+xml': 'svg',
  'application/java-archive': 'jar',
  'application/msword': 'doc',
  'application/postscript': 'ps',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/x-7z-compressed': '7z',
  'application/x-rar-compressed': 'rar',
  'application/x-shockwave-flash': 'swf',
  'application/x-xpinstall': 'xpi',
  'application/xhtml+xml': 'xhtml',
  'application/octet-stream': 'bin',
  'application/binary': 'exe',
  'audio/mpeg': 'mp3',
  'audio/mpegurl': 'm3u8',
  'video/3gpp': '3gp',
  'video/mpeg': 'mpg',
  'video/quicktime': 'mov',
  'video/x-flv': 'flv',
  'video/x-mng': 'mng',
  'video/x-ms-asf': 'asf',
  'video/x-ms-wmv': 'wmv',
  'video/x-msvideo': 'avi'
};

function guess(resp, meta = {}) {
  const href = resp.url.split('#')[0].split('?')[0];
  if (href.startsWith('data:')) {
    const mime = href.split('data:')[1].split(';')[0];
    meta.ext = (MIME_TYPES[mime] || mime.split('/')[1] || '').split(';')[0];
    meta.name = 'unknown';
    meta.mime = mime;
  }
  else {
    const fe = (href.substring(href.lastIndexOf('/') + 1) || 'unknown').slice(-100);

    const e = /(.+)\.([^.]{1,5})*$/.exec(fe);

    meta.name = e ? e[1] : fe;
    meta.mime = resp.headers.get('Content-Type') || '';
    meta.ext = e ? e[2] : (MIME_TYPES[meta.mime] || meta.mime.split('/')[1] || '').split(';')[0];
  }
}

window.addEventListener('message', e => {
  const request = e.data;

  if (request.method === 'ready') {
    if (z[request.id].source instanceof File) {
      const r = new FileReader();
      r.onload = () => {
        z[request.id].iframe.contentWindow.postMessage({
          method: 'resource',
          value: r.result,
          name: z[request.id].source.name
        }, '*');
        delete z[request.id].source;
        z[request.id].resolve();
      };
      r.onerror = e => {
        z[request.id].reject(Error(e.target.error));
        delete z[request.id].source;
      };
      r.readAsArrayBuffer(z[request.id].source);
    }
    else {
      fetch(z[request.id].source).then(async r => {
        if (r.ok) {
          const meta = {};
          guess(r, meta);
          const name = meta.name ? (meta.name + (meta.ext ? '.' + meta.ext : '')) : 'noname';
          const total = r.headers.get('Content-Length');

          const reader = r.body.getReader();
          const chunks = [];
          let size = 0;
          while (true) {
            const {done, value} = await reader.read();
            if (done) {
              break;
            }
            chunks.push(value);
            size += value.length;
            let msg = 'Receiving ' + api.humanFileSize(size);
            if (total) {
              msg += ' / ' + api.humanFileSize(total);
              msg += ' [' + (size / total * 100).toFixed(1) + '%]';
            }
            msg += '...';

            document.title = msg;
          }
          const b = new Blob(chunks);
          z[request.id].iframe.contentWindow.postMessage({
            method: 'resource',
            value: await b.arrayBuffer(),
            name
          }, '*');
          z[request.id].resolve();
        }
        else {
          throw Error('cannot fetch');
        }
      }).catch(e => z[request.id].reject(e));
    }
  }
  else if (request.method === 'list') {
    if (request.error) {
      z[request.id].reject(request.error);
    }
    else {
      z[request.id].resolve(request.entries.map(e => {
        e.instance = z[request.id].instance;

        return e;
      }));
    }
  }
  else if (request.method === 'file') {
    if (request.error) {
      z[request.id].reject(request.error);
    }
    else {
      z[request.id].resolve(request.value);
    }
  }
});


class Instance {
  constructor() {
    this.id = Math.random();
    z[this.id] = {
      instance: this
    };
  }
  async info(path) {
    const filename = path.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    if (ext) {
      const standard = await fetch('types/standard.json').then(r => r.json());
      for (const [mime, es] of Object.entries(standard)) {
        if (es.some(e => e === ext)) {
          return {mime, filename};
        }
      }
      const other = await fetch('types/other.json').then(r => r.json());
      for (const [mime, es] of Object.entries(other)) {
        if (es.some(e => e === ext)) {
          return {mime, filename};
        }
      }
    }
    return {
      mime: 'plain/text',
      filename
    };
  }
  open(source) {
    return new Promise((resolve, reject) => {
      z[this.id].resolve = resolve;
      z[this.id].reject = reject;
      z[this.id].source = source;

      const iframe = z[this.id].iframe = document.createElement('iframe');
      iframe.classList.add('zip');
      iframe.src = '/data/sandbox/index.html?id=' + this.id;
      document.body.appendChild(iframe);
    });
  }
  entries() {
    return new Promise((resolve, reject) => {
      z[this.id].resolve = resolve;
      z[this.id].reject = reject;
      z[this.id].iframe.contentWindow.postMessage({
        method: 'list',
        id: this.id
      }, '*');
    });
  }
  extract(name) {
    return new Promise((resolve, reject) => {
      z[this.id].resolve = resolve;
      z[this.id].reject = reject;
      z[this.id].iframe.contentWindow.postMessage({
        method: 'extract',
        id: this.id,
        name
      }, '*');
    });
  }
  close() {
    z[this.id].iframe.remove();
    return Promise.resolve();
  }
}

z.Instance = Instance;

export default z;
