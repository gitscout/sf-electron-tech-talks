const { app, ipcMain, BrowserWindow } = require('electron')

const Config = require('./config')
    , path   = require('path')
    , url    = require('url')

global.getWindowId = name => windowsId[ name ]

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
  , workerWindow
  , menuWindow
  , windowsId = {}

const getFilePath = fileName =>
  url.format({
      pathname: path.join(__dirname, `${fileName}.html`)
    , protocol:  'file:'
    , slashes:  true
  })

function createWindows ()
{
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
    , acceptFirstMouse: true // TALK -  capture mouse events that simultaneously activates the window
  })

  // and load the index.html of the app.
  mainWindow.loadURL( getFilePath( 'main' ) )

  windowsId.main = mainWindow.id

  // Open the DevTools.
  mainWindow.webContents.openDevTools( { detach: true } )

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })


  menuWindow = new BrowserWindow({
      parent:      mainWindow
    , title:       'menu'
    , frame:       false
    , transparent: true
    , hasShadow:   false
    , resizable:   false
    , skipTaskbar: true
    , width:       Config.menu.width
    , height:      Config.menu.height
    // , center:      true
    // , show:        false
    // , y: 0
    // , x: 0
  })

  windowsId.menu = menuWindow.id

  menuWindow.loadURL( getFilePath( 'menu' ) )

  // Open the DevTools.
  menuWindow.webContents.openDevTools( { detach: true } )

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

const closeMenu = e => {
  mainWindow.webContents.send('remove-focus')
  mainWindow.focus()
  menuWindow.webContents.send('menu-blurred')
  menuWindow.setIgnoreMouseEvents( true ) // TALK - pointer event
}

app.on('browser-window-blur', () =>
{
  let wins       = BrowserWindow.getAllWindows()
    , appFocused = false

  wins.forEach( function( win )
  {
    if( win.isFocused() )
      appFocused = true
  })

  if( !appFocused )
    mainWindow.webContents.send('remove-focus')
})

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
    menuWindow.focus()
  })

    //== Dropdown menu
  ipcMain.on('menu-close', closeMenu )

  ipcMain.on('ClickableRegion::mouse-event', ( e, data ) =>
  {
    const appPos  = mainWindow.getPosition()
        , menuPos = menuWindow.getPosition()


    data = Object.assign( data, {
        x: ( menuPos[0] - appPos[0] ) + data.x
      , y: ( menuPos[1] - appPos[1] ) + data.y
    })

    // TALK - click through outside app
    if( data.type === 'mouseDown' && ( data.x < 0 || data.y < 0 ) )
      return app.hide()

    mainWindow.webContents.sendInputEvent( data )

    if( data.type === 'mouseDown' || data.type === 'mouseWheel' )
      closeMenu()
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
