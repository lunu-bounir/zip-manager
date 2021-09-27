// unload
if (location.search.indexOf('mode=window') !== -1) {
  window.addEventListener('beforeunload', () => chrome.runtime.sendMessage({
    method: 'resize',
    left: window.screenX,
    top: window.screenY,
    width: Math.max(window.outerWidth, 300),
    height: Math.max(window.outerHeight, 300)
  }));
}
