import api from './components/api.js';

window.api = api;
var instances = [];

window.args = new URLSearchParams(location.search);

window.open = async sources => {
  const {init, Instance} = api.zip;
  const {add, clear} = api.table;

  if (instances.length) {
    instances.forEach(instance => instance.close());
    instances = [];
  }
  else {
    await init();
  }
  clear();
  for (const source of sources) {
    try {
      const instance = new Instance();
      instances.push(instance);
      const entries = await instance.open(source);
      entries.forEach(entry => add(entry, source.name || source));
    }
    catch(e) {
      api.toolbar.log.add(e);
    }
  }

  api.toolbar.update();
};

api.drag.add(document.body);
api.drag.on('drop', files => window.open(files));

if (window.args.get('url')) {
  window.open([window.args.get('url')]);
}

api.toolbar.update();
