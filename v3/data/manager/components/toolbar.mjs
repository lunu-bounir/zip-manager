/* global api */

const toolbar = {};

toolbar.update = () => {
  const entries = api.table.entries();
  const size = entries.map(e => e.Size).reduce((p, c) => p + c, 0);

  document.querySelector('footer').textContent = entries.length === 0 ?
    '' :
    api.humanFileSize(size) + ' to be extracted';

  document.querySelector('header').dataset.empty = entries.length === 0;
};

toolbar.log = {};
toolbar.log.add = (msg = 'no message') => {
  const li = document.createElement('li');
  const date = document.createElement('span');
  date.textContent = (new Date()).toLocaleString();
  const content = document.createElement('span');
  content.textContent = msg;
  li.appendChild(date);
  li.appendChild(content);
  document.querySelector('#log ul').appendChild(li);
  document.getElementById('log').dataset.visible = true;
  li.scrollIntoView();
};
toolbar.log.hide = () => {
  document.getElementById('log').dataset.visible = false;
};

export default toolbar;
