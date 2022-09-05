//handle setupevents as quickly as possible
const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

const electron = require('electron')
// Module to control application life.
const app = electron.app
const { ipcMain, webviewTag } = require('electron')
const fs = require('fs')
var path = require('path')

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
//Adds the main Menu to our app

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let secondWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 1281,
    height: 800,
    minWidth: 1281,
    minHeight: 800,
    backgroundColor: '#312450',
    show: false,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  if (fs.existsSync('./out.txt')) {
    fs.unlinkSync('out.txt');
  }
  if (fs.existsSync('./src/UltimateBot/ultimateDebug.txt')) {
    fs.unlinkSync('src/UltimateBot/ultimateDebug.txt');
  }
  if (fs.existsSync('./src/CommandsPrinter/commandsPrinterDebug.txt')) {
    fs.unlinkSync('src/CommandsPrinter/commandsPrinterDebug.txt');
  }
  if (fs.existsSync('./src/PlacerPrinter/placerPrinterDebug.txt')) {
    fs.unlinkSync('src/PlacerPrinter/placerPrinterDebug.txt');
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Show the mainwindow when it is loaded and ready to show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  secondWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#312450',
    show: false,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })

  secondWindow.loadURL(`file://${__dirname}/windows/ipcwindow.html`)

  require('./menu/mainmenu')
}

ipcMain.on('open-second-window', (event, arg) => {
  secondWindow.show()
})

ipcMain.on('close-second-window', (event, arg) => {
  secondWindow.hide()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // App close handler
  app.quit();
});


app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
