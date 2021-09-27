/* globals api */
const table = {};

table.clear = () => {
  document.querySelector('main tbody').textContent = '';
};

table.add = (entry, filename = '') => {
  const directory = entry.directory;

  const tr = document.createElement('tr');

  tr.addEventListener('click', () => {
    tr.dataset.selected = tr.dataset.selected !== 'true';
    api.toolbar.update();
  });

  const name = document.createElement('td');
  name.title = name.textContent = entry.filename;
  const size = document.createElement('td');
  size.textContent = directory ? '' : api.humanFileSize(entry.uncompressedSize);
  const date = document.createElement('td');
  date.textContent = directory ? '' : (new Date(entry.rawLastModDate)).toLocaleString();
  const type = document.createElement('td');
  type.title = type.textContent = directory ? 'Directory' : entry.mime;
  const parent = document.createElement('td');
  parent.title = parent.textContent = filename;

  tr.appendChild(name);
  tr.appendChild(size);
  tr.appendChild(date);
  tr.appendChild(type);
  tr.appendChild(parent);

  tr.entry = entry;

  tr.dataset.directory = directory;
  // drop support
  tr.draggable = true;
  tr.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text', 'self');
    const filename = entry.filename.replace(/[`~!@#$%^&*()_|+=?;:'",<>{}[\]\\/]/gi, '_');
    e.dataTransfer.setData('DownloadURL', entry.mime + ':' + filename + ':' + entry.url);
  }, false);

  document.querySelector('main tbody').appendChild(tr);
};

table.entries = () => {
  const selected = document.querySelector('main tbody tr[data-selected=true]');
  return [...document.querySelectorAll('main tbody tr')]
    .filter(tr => selected ? tr.dataset.selected === 'true' : true)
    .map(tr => tr.entry)
    .filter(e => e.directory === false);
};

export default table;
