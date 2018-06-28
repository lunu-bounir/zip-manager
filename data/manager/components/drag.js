'use strict';

const drag = {};
drag.callbacks = {
  'drop': []
};

function handleDragStart(e) {
  e.target.style.opacity = '0.4';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  e.target.classList.add('over');
}

function handleDragLeave(e) {
  e.target.classList.remove('over');
}

function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  const files = [...e.dataTransfer.files];
  drag.callbacks.drop.forEach(c => c(files));
  return false;
}

function handleDragEnd(e) {
  e.target.classList.remove('over');
}

drag.add = element => {
  element.addEventListener('dragstart', handleDragStart, false);
  element.addEventListener('dragenter', handleDragEnter, false);
  element.addEventListener('dragover', handleDragOver, false);
  element.addEventListener('dragleave', handleDragLeave, false);
  element.addEventListener('drop', handleDrop, false);
  element.addEventListener('dragend', handleDragEnd, false);
};

drag.on = (name, callback) => {
  drag.callbacks[name] = drag.callbacks[name] || [];
  drag.callbacks[name].push(callback);
};

drag.emit = (name, data) => {
  (drag.callbacks[name] || []).forEach(c => c(data));
};

export default drag;
