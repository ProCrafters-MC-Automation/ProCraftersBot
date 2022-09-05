const { app, ipcMain, dialog, Menu} = require('electron')
const { store } = require('./assets/class/common/cfuns')
const path = require('path')
const fs = require('fs')
const Window = require('./assets/class/window/Window');
// app ready and quit
app.whenReady().then(main);
app.on('window-all-closed', function() {
  app.quit()
})
//multi connect mode
ipcMain.on('connectmulti', (e, data) => {
  const windowBot = new Window({
    file: path.join('renderer', '../BotWindow/mbotwin.html')
  })
  windowBot.webContents.once('dom-ready', () => {
    windowBot.webContents.send('startbotmulti', data)
  })
});
//single mode
ipcMain.on('connect', (e, data) => {
  const windowBot = new Window({
    file: path.join('renderer', '../BotWindow/botwin.html')
  })
  windowBot.webContents.once('dom-ready', () => {
    windowBot.webContents.send('startbot', data)
  })
});
//main on ready function
function main() {
  Menu.setApplicationMenu(null);
  const mainWindow = new Window({
    h: 725,
    w: 500,
    file: path.join('renderer', 'index.html')
  });
  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.webContents.send('verinfo')
  });
  //open sript file
  ipcMain.on('openfile', () => {
    const scriptpath = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{
        name: 'Text',
        extensions: ['txt']
      }]
    })[0]
    const script = fs.readFileSync(scriptpath).toString()
    mainWindow.webContents.send('script', (script, scriptpath))
  });
  //open account file
  ipcMain.on('openaccfile', () => {
    const accpath = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{
        name: 'Text',
        extensions: ['txt']
      }]
    })[0]
    const accounts = fs.readFileSync(accpath).toString()
    mainWindow.webContents.send('account', (accounts, accpath))
  });
};