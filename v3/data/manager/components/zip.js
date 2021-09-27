/* globals zip */

const z = {};

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
      r.readAsArrayBuffer(z[request.id].source);
    }
    else {
      fetch(z[request.id].source).then(async r => {
        if (r.ok) {
          const reader = r.body.getReader();
          const chunks = [];
          let size = 0;
          while(true) {
            const {done, value} = await reader.read();
            if (done) {
              break;
            }
            chunks.push(value);
            size += value.length;
            document.title = 'Receiving ' + api.humanFileSize(size) + '...';
          }
          const b = new Blob(chunks);
          z[request.id].iframe.contentWindow.postMessage({
            method: 'resource',
            value: await b.arrayBuffer(),
            name: 'noname'
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
    console.log(request);
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
