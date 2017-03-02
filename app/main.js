const { remote, ipcRenderer, screen } = require('electron')
const { BrowserWindow } = remote

const menuConf   = require('./config').menu
    , menuWinId  = remote.getGlobal('getWindowId')( 'menu' )
    , menuWindow = BrowserWindow.fromId( menuWinId )

const getRect = ( target, prefix ) =>
{
  const rect = target.getBoundingClientRect()
      , res  = {}

  ;['bottom', 'left', 'top', 'right', 'height', 'width'].forEach( k =>
  {
    res[ prefix + k.slice(0, 1).toUpperCase() ] = Math.floor( rect[ k ] )
  })
// console.log(prefix, res)
  return res
}

const forceFocus = () => document.body.classList.add('keep-focus')
const removeFocus = () => document.body.classList.remove('keep-focus')

let showBkgd = false

document.getElementById('toggleMenuBkgd').addEventListener('mousedown', e =>
{
  e.stopPropagation()

  showBkgd = !showBkgd

  menuWindow.webContents.send('menu-showlayer', showBkgd )
})

const handleToggleMenu = e =>
{
  const target                 = e.target
      , { bW, bH, bL, bR, bT } = getRect( document.body, 'b' )
      , { tW, tH, tL, tR, tT } = getRect( target, 't' )
      , { width, height }      = screen.getPrimaryDisplay().workAreaSize
      , [ x, y ]               = BrowserWindow.getFocusedWindow().getPosition()
      , winBottomBound         = y + bH
      , confWidth              = 216 //menuConf.width
      , confShadowLeft         = 9 //menuConf.width
      , confShadowRight        = 9 //menuConf.width
      , confShadowTop          = 0 //16 //menuConf.width
      , confShadowBottom       = 0 //16 //menuConf.width
      , confHeight             = 250//182 //menuConf.height
      , confMinHeight          = 150 //menuConf.minHeight
      , pullLeftArrow          = 20
      , pullRightArrow         = 180

  let pull      = target.dataset && target.dataset.pull ? target.dataset.pull : 'center'
    , menuY     = y + tT
    , menuX     = Math.floor( x + tL - ( confWidth / 2 ) + ( tW / 2 ) )
    , menuH     = confHeight
    , menuW     = confWidth
    , direction = 'up'

  if( pull === 'left' )
    menuX = x + tL - ( confShadowLeft + ( pullLeftArrow / 2 ) )

  if( pull === 'right' )
    menuX = x + tL + tW - ( confWidth - ( pullLeftArrow / 2 ) )

  if( menuX < 0 )
    menuX = menuX + Math.abs( menuX ) + tL

  const menuRight = menuX + confWidth

  if( menuRight > width )
    menuX = menuX - ( menuRight - width )

  let menuHeight    = menuY + confHeight
    , isUnderBottom = menuY + tH > winBottomBound

  const reverseMenu = () =>
  {
    menuY = menuY - confHeight + tH
    direction =  'down'
  }

  if( isUnderBottom )
    reverseMenu()
  else
    if( menuHeight > height )
    {
      let availableH = confHeight - ( menuHeight - height )

      if( availableH > confMinHeight ) // && menuY + availableH <= height )
        menuH = availableH
      else
        reverseMenu()
    }

  let arrow = pull === 'center'
            ? ( ( x + tL ) - confShadowLeft - menuX + Math.floor( tW / 2 )  )
            : pull === 'left' ? pullLeftArrow : pullRightArrow

  // Set shield before arrow!!
  let shieldLeft = pull === 'center'
                 ? Math.floor( arrow - ( tW / 2 ) )
                 : pull === 'left' ? confShadowLeft : confWidth - tW - confShadowRight - confShadowLeft

  if( arrow < 20 )
    arrow = 20

  if( arrow > pullRightArrow )
    arrow = pullRightArrow

  forceFocus()

  const menuSetup = {
      shieldWidth: tW
    , shieldHeight: tH
    , shieldLeft
    , direction
    , arrow
    , pull
    , showBkgd }

  menuWindow.webContents.send('menu-setup', menuSetup )
  menuWindow.setSize( menuConf.width, menuConf.height )
  menuWindow.setPosition( menuX, menuY )
  menuWindow.webContents.send('menu-focused')
  menuWindow.focus()
}

const menuTriggers = document.querySelectorAll('.js-menu')

;[].forEach.call( menuTriggers, ( el, i ) =>
{
  el.onclick = handleToggleMenu
  // el.onfocus = e => handleToggleMenu( e )
  el.onkeydown = e =>
  {
    if( e.keyCode === 13 )
    {
      e.preventDefault() // TALK - loosing cursor
      handleToggleMenu( e )
    }
  }
})

let topBarMove
const topBar = document.getElementById('topBar')

// Authorize drag window from top bar
topBar.addEventListener('mousedown', e =>
{
  e.stopPropagation()

  topBarMove = {
      x: e.screenX
    , y: e.screenY
  }
})

topBar.addEventListener('mouseup', e =>
{
  if( e.screenX === topBarMove.x && e.screenY === topBarMove.y )
    ipcRenderer.send('menu-close')
})

document.body.addEventListener('mousedown', e => ipcRenderer.send('menu-close') )

// Test Focus
// document.addEventListener('focus', function()
// {
//   if( document.activeElement )
//     console.info('activeElement', document.activeElement)
//   else
//     console.info('no activeElement')
// }, true)

// document.addEventListener('keydown', handleKeyNav, false)

// Focus
let isFullscreen = false

const currentWin     = remote.getCurrentWindow()

const handleClose    = () =>
{
  if( isFullscreen )
  {
    isFullscreen = false
    currentWin.setFullScreen( isFullscreen )
  }

  currentWin.close()
}
const handleMaximize = () =>
{
  isFullscreen = !isFullscreen

  document.getElementById('traffic-minimize').disabled = isFullscreen

  currentWin.setFullScreen( isFullscreen )
}

window.onfocus = () =>
{
  removeFocus()
  document.body.classList.add('focus')
}
window.onblur = () => document.body.classList.remove('focus')


ipcRenderer.on( 'force-focus', forceFocus )
ipcRenderer.on( 'remove-focus', removeFocus )

document.getElementById('traffic-close').addEventListener('click', handleClose )
document.getElementById('traffic-minimize').addEventListener('click', e => currentWin.minimize() )
document.getElementById('traffic-maximize').addEventListener('click', handleMaximize )
