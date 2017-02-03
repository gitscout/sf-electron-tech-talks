const { remote, ipcRenderer } = require('electron')
const menuArrow = document.getElementById('menu-arrow')

ipcRenderer.on('menu-focused', e =>
{
  document.addEventListener('keydown', handleKeyNav, false)
  document.body.classList.remove('blurred')
  document.body.classList.add('focused')
})

ipcRenderer.on('menu-blurred', e =>
{
  document.removeEventListener('keydown', handleKeyNav, false)
  document.body.classList.remove('focused')
  document.body.classList.add('blurred')
})

ipcRenderer.on('menu-setup', ( e, props ) =>
{
  document.body.classList.add('menu-ready')
  document.body.classList.remove('reversed')

  if( props.direction === 'down' )
    document.body.classList.add('reversed')

  menuArrow.removeAttribute('style')
  menuArrow.style[ props.pull !== 'right' ? 'left' : 'right' ] = props.arrow + 'px'
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
