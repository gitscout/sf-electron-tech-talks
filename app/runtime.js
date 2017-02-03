const { app, ipcMain, BrowserWindow } = require('electron')
const Config = require('./config')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
  , workerWindow
  , menuWindow

const getFilePath = fileName =>
  url.format({
      pathname: path.join(__dirname, `${fileName}.html`)
    , protocol:  'file:'
    , slashes:  true
  })

function createWindows () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width:            360
    , height:           500
    , minWidth:         360
    , minHeight:        360
    , maxWidth:         600
    , maxHeight:        600
    , show:             false
    , frame:            false
    // , titleBarStyle:    'hidden-inset'
    , acceptFirstMouse: true // TALK -  capture mouse events that simultaneously activates the window
  })

  // and load the index.html of the app.
  mainWindow.loadURL( getFilePath( 'main' ) )

  // Open the DevTools.
  // mainWindow.webContents.openDevTools( { detach: true } )

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // mainWindow.on('blur', e => console.log('blur main'))

  workerWindow = new BrowserWindow({
      width:  100
    , height: 100
    , show:   false
    , title:  'worker'
  })

  menuWindow = new BrowserWindow({
      parent:      mainWindow
    , title:       'menu'
    , frame:       false
    , transparent: true
    , hasShadow:   false
    , width:       Config.menu.width
    , height:      Config.menu.height
    // , center:      true
    // , show:        false
    // , y: 0
    // , x: 0
  })

  menuWindow.loadURL( getFilePath( 'menu' ) )
  // menuWindow.setIgnoreMouseEvents( true )

  // Open the DevTools.
  // menuWindow.webContents.openDevTools( { detach: true } )

  menuWindow.on('blur', e =>
  {
    mainWindow.webContents.send('remove-focus')
    menuWindow.webContents.send('menu-blurred')
    menuWindow.setIgnoreMouseEvents( true ) // TALK - pointer event
  })

  menuWindow.on('focus', e =>
  {
    mainWindow.webContents.send('force-focus')
    menuWindow.webContents.send('menu-focused')
    menuWindow.setIgnoreMouseEvents( false )
  })

  // Display window when App ready
  mainWindow.once('ready-to-show', () =>
  {
    mainWindow.webContents.send('force-focus')
    mainWindow.show()
    mainWindow.focus()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () =>
{
  createWindows()

  ipcMain.on('menu-show', ( e, { x, y, w, h, direction, arrow, pull } ) =>
  {
    menuWindow.webContents.send('menu-setup', { direction, arrow, pull })
    menuWindow.setSize( w, h )
    menuWindow.setPosition( x, y )
    // menuWindow.show()
    menuWindow.focus()
  })

  ipcMain.on('menu-close', ( e, motif ) =>
  {
    mainWindow.focus()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindows()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
