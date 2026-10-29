import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRepo, removeImage, workspaceInfo, writeImage, writeState } from '../lib/repo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function pickUserData() {
  const candidates = [
    'D:\\Workspace\\module-board\\.electron-data',
    path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'ModuleBoard'),
    path.join(os.tmpdir(), 'ModuleBoard')
  ];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch { /* try next */ }
  }
  return path.join(os.tmpdir(), 'ModuleBoard');
}
const USER_DATA = pickUserData();
fs.mkdirSync(USER_DATA, { recursive: true });
app.setPath('userData', USER_DATA);
app.commandLine.appendSwitch('no-sandbox');
function configPath() { return path.join(app.getPath('userData'), 'workspace.json'); }
const DEFAULT_WORKSPACE = 'D:\\Workspace\\module-board';

let mainWindow = null;
let workspace = null;
let lastBuildAt = null;
let lastBuildError = null;
let buildTimer = null;

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), 'utf8'));
  } catch {
    return {};
  }
}
function writeConfig(patch) {
  const next = Object.assign(readConfig(), patch);
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2) + '\n', 'utf8');
}
function docWorkspace() {
  return path.join(app.getPath('documents'), '商业化模块工具箱');
}
function starterRoot() {
  const packaged = path.join(process.resourcesPath || '', 'starter');
  if (fs.existsSync(path.join(packaged, 'data', 'modules.json'))) return packaged;
  return path.join(__dirname, '..');
}
function copyStarter(dest) {
  const src = starterRoot();
  if (!fs.existsSync(path.join(src, 'data', 'modules.json'))) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of ['data', 'thumbs', 'template', 'build.mjs', 'dist']) {
    const from = path.join(src, name);
    if (!fs.existsSync(from)) continue;
    fs.cpSync(from, path.join(dest, name), { recursive: true });
  }
  return workspaceInfo(dest).valid;
}
function loadWorkspace() {
  const cfg = readConfig();
  const candidates = [cfg.workspace, DEFAULT_WORKSPACE, docWorkspace()].filter(Boolean);
  for (const candidate of candidates) {
    const info = workspaceInfo(candidate);
    if (info.valid) { workspace = info.root; return true; }
  }
  const dest = docWorkspace();
  if (copyStarter(dest) && workspaceInfo(dest).valid) {
    workspace = dest;
    writeConfig({ workspace });
    return true;
  }
  return false;
}
function chooseWorkspaceSync() {
  const result = dialog.showOpenDialogSync({
    title: '选择商业化模块工具箱工作区',
    defaultPath: workspace || DEFAULT_WORKSPACE,
    properties: ['openDirectory']
  });
  if (!result || !result[0]) return false;
  const info = workspaceInfo(result[0]);
  if (!info.valid) {
    dialog.showErrorBox('工作区不完整', '缺少文件：\n' + info.missing.join('\n'));
    return false;
  }
  workspace = info.root;
  writeConfig({ workspace });
  return true;
}
function runBuild(showError) {
  try {
    const out = buildRepo(workspace);
    lastBuildAt = new Date().toISOString();
    lastBuildError = null;
    if (mainWindow) mainWindow.webContents.send('repo:status', { ok: true, build: out, at: lastBuildAt });
    return out;
  } catch (err) {
    lastBuildError = err && err.message ? err.message : String(err);
    if (mainWindow) mainWindow.webContents.send('repo:status', { ok: false, error: lastBuildError });
    if (showError) dialog.showErrorBox('构建失败', lastBuildError);
    return null;
  }
}
function scheduleBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(function () { runBuild(false); }, 500);
}
function loadApp() {
  if (!mainWindow) return;
  const file = path.join(workspace, 'dist', '商业化模块工具箱编辑器.html');
  mainWindow.webContents.once('did-finish-load', function () {
    if (lastBuildError) {
      mainWindow.webContents.send('repo:status', { ok: false, error: lastBuildError });
    } else if (lastBuildAt) {
      mainWindow.webContents.send('repo:status', { ok: true, at: lastBuildAt });
    }
  });
  mainWindow.loadFile(file).catch(function (err) {
    dialog.showErrorBox('无法打开应用', String(err));
  });
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    title: '商业化模块工具箱 · 桌面版',
    backgroundColor: '#FAFBFC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setWindowOpenHandler(function () { return { action: 'deny' }; });
  mainWindow.webContents.on('will-navigate', function (event, url) {
    const target = new URL(url);
    if (target.protocol !== 'file:') event.preventDefault();
  });
  loadApp();
}

function buildMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '切换工作区…', click: async function () {
          if (!chooseWorkspaceSync()) return;
          runBuild(true);
          loadApp();
        } },
        { label: '重新构建', click: function () { runBuild(true); } },
        { label: '打开工作区文件夹', click: function () { shell.openPath(workspace); } },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新载入' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('repo:info', function () {
  return { ok: true, workspace, version: app.getVersion(), lastBuildAt, lastBuildError };
});
ipcMain.handle('repo:save-state', function (_event, state) {
  const result = writeState(workspace, state);
  scheduleBuild();
  return { ok: true, workspace, ...result };
});
ipcMain.handle('repo:save-image', function (_event, id, dataUrl) {
  const file = writeImage(workspace, id, dataUrl);
  scheduleBuild();
  return { ok: true, workspace, file };
});
ipcMain.handle('repo:remove-image', function (_event, id) {
  removeImage(workspace, id);
  scheduleBuild();
  return { ok: true, workspace };
});
ipcMain.handle('repo:rebuild', function () {
  const out = runBuild(true);
  return { ok: !!out, out, error: lastBuildError };
});
ipcMain.handle('repo:choose-workspace', function () {
  if (!chooseWorkspaceSync()) return { ok: false };
  runBuild(true);
  loadApp();
  return { ok: true, workspace };
});
ipcMain.handle('repo:open-folder', function () {
  return shell.openPath(workspace);
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', function () {
    if (!mainWindow) return;
    runBuild(false);
    loadApp();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.whenReady().then(function () {
    app.setAppUserModelId('com.pixelleap.moduleboard');
    if (!loadWorkspace() && !chooseWorkspaceSync()) {
      app.quit();
      return;
    }
    runBuild(false);
    buildMenu();
    createWindow();
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on('window-all-closed', function () { app.quit(); });
}
