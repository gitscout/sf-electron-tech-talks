const { remote, ipcRenderer } = require('electron')

const menuArrow     = document.getElementById('menu-arrow')
    , menuShield    = document.getElementById('menu-shield')
    , menuShieldDiv = menuShield.querySelector('div')
    , body          = document.body

ipcRenderer.on('menu-focused', e =>
{
  document.addEventListener('keydown', handleKeyNav, false)
  body.classList.remove('blurred')
  body.classList.add('focused')
})

ipcRenderer.on('menu-blurred', e =>
{
  document.removeEventListener('keydown', handleKeyNav, false)
  body.classList.remove('focused')
  body.classList.add('blurred')
})


ipcRenderer.on('menu-showlayer', ( e, showBkgd ) =>
{
  if( showBkgd )
    body.classList.add('show-bkgd')
  else
    body.classList.remove('show-bkgd')
})

ipcRenderer.on('menu-setup', ( e, props ) =>
{
  body.classList.add('menu-ready')
  body.classList.remove('reversed')

  if( props.direction === 'down' )
    body.classList.add('reversed')

  menuArrow.removeAttribute('style')
  menuArrow.style.left = props.arrow + 'px'

  menuShield.removeAttribute('style')
  menuShield.style.cssText = 'flex: 0 0 '+props.shieldHeight+'px'

  menuShieldDiv.removeAttribute('style')
  menuShieldDiv.style.cssText = 'width: '+props.shieldWidth+'px; height: '+props.shieldHeight+'px; left: '+props.shieldLeft+'px'
})

menuShieldDiv.addEventListener('click', e =>
{
  console.log('click shield')
  ipcRenderer.send('menu-close')
})

const handleKeyNav = e =>
{
  // e.preventDefault()
  // e.stopPropagation()

  // tab
  if( e.keyCode === 9 )
    return ipcRenderer.send('menu-close', 'tab')

  // esc
  if( e.keyCode === 27 )
  {
    // H-CASE
    e.preventDefault()
    e.stopPropagation()

    return ipcRenderer.send('menu-close', 'esc')
  }
}

// based on 'Electron click through transparency example'
// https://gist.github.com/StickyCube/ed79421bc53cba38f5b74b060d3f15fa

const getEventModifiers = evt => [
    { field: 'ctrlKey', name: 'control' }
  , { field: 'shiftKey', name: 'shift' }
  , { field: 'altKey', name: 'alt' }
  , { field: 'metaKey', name: 'meta' }
].filter(elm => evt[elm.field]).map(elm => elm.name)

const getEventButton = evt =>
{
  switch( evt.button )
  {
    case 2: return 'right'
    case 1: return 'middle'
    case 0:
    default: return 'left'
  }
}

window.onEvent = function (type, e)
{
  var target = e.target

  if( !target.dataset || !target.dataset.clickable )
    return

  var _event = {
      type
    , modifiers:  getEventModifiers(e)
    , button:     getEventButton(e)
    , x:          e.clientX
    , y:          e.clientY
    , globalX:    e.screenX
    , globalY:    e.screenY
    , movementX:  e.movementX
    , movementY:  e.movementY
    , clickCount: e.detail
  }

  if( type === 'mouseWheel' )
    _event = Object.assign( _event, {
        deltaX: e.deltaX
      , deltaY: e.deltaY
    })

  return ipcRenderer.send('ClickableRegion::mouse-event', _event )
}

body.addEventListener('mouseup',    e => onEvent('mouseUp', e),    false )
body.addEventListener('mousedown',  e => onEvent('mouseDown', e),  false )
body.addEventListener('mouseenter', e => onEvent('mouseEnter', e), false )
body.addEventListener('mouseleave', e => onEvent('mouseLeave', e), false )
body.addEventListener('mousemove',  e => onEvent('mouseMove', e),  false )
body.addEventListener('mousewheel', e => onEvent('mouseWheel', e), false )
