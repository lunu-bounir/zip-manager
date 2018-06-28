import api from './components/api.js';

window.api = api;

window.args = (location.search + '').substr(1).split('&').map(s => s.split('='))
.reduce((p, [key, value]) => {
  p[key] = decodeURIComponent(value);
  return p;
}, {});

window.open = async source => {
  const {init, Instance} = api.zip;
  await init();
  window.instance = new Instance();
  try {
    const entries = await window.instance.open(source);

    const {add, clear} = api.table;
    clear();
    entries.forEach(add);
  }
  catch(e) {
    api.toolbar.log.add(e);
  }

  api.toolbar.update();
};

api.drag.add(document.body);
api.drag.on('drop', files => window.open(files[0]));

if (window.args.url) {
  window.open(window.args.url);
}

api.toolbar.update();
