const { remote, ipcRenderer, screen } = require('electron')
const { BrowserWindow } = remote
const Config = require('./config')

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

const handleToggleMenu = e =>
{
  // e.target.blur()
  const target                 = e.target
      , { bW, bH, bL, bR, bT } = getRect( document.body, 'b' )
      , { tW, tH, tL, tR, tT } = getRect( target, 't' )
      , { width, height }      = screen.getPrimaryDisplay().workAreaSize
      , [ x, y ]               = BrowserWindow.getFocusedWindow().getPosition()
      , confWidth              = Config.menu.width
      , confHeight             = Config.menu.height
      , confMinHeight          = Config.menu.minHeight

  let pull      = target.dataset && target.dataset.pull ? target.dataset.pull : 'center'
    , menuY     = y + tT + tH - 5
    , menuX     = Math.floor( x + tL - ( confWidth / 2 ) + ( tW / 2 ) )
    , menuH     = confHeight
    , menuW     = confWidth
    , direction = 'up'

  if( pull === 'left' )
    menuX = x + tL

  if( pull === 'right' )
    menuX = x + tL + tW - confWidth

  if( menuX < 0 )
  {
    pull  = 'left'
    menuX = menuX + Math.abs( menuX ) + tL
  }

  const menuRight = menuX + confWidth

  if( menuRight > width )
  {
    pull  = 'right'
    menuX = menuX - Math.abs( menuRight - width ) - ( bW - tR )
  }

  let menuHeight = menuY + confHeight

  if( menuHeight > height )
  {
    let availableH = confHeight - ( menuHeight - height )

    if( availableH > confMinHeight && menuY + availableH <= height )
    {
      menuH = availableH
    }
    else
    {
      menuY     = ( y + tT ) - confHeight + 5
      direction =  'down'
    }
  }

  let arrow = pull === 'center'
            ? ( ( x + tL ) - menuX + Math.floor( tW / 2.5 )  )
            : pull === 'left' ? 20 : 5

  forceFocus()

  ipcRenderer.send( 'menu-show', {
      x: menuX
    , y: menuY
    , h: menuH
    , w: menuW
    , direction
    , arrow
    , pull
  })
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

// Test Focus
document.addEventListener('focus', function()
{
  if( document.activeElement )
    console.info('activeElement', document.activeElement)
  else
    console.info('no activeElement')
}, true)

// document.addEventListener('keydown', handleKeyNav, false)

window.onfocus = () =>
{
  removeFocus()
  document.body.classList.add('focus')
}
window.onblur = () => document.body.classList.remove('focus')


ipcRenderer.on( 'force-focus', forceFocus )
ipcRenderer.on( 'remove-focus', removeFocus )
