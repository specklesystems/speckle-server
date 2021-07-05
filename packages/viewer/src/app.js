 /* eslint-disable */
import Viewer from './modules/Viewer'

let v = new Viewer( { container: document.getElementById( 'renderer' ), showStats: true } )
v.on( 'load-progress', args => console.log( `Load progress ${args.progress} (on object ${args.id})` ) )

window.v = v
window.addEventListener( 'load', () => {
  v.onWindowResize()
  const prevLoadUrl = localStorage.getItem( 'prevLoadUrl' )
  console.log( prevLoadUrl )
  if ( prevLoadUrl )
    document.getElementById( 'objectUrlInput' ).value = prevLoadUrl
} )

window.loadData = async function LoadData( url ) {
  url = url || document.getElementById( 'objectUrlInput' ).value
  localStorage.setItem( 'prevLoadUrl', url )
  await v.loadObject( url )
}

v.on( 'select', objects => {
  console.info( `Selection event. Current selection count: ${objects.length}.` )
  console.log( objects )
} )

v.on( 'object-doubleclicked', obj => {
  console.info( 'Object double click event.' )
  console.log( obj ? obj : 'nothing was doubleckicked.' )
} )

v.on( 'section-box', status => {
  console.info( `Section box is now ${status ? 'on' : 'off'}.` )
} )

window.viewerScreenshot = function() {
  let data = v.interactions.screenshot() // transparent png.

  let pop = window.open()
  pop.document.title = 'super screenshot'
  pop.document.body.style.backgroundColor = 'grey'

  let img = new Image()
  img.src = data
  pop.document.body.appendChild( img )
}

window.zoomFast = function(){
  v.interactions.zoomExtents( 0.95, false )
}

