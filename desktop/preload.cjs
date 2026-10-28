const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopRepo', {
  info: () => ipcRenderer.invoke('repo:info'),
  saveState: (state) => ipcRenderer.invoke('repo:save-state', state),
  saveImage: (id, dataUrl) => ipcRenderer.invoke('repo:save-image', id, dataUrl),
  removeImage: (id) => ipcRenderer.invoke('repo:remove-image', id),
  rebuild: () => ipcRenderer.invoke('repo:rebuild'),
  chooseWorkspace: () => ipcRenderer.invoke('repo:choose-workspace'),
  openFolder: () => ipcRenderer.invoke('repo:open-folder'),
  onStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('repo:status', listener);
    return () => ipcRenderer.removeListener('repo:status', listener);
  }
});
