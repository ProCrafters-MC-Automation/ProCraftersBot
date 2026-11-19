const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');

let store;
try {
  const Store = require('electron-store');
  store = new Store();
} catch (e) {
  const memoryStore = {};
  store = {
    get: (key) => memoryStore[key],
    set: (key, val) => { memoryStore[key] = val; }
  };
}

const debug = process.env.NODE_ENV === 'development';

function createWindow() {
  const iconPath = path.resolve(__dirname, '..', 'assets', 'icons', 'icon.png');
  const htmlPath = path.resolve(__dirname, '..', 'index.html');

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    icon: iconPath,
    webPreferences: {
      devTools: debug,
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(htmlPath);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.setBackgroundThrottling(false);
    app.focus();
  });

  ipcMain.on('minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  mainWindow.webContents.once('dom-ready', () => {
    const savedConfig = store.get('config');
    const savedTheme = store.get('theme');
    if (savedConfig) mainWindow.webContents.send('restore', savedConfig);
    if (savedTheme) mainWindow.webContents.send('restoreTheme', savedTheme);
  });
}

if (app) {
  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.on('config', (event, config) => {
    store.set('config', config);
  });

  ipcMain.on('theme', (event, themePath) => {
    store.set('theme', themePath);
  });
}

module.exports = {
  createWindow
};
