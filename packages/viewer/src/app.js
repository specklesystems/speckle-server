
import Viewer from './modules/Viewer'

let v = new Viewer( { container: document.getElementById( 'renderer' ), showStats: true } )
v.on( 'load-progress', args => console.log( `Load progress ${args.progress} (on object ${args.id})` ) )

window.v = v
window.addEventListener( 'load', () => {
  v.onWindowResize()
} )

const token = 'e844747dc6f6b0b5c7d5fbd82d66de6e9529531d75'

window.LoadData = async function LoadData( url ) {
  url = url || document.getElementById( 'objectUrlInput' ).value
  await v.loadObject( url, token )
}
