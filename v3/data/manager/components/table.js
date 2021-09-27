/* globals api */
const table = {};

table.clear = () => {
  document.querySelector('main tbody').textContent = '';
};

table.add = (entry, filename = '') => {
  const directory = entry.directory;

  const tr = document.createElement('tr');

  tr.addEventListener('click', async () => {
    tr.dataset.selected = tr.dataset.selected !== 'true';
    api.toolbar.update();
    // drag support
    if (tr.draggable !== true) {
      try {
        const {filename, mime} = await entry.instance.info(entry.Path);
        const ab = await entry.instance.extract(entry.Path);
        const b = new Blob([ab], {
          type: mime
        });
        const url = URL.createObjectURL(b);
        tr.dataset.href = mime + ':' + filename.replace(/[`~!@#$%^&*()_|+=?;:'",<>{}[\]\\/]/gi, '_') + ':' + url;
        tr.draggable = true;
      }
      catch (e) {
        api.toolbar.log.add(e);
      }
    }
  });

  const name = document.createElement('td');
  // name.textContent = directory ? entry.Path : entry.Path.split('/').pop();
  name.textContent = name.title = entry.Path;
  const size = document.createElement('td');
  size.textContent = directory ? '' : api.humanFileSize(entry['Size']);
  const date = document.createElement('td');
  date.textContent = directory ? '' : (new Date(entry.Modified)).toLocaleString();
  const type = document.createElement('td');
  type.title = type.textContent = directory ? 'Directory' : entry.mime;
  const parent = document.createElement('td');
  parent.title = parent.textContent = filename;
  if (directory) {
    tr.dataset.id = entry.Path;
  }

  tr.appendChild(name);
  tr.appendChild(size);
  tr.appendChild(date);
  tr.appendChild(type);
  tr.appendChild(parent);

  tr.entry = entry;

  tr.dataset.directory = directory;
  // drop support
  tr.addEventListener('dragstart', async e => {
    e.dataTransfer.setData('text', 'self');
    e.dataTransfer.setData('DownloadURL', e.target.dataset.href);
  }, false);

  if (directory !== true) {
    console.log(entry);
    const id = entry.Path.split('/').slice(0, -1).join('/');
    const e = document.querySelector(`[data-id="${id}"] ~ [data-id]`);
    const v = document.querySelector(`[data-id="${id}"]`);
    if (e) {
      e.before(tr);
    }
    else if (v) {
      v.after(tr);
    }
    else {
      document.querySelector('main tbody').appendChild(tr);
    }
  }
  else {
    document.querySelector('main tbody').appendChild(tr);
  }
};

table.entries = () => {
  const selected = document.querySelector('main tbody tr[data-selected=true]');
  return [...document.querySelectorAll('main tbody tr')]
    .filter(tr => selected ? tr.dataset.selected === 'true' : true)
    .map(tr => tr.entry)
    .filter(e => e.directory !== true);
};

export default table;
