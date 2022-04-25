const args = new URLSearchParams(location.search);

let sevenZip;
let name;
let stdout = '';
let stderr = '';
const buffer = [];

let password = '';

import('./7z-wasm/7zz.es6.js').then(async o => {
  sevenZip = await o.default({
    stdout(c) {
      stdout += String.fromCharCode(c);
    },
    stderr(c) {
      stderr += String.fromCharCode(c);
    },
    stdin() {
      if (buffer.length) {
        const c = buffer.shift();
        return c.charCodeAt(0);
      }

      let msg = (stderr || stdout).trim();
      stderr = '';
      stdout = '';
      if (msg) {
        if (msg.indexOf('Enter password:') !== -1) {
          msg = 'Enter password:';
        }

        let m;
        if (msg.indexOf('Enter password:') !== -1 && password) {
          m = password;
        }
        else {
          m = prompt(msg, '');
          if (msg.indexOf('Enter password:') !== -1) {
            password = m;
          }
        }
        if (m) {
          console.log(m);
          buffer.push(...(m + '\n').split(''));
          console.log(buffer);
          const c = buffer.shift();
          return c.charCodeAt(0);
        }
      }
      return null;
    }
  });
  top.postMessage({
    method: 'ready',
    id: args.get('id')
  }, '*');
});

window.addEventListener('message', e => {
  const request = e.data;

  if (request.method === 'resource') {
    name = request.name;
    const stream = sevenZip.FS.open(name, 'w+');
    sevenZip.FS.write(stream, new Uint8Array(request.value), 0, request.value.byteLength);
    sevenZip.FS.close(stream);
  }
  else if (request.method === 'list') {
    sevenZip.callMain(['l', '-ba', '-slt', name]);
    const entries = [];
    const o = {};

    if (stderr) {
      top.postMessage({
        method: 'list',
        id: args.get('id'),
        error: stderr.trim()
      }, '*');
    }
    else {
      console.log(stdout);
      stdout.trimStart().split('\n').forEach(s => {
        const [name, value] = s.split(' = ');
        if (name) {
          if (name === 'Package Size' || name === 'Size') {
            o[name] = Number(value);
          }
          else {
            o[name] = value;
          }
        }
        else {
          o.directory = o?.Attributes?.startsWith('D') || false;
          entries.push({
            ...o
          });
        }
      });
      console.log(entries);
      top.postMessage({
        method: 'list',
        id: args.get('id'),
        entries: entries.slice(0, -1)
      }, '*');
    }
    stdout = '';
    stderr = '';
  }
  else if (request.method === 'extract') {
    try {
      top.postMessage({
        method: 'file',
        value: sevenZip.FS.readFile(request.name),
        id: args.get('id')
      }, '*');
    }
    catch (e) {
      try {
        sevenZip.callMain(['x', '-aoa', name, request.name]);
        if (stderr) {
          top.postMessage({
            method: 'file',
            error: stderr,
            id: args.get('id')
          }, '*');
        }
        else {
          sevenZip.FS.chmod(request.name, 777);
          top.postMessage({
            method: 'file',
            value: sevenZip.FS.readFile(request.name),
            id: args.get('id')
          }, '*');
        }
      }
      catch (e) {
        top.postMessage({
          method: 'file',
          error: e.message || e,
          id: args.get('id')
        }, '*');
      }
    }
    stderr = '';
    stdout = '';
  }
});
